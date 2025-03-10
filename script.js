/******************************************************************************
 *  PREDEFINED VEHICLES
 *  These store base stats: acceleration, handling, frame.
 *  Squeal = handling + 2, Crunch = frame + 2 (computed at runtime).
 *****************************************************************************/
const predefinedVehicles = {
  "Motorcycle": { acceleration: 8, handling: 8, frame: 0 },
  "Snowmobile": { acceleration: 8, handling: 6, frame: 0 },
  "Horse": { acceleration: 6, handling: 7, frame: 0 },
  "Family Sedan": { acceleration: 6, handling: 8, frame: 7 },
  "Compact Car": { acceleration: 6, handling: 8, frame: 5 },
  "Sport Utility Vehicle, Civilian": { acceleration: 6, handling: 6, frame: 8 },
  "Sport Utility Vehicle, Security": { acceleration: 6, handling: 6, frame: 9 },
  "Pickup Truck": { acceleration: 6, handling: 6, frame: 7 },
  "Luxury Sedan": { acceleration: 7, handling: 8, frame: 7 },
  "Cop Car": { acceleration: 8, handling: 8, frame: 6 },
  "Muscle Car": { acceleration: 8, handling: 7, frame: 7 },
  "Sports Car": { acceleration: 9, handling: 8, frame: 5 },
  "Jeep, Civilian": { acceleration: 7, handling: 7, frame: 6 },
  "Jeep, Military": { acceleration: 8, handling: 7, frame: 6 },
  "Armored Army Vehicle": { acceleration: 4, handling: 5, frame: 10 },
  "Panel Van": { acceleration: 6, handling: 6, frame: 6 },
  "Panel Truck": { acceleration: 6, handling: 6, frame: 7 },
  "Eighteen Wheeler": { acceleration: 5, handling: 5, frame: 9 },
  "Junker Car": { acceleration: 6, handling: 6, frame: 5 },
  "Junker Pickup Truck": { acceleration: 5, handling: 6, frame: 5 },
  "Vintage Van": { acceleration: 6, handling: 5, frame: 5 },
  "Tank": { acceleration: 3, handling: 2, frame: 12 }
};

document.addEventListener('DOMContentLoaded', () => {
  let vehicles = [];
  let vehicleIdCounter = 0;
  let chaseGap = "Far"; // Overall chase gap

  // DOM elements
  const addVehicleForm = document.getElementById('addVehicleForm');
  const vehicleTypeSelect = document.getElementById('vehicleType');
  const customStatsDiv = document.getElementById('customStats');
  const vehicleNameInput = document.getElementById('vehicleName');
  const accelerationInput = document.getElementById('acceleration');
  const handlingInput = document.getElementById('handling');
  const frameInput = document.getElementById('frame');
  const vehicleRoleSelect = document.getElementById('vehicleRole');
  const controlTypeSelect = document.getElementById('controlType');

  const chaseGapSelect = document.getElementById('chaseGap');
  const pursuerList = document.getElementById('pursuerList');
  const evaderList = document.getElementById('evaderList');

  const targetVehicleSelect = document.getElementById('targetVehicle');
  const actionForm = document.getElementById('actionForm');
  const actionTypeSelect = document.getElementById('actionType');
  const rollModeRadios = document.getElementsByName('rollMode');

  // GM mode inputs
  const gmRollPanel = document.getElementById('gmRollPanel');
  const gmDrivingScoreInput = document.getElementById('gmDrivingScore');
  const gmOpponentScoreInput = document.getElementById('gmOpponentScore');
  const gmModifierInput = document.getElementById('gmModifier');
  const rollDiceButton = document.getElementById('rollDiceButton');
  const gmRollResultDiv = document.getElementById('gmRollResult');

  // Player mode inputs
  const playerRollPanel = document.getElementById('playerRollPanel');
  const playerRollResultInput = document.getElementById('playerRollResult');
  const opponentScoreInput = document.getElementById('opponentScore');

  const logList = document.getElementById('logList');
  const resetButton = document.getElementById('resetChase');

  /******************************************************************************
   * 1. Show/hide custom stats when "Custom" is chosen
   *****************************************************************************/
  vehicleTypeSelect.addEventListener('change', (e) => {
    if (e.target.value === "Custom") {
      customStatsDiv.style.display = "block";
      // Make them required only if custom
      accelerationInput.required = true;
      handlingInput.required = true;
      frameInput.required = true;
    } else {
      customStatsDiv.style.display = "none";
      accelerationInput.required = false;
      handlingInput.required = false;
      frameInput.required = false;
    }
  });

  /******************************************************************************
   * 2. Add vehicle form submission
   *****************************************************************************/
  addVehicleForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const type = vehicleTypeSelect.value;
    const name = vehicleNameInput.value.trim();
    const role = vehicleRoleSelect.value; // "Pursuer" or "Evader"
    const control = controlTypeSelect.value; // "GM" or "Player"

    let acceleration, handling, frame;
    if (type === "Custom") {
      acceleration = parseInt(accelerationInput.value, 10) || 0;
      handling = parseInt(handlingInput.value, 10) || 0;
      frame = parseInt(frameInput.value, 10) || 0;
    } else {
      // Use predefined values
      const stats = predefinedVehicles[type];
      acceleration = stats.acceleration;
      handling = stats.handling;
      frame = stats.frame;
    }

    // Derived stats
    const squeal = handling + 2;
    const crunch = frame + 2;

    const vehicle = {
      id: vehicleIdCounter++,
      type,
      name,
      acceleration,
      handling,
      frame,
      squeal,
      crunch,
      chasePoints: 0,
      role,
      control
    };

    vehicles.push(vehicle);
    updateVehicleSelect();
    updateVehicleLists();

    addVehicleForm.reset();
    customStatsDiv.style.display = "none";
    accelerationInput.required = false;
    handlingInput.required = false;
    frameInput.required = false;

    logEvent(`Added vehicle: ${name} (Type: ${type}, Role: ${role}, Control: ${control})`);
  });

  /******************************************************************************
   * 3. Update vehicle dropdown for actions
   *****************************************************************************/
  function updateVehicleSelect() {
    targetVehicleSelect.innerHTML = '';
    vehicles.forEach((v) => {
      const option = document.createElement('option');
      option.value = v.id;
      option.textContent = `${v.name} (${v.role}, ${v.control})`;
      targetVehicleSelect.appendChild(option);
    });
  }

  /******************************************************************************
   * 4. Render pursuers and evaders with "cards" showing full stats
   *****************************************************************************/
  function updateVehicleLists() {
    pursuerList.innerHTML = '';
    evaderList.innerHTML = '';

    vehicles.forEach((v) => {
      const li = document.createElement('li');
      li.className = "vehicleCard";
      li.innerHTML = `
        <h4>${v.name} (${v.control})</h4>
        <p>Acceleration: ${v.acceleration}</p>
       
