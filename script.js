/******************************************************************************
 * PREDEFINED VEHICLES
 * Each entry includes: acceleration, handling, and frame.
 * (No "driving" stat is included, since that is entered manually.)
 * Derived stats:
 *    Squeal = handling + 2
 *    Crunch = frame + 2
 *****************************************************************************/
const predefinedVehicles = {
  "Motorcycle": { acceleration: 8, handling: 8, frame: 0 },
  "Snowmobile": { acceleration: 8, handling: 6, frame: 0 },
  "Horse": { acceleration: 6, handling: 6, frame: 0 },
  "Family Sedan": { acceleration: 6, handling: 6, frame: 7 },
  "Compact Car": { acceleration: 6, handling: 7, frame: 6 },
  "Sport Utility Vehicle, Civilian": { acceleration: 6, handling: 6, frame: 7 },
  "Sport Utility Vehicle, Security": { acceleration: 7, handling: 6, frame: 7 },
  "Pickup Truck": { acceleration: 6, handling: 6, frame: 8 },
  "Luxury Sedan": { acceleration: 8, handling: 7, frame: 7 },
  "Cop Car": { acceleration: 8, handling: 8, frame: 6 },
  "Muscle Car": { acceleration: 8, handling: 8, frame: 6 },
  "Sports Car": { acceleration: 9, handling: 7, frame: 6 },
  "Jeep, Civilian": { acceleration: 6, handling: 6, frame: 7 },
  "Jeep, Military": { acceleration: 6, handling: 6, frame: 7 },
  "Armored Army Vehicle": { acceleration: 6, handling: 6, frame: 8 },
  "Panel Van": { acceleration: 6, handling: 6, frame: 8 },
  "Panel Truck": { acceleration: 6, handling: 6, frame: 8 },
  "Eighteen Wheeler": { acceleration: 5, handling: 5, frame: 9 },
  "Junker Car": { acceleration: 5, handling: 6, frame: 6 },
  "Junker Pickup Truck": { acceleration: 5, handling: 5, frame: 7 },
  "Vintage Van": { acceleration: 6, handling: 5, frame: 7 },
  "Tank": { acceleration: 3, handling: 3, frame: 12 }
};

document.addEventListener('DOMContentLoaded', () => {
  let vehicles = [];
  let vehicleIdCounter = 0;
  let chaseGap = "Far"; // Overall chase gap

  // DOM Elements for vehicle setup
  const addVehicleForm = document.getElementById('addVehicleForm');
  const vehicleTypeSelect = document.getElementById('vehicleType');
  const customStatsDiv = document.getElementById('customStats');
  const vehicleNameInput = document.getElementById('vehicleName');
  const drivingInput = document.getElementById('driving');  // Always requested
  const accelerationInput = document.getElementById('acceleration');
  const handlingInput = document.getElementById('handling');
  const frameInput = document.getElementById('frame');
  const vehicleRoleSelect = document.getElementById('vehicleRole');
  const controlTypeSelect = document.getElementById('controlType');

  // DOM Elements for dashboard
  const chaseGapSelect = document.getElementById('chaseGap');
  const pursuerList = document.getElementById('pursuerList');
  const evaderList = document.getElementById('evaderList');

  // DOM Elements for action form (dual dropdowns)
  const actingVehicleSelect = document.getElementById('actingVehicle');
  const targetVehicleSelect = document.getElementById('targetVehicle');
  const actionForm = document.getElementById('actionForm');
  const actionTypeSelect = document.getElementById('actionType');
  const rollModeRadios = document.getElementsByName('rollMode');

  // GM mode inputs
  const gmRollPanel = document.getElementById('gmRollPanel');
  const gmDrivingBaseInput = document.getElementById('gmDrivingBase');
  const gmModifierInput = document.getElementById('gmModifier');
  const rollDiceButton = document.getElementById('rollDiceButton');
  const gmRollResultDiv = document.getElementById('gmRollResult');

  // Player mode inputs
  const playerRollPanel = document.getElementById('playerRollPanel');
  const playerRollResultInput = document.getElementById('playerRollResult');

  const logList = document.getElementById('logList');
  const resetButton = document.getElementById('resetChase');

  /******************************************************************************
   * 1. Toggle custom stats for "Custom" type
   *****************************************************************************/
  vehicleTypeSelect.addEventListener('change', (e) => {
    if (e.target.value === "Custom") {
      customStatsDiv.style.display = "block";
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
    const role = vehicleRoleSelect.value;
    const control = controlTypeSelect.value;
    // Get driving score from input (always provided)
    const driving = parseInt(drivingInput.value, 10) || 0;
    let acceleration, handling, frame;
    if (type === "Custom") {
      acceleration = parseInt(accelerationInput.value, 10) || 0;
      handling = parseInt(handlingInput.value, 10) || 0;
      frame = parseInt(frameInput.value, 10) || 0;
    } else {
      const stats = predefinedVehicles[type];
      acceleration = stats.acceleration;
      handling = stats.handling;
      frame = stats.frame;
    }
    const squeal = handling + 2;
    const crunch = frame + 2;

    const vehicle = {
      id: vehicleIdCounter++,
      type,
      name,
      acceleration,
      handling,
      frame,
      driving,      // Entered manually
      squeal,
      crunch,
      chasePoints: 0,
      role,
      control
    };

    vehicles.push(vehicle);
    updateVehicleDropdowns();
    updateVehicleLists();
    addVehicleForm.reset();
    customStatsDiv.style.display = "none";
    accelerationInput.required = false;
    handlingInput.required = false;
    frameInput.required = false;
    logEvent(`Added vehicle: ${name} (Type: ${type}, Role: ${role}, Control: ${control}, Driving: ${driving})`);
  });

  /******************************************************************************
   * 3. Update vehicle dropdowns for Acting and Target vehicles
   *****************************************************************************/
  function updateVehicleDropdowns() {
    actingVehicleSelect.innerHTML = '';
    targetVehicleSelect.innerHTML = '';
    vehicles.forEach(v => {
      const optionActing = document.createElement('option');
      optionActing.value = v.id;
      optionActing.textContent = `${v.name} (${v.role}, ${v.control})`;
      actingVehicleSelect.appendChild(optionActing);

      const optionTarget = document.createElement('option');
      optionTarget.value = v.id;
      optionTarget.textContent = `${v.name} (${v.role}, ${v.control})`;
      targetVehicleSelect.appendChild(optionTarget);
    });
  }

  /******************************************************************************
   * 4. Render vehicle cards in dashboard lists with a "+" button for CP
   *****************************************************************************/
  function updateVehicleLists() {
    pursuerList.innerHTML = '';
    evaderList.innerHTML = '';
    vehicles.forEach(v => {
      const li = document.createElement('li');
      li.className = "vehicleCard";
      li.innerHTML = `
        <h4>${v.name} (${v.control})</h4>
        <p>Acceleration: ${v.acceleration}</p>
        <p>Handling: ${v.handling} (Squeal: ${v.squeal})</p>
        <p>Frame: ${v.frame} (Crunch: ${v.crunch})</p>
        <p>Driving Score: ${v.driving}</p>
        <p class="cpContainer">Chase Points: <span id="cp-${v.id}">${v.chasePoints}</span>
           <button data-id="${v.id}" class="incCP">+</button>
        </p>
      `;
      if (v.role === "Pursuer") {
        pursuerList.appendChild(li);
      } else {
        evaderList.appendChild(li);
      }
    });
    // Attach event listeners to plus buttons for manually increasing CP
    document.querySelectorAll('.incCP').forEach(button => {
      button.addEventListener('click', () => {
        const id = parseInt(button.dataset.id, 10);
        const veh = vehicles.find(v => v.id === id);
        if (veh) {
          veh.chasePoints++;
          updateVehicleLists();
          logEvent(`Manually increased CP for ${veh.name} to ${veh.chasePoints}`);
        }
      });
    });
  }

  /******************************************************************************
   * 5. Update chase gap from dropdown
   *****************************************************************************/
  chaseGapSelect.addEventListener('change', (e) => {
    chaseGap = e.target.value;
    logEvent(`Chase Gap set to: ${chaseGap}`);
  });

  /******************************************************************************
   * 6. Toggle roll mode panels
   *****************************************************************************/
  function switchRollMode(mode) {
    if (mode === "GM") {
      gmRollPanel.style.display = "block";
      playerRollPanel.style.display = "none";
      gmDrivingBaseInput.required = true;
      playerRollResultInput.required = false;
    } else {
      gmRollPanel.style.display = "none";
      playerRollPanel.style.display = "block";
      playerRollResultInput.required = true;
      gmDrivingBaseInput.required = false;
    }
  }
  rollModeRadios.forEach(radio => {
    radio.addEventListener('change', () => {
      switchRollMode(radio.value);
    });
  });
  switchRollMode("GM");

  /******************************************************************************
   * 7. GM Roll Dice Button: simulate 2d6 and compute final roll
   *****************************************************************************/
  rollDiceButton.addEventListener('click', () => {
    const drivingBase = parseInt(gmDrivingBaseInput.value, 10);
    const modifier = parseInt(gmModifierInput.value, 10) || 0;
    if (isNaN(drivingBase)) {
      alert("Please enter a valid Driving Check Base.");
      return;
    }
    const die1 = rollDie();
    const die2 = rollDie();
    const diceSum = die1 + die2;
    const isBoxcars = (die1 === 6 && die2 === 6);
    const finalCheck = diceSum + drivingBase + modifier;
    gmDrivingBaseInput.dataset.rollResult = finalCheck;
    let resultText = `Dice: ${die1}, ${die2} (Sum: ${diceSum}) → Final Check: ${finalCheck}`;
    if (isBoxcars) resultText += " (Boxcars!)";
    gmRollResultDiv.textContent = resultText;
    logEvent(`GM rolled: ${die1}, ${die2}${isBoxcars ? "!" : ""} → Final Check = ${finalCheck}`);
  });

  function rollDie() {
    return Math.floor(Math.random() * 6) + 1;
  }

  /******************************************************************************
   * 8. Action Form Submission: Apply action using dual-dropdown formula
   *
   * Formula (per manual):
   * Outcome = (Final Roll – Target's Driving Score)
   * CP Change = Outcome + (Acting Vehicle's Squeal) – (Target's Handling)
   *
   * For Driver Attack: CP Change = - (Outcome + 5)
   *****************************************************************************/
  actionForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const actionType = actionTypeSelect.value;
    const actingId = parseInt(actingVehicleSelect.value, 10);
    const targetId = parseInt(targetVehicleSelect.value, 10);
    const actingVehicle = vehicles.find(v => v.id === actingId);
    const targetVehicle = vehicles.find(v => v.id === targetId);
    if (!actingVehicle || !targetVehicle) return;
    const rollMode = document.querySelector('input[name="rollMode"]:checked').value;
    let finalRoll = 0;
    let outcome = 0;
    let cpChange = 0;
    let logCalc = "";

    if (rollMode === "GM") {
      finalRoll = parseInt(gmDrivingBaseInput.dataset.rollResult || "0", 10);
      if (isNaN(finalRoll) || finalRoll === 0) {
        alert("Please roll the dice first (GM Mode).");
        return;
      }
      logCalc += `GM Final Check: ${finalRoll} `;
    } else {
      const playerInput = playerRollResultInput.value.trim();
      finalRoll = parseInt(playerInput.replace('!', ''), 10);
      if (isNaN(finalRoll)) {
        alert("Please enter a valid roll result (e.g., 18 or 18!).");
        return;
      }
      logCalc += `Player Roll: ${finalRoll} `;
    }

    // Outcome = Final Roll - (Target's Driving Score)
    outcome = finalRoll - targetVehicle.driving;
    logCalc += `| Outcome = ${finalRoll} - ${targetVehicle.driving} = ${outcome} `;

    if (actionType === "driving" || actionType === "ramming") {
      cpChange = outcome + actingVehicle.squeal - targetVehicle.handling;
      logCalc += `| CP Change = ${outcome} + Acting Squeal (${actingVehicle.squeal}) - Target Handling (${targetVehicle.handling}) = ${cpChange}`;
    } else if (actionType === "driverAttack") {
      cpChange = - (outcome + 5);
      logCalc += `| Driver Attack CP Change = - (${outcome} + 5) = ${cpChange}`;
    }

    const oldCP = targetVehicle.chasePoints;
    targetVehicle.chasePoints += cpChange;
    if (targetVehicle.chasePoints < 0) targetVehicle.chasePoints = 0;
    logCalc = `${actionType === "driving" ? "Driving Check" : actionType === "ramming" ? "Ramming/Sideswipe" : "Driver Attack"}: ` +
              `Acting Vehicle (${actingVehicle.name}) Roll = ${finalRoll}, Outcome = ${outcome}, ` +
              `+ Acting Squeal (${actingVehicle.squeal}) - Target Handling (${targetVehicle.handling}) → CP Change = ${cpChange}. ` +
              `(${targetVehicle.name}: ${oldCP} → ${targetVehicle.chasePoints} CP)`;
    if (targetVehicle.chasePoints >= 35) {
      logCalc += ` - CRITICAL condition reached!`;
    }
    logEvent(logCalc);
    updateVehicleLists();
    actionForm.reset();
    gmRollResultDiv.textContent = "";
    gmDrivingBaseInput.dataset.rollResult = "";
    switchRollMode("GM");
  });

  /******************************************************************************
   * 9. Reset Chase: Reset CP for all vehicles
   *****************************************************************************/
  resetButton.addEventListener('click', () => {
    vehicles.forEach(v => {
      v.chasePoints = 0;
    });
    updateVehicleLists();
    logEvent("New chase started. All vehicles reset.");
  });

  /******************************************************************************
   * 10. Log Helper: Append message to event log
   *****************************************************************************/
  function logEvent(message) {
    const li = document.createElement('li');
    li.textContent = message;
    logList.appendChild(li);
  }
});
