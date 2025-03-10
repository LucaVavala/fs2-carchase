/******************************************************************************
 * PREDEFINED VEHICLES
 * Each entry contains acceleration, handling, and frame.
 * Derived stats: Squeal = handling + 2, Crunch = frame + 2.
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

  // DOM Elements
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

  // GM inputs
  const gmRollPanel = document.getElementById('gmRollPanel');
  const gmDrivingScoreInput = document.getElementById('gmDrivingScore');
  const gmOpponentScoreInput = document.getElementById('gmOpponentScore');
  const gmOpponentHandlingInput = document.getElementById('gmOpponentHandling');
  const gmModifierInput = document.getElementById('gmModifier');
  const rollDiceButton = document.getElementById('rollDiceButton');
  const gmRollResultDiv = document.getElementById('gmRollResult');

  // Player inputs
  const playerRollPanel = document.getElementById('playerRollPanel');
  const playerRollResultInput = document.getElementById('playerRollResult');
  const opponentScoreInput = document.getElementById('opponentScore');
  const playerOpponentHandlingInput = document.getElementById('playerOpponentHandling');

  const logList = document.getElementById('logList');
  const resetButton = document.getElementById('resetChase');

  /******************************************************************************
   * 1. Toggle custom stats on "Custom" vehicle type
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
   * 3. Update vehicle dropdown (target vehicle)
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
   * 4. Render vehicle cards in the dashboard lists
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
        <p>Handling: ${v.handling} (Squeal: ${v.squeal})</p>
        <p>Frame: ${v.frame} (Crunch: ${v.crunch})</p>
        <p>Chase Points: <strong>${v.chasePoints}</strong></p>
      `;
      if (v.role === "Pursuer") {
        pursuerList.appendChild(li);
      } else {
        evaderList.appendChild(li);
      }
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
      gmDrivingScoreInput.required = true;
      gmOpponentScoreInput.required = true;
      gmOpponentHandlingInput.required = true;
      playerRollResultInput.required = false;
      opponentScoreInput.required = false;
      playerOpponentHandlingInput.required = false;
    } else {
      gmRollPanel.style.display = "none";
      playerRollPanel.style.display = "block";
      playerRollResultInput.required = true;
      opponentScoreInput.required = true;
      playerOpponentHandlingInput.required = true;
      gmDrivingScoreInput.required = false;
      gmOpponentScoreInput.required = false;
      gmOpponentHandlingInput.required = false;
    }
  }
  rollModeRadios.forEach((radio) => {
    radio.addEventListener('change', () => {
      switchRollMode(radio.value);
    });
  });
  switchRollMode("GM");

  /******************************************************************************
   * 7. GM Roll Dice Button: simulate two d6 and compute roll result
   *****************************************************************************/
  rollDiceButton.addEventListener('click', () => {
    const drivingCheck = parseInt(gmDrivingScoreInput.value, 10);
    const opponentDriving = parseInt(gmOpponentScoreInput.value, 10) || 0;
    const modifier = parseInt(gmModifierInput.value, 10) || 0;

    if (isNaN(drivingCheck)) {
      alert("Please enter a valid Driving Check Result.");
      return;
    }

    // Roll two dice
    const die1 = rollDie();
    const die2 = rollDie();
    const diceSum = die1 + die2;
    const isBoxcars = (die1 === 6 && die2 === 6);

    // In GM mode, we let the dice add to the Driving Check.
    // However, per the manual, the Outcome should be:
    // Outcome = (Driving Check Result - Opponent's Driving Score)
    // (The dice here can be seen as a random modifier if desired.)
    // For our implementation, we’ll assume the GM's entered Driving Check already
    // factors in the dice if desired. But if rolling, we compute:
    const finalCheck = diceSum + drivingCheck + modifier; // full check result
    const outcome = finalCheck - opponentDriving;
    
    // Store final outcome in dataset for use on action submission
    gmDrivingScoreInput.dataset.rollResult = finalCheck;
    
    let resultText = `Dice: ${die1}, ${die2} (Sum: ${diceSum}) → Driving Check: ${finalCheck} `;
    resultText += `Outcome: ${finalCheck} - ${opponentDriving} = ${outcome}`;
    if (isBoxcars) {
      resultText += "  (Boxcars!)";
    }
    gmRollResultDiv.textContent = resultText;
    logEvent(`GM rolled: ${die1}, ${die2}${isBoxcars ? "!" : ""}. Driving Check: ${finalCheck} (Outcome: ${outcome})`);
  });

  function rollDie() {
    return Math.floor(Math.random() * 6) + 1;
  }

  /******************************************************************************
   * 8. Action Form Submission: Apply action based on mode and formula
   *
   * Formula (per manual):
   * CP change = (Driving Check Result – Opponent's Driving Score) 
   *             + (Acting Vehicle's Squeal) – (Opponent's Handling)
   *****************************************************************************/
  actionForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const actionType = actionTypeSelect.value;
    const targetId = parseInt(targetVehicleSelect.value, 10);
    const vehicle = vehicles.find((v) => v.id === targetId);
    if (!vehicle) return;
    const rollMode = document.querySelector('input[name="rollMode"]:checked').value;
    let drivingCheckResult = 0;
    let opponentDriving = 0;
    let opponentHandling = 0;
    let outcome = 0;
    let cpChange = 0;
    let actionDescription = "";

    if (rollMode === "GM") {
      drivingCheckResult = parseInt(gmDrivingScoreInput.dataset.rollResult || "0", 10);
      opponentDriving = parseInt(gmOpponentScoreInput.value, 10) || 0;
      opponentHandling = parseInt(gmOpponentHandlingInput.value, 10) || 0;
      outcome = drivingCheckResult - opponentDriving;
      actionDescription += `(GM Roll: ${drivingCheckResult} - Opponent Driving: ${opponentDriving} = Outcome: ${outcome}) `;
    } else {
      // Player mode: player enters final Driving Check result manually (e.g., "18" or "18!")
      let playerInput = playerRollResultInput.value.trim();
      const rawPlayerResult = parseInt(playerInput.replace('!', ''), 10);
      if (isNaN(rawPlayerResult)) {
        alert("Please enter a valid roll result (e.g., 18 or 18!).");
        return;
      }
      opponentDriving = parseInt(opponentScoreInput.value, 10) || 0;
      opponentHandling = parseInt(playerOpponentHandlingInput.value, 10) || 0;
      outcome = rawPlayerResult - opponentDriving;
      actionDescription += `(Player Roll: ${rawPlayerResult} - Opponent Driving: ${opponentDriving} = Outcome: ${outcome}) `;
    }

    // Now apply the formula based on action type.
    // For both Driving Check and Ramming/Sideswipe, the manual formula is the same:
    // CP = Outcome + (Acting Vehicle's Squeal) - (Opponent's Handling)
    // For Driver Attack, CP is subtracted and an extra -5 is applied.
    if (actionType === "driving" || actionType === "ramming") {
      cpChange = outcome + vehicle.squeal - opponentHandling;
      actionDescription = (actionType === "driving" ? "Driving Check" : "Ramming/Sideswipe") + " → " + actionDescription;
    } else if (actionType === "driverAttack") {
      cpChange = - (outcome + 5); // No bonus or subtraction of Handling here per our version
      actionDescription = "Driver Attack → " + actionDescription;
    }

    const oldCP = vehicle.chasePoints;
    vehicle.chasePoints += cpChange;
    if (vehicle.chasePoints < 0) vehicle.chasePoints = 0;

    actionDescription += `${vehicle.name}: ${oldCP} → ${vehicle.chasePoints} CP (Change: ${cpChange >= 0 ? "+" : ""}${cpChange})`;
    if (vehicle.chasePoints >= 35) {
      actionDescription += `. ${vehicle.name} has reached critical condition!`;
    }
    updateVehicleLists();
    logEvent(actionDescription);

    // Clear GM roll result so it doesn't carry over
    gmDrivingScoreInput.dataset.rollResult = "";
    gmRollResultDiv.textContent = "";
    actionForm.reset();
    switchRollMode("GM");
  });

  /******************************************************************************
   * 9. Reset Chase: Reset all vehicles' CP
   *****************************************************************************/
  resetButton.addEventListener('click', () => {
    vehicles.forEach((v) => {
      v.chasePoints = 0;
    });
    updateVehicleLists();
    logEvent("New chase started. All vehicles reset.");
  });

  /******************************************************************************
   * 10. Log Helper
   *****************************************************************************/
  function logEvent(message) {
    const li = document.createElement('li');
    li.textContent = message;
    logList.appendChild(li);
  }
});
