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
        <p>Handling: ${v.handling}</p>
        <p>Squeal: ${v.squeal}</p>
        <p>Frame: ${v.frame}</p>
        <p>Crunch: ${v.crunch}</p>
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
   * 5. Chase gap selection
   *****************************************************************************/
  chaseGapSelect.addEventListener('change', (e) => {
    chaseGap = e.target.value;
    logEvent(`Chase Gap set to: ${chaseGap}`);
  });

  /******************************************************************************
   * 6. Toggle GM vs Player roll panels
   *****************************************************************************/
  function switchRollMode(mode) {
    if (mode === "GM") {
      gmRollPanel.style.display = "block";
      playerRollPanel.style.display = "none";
      // Make GM inputs required
      gmDrivingScoreInput.required = true;
      gmOpponentScoreInput.required = true;
      // Remove required from player inputs
      playerRollResultInput.required = false;
      opponentScoreInput.required = false;
    } else {
      gmRollPanel.style.display = "none";
      playerRollPanel.style.display = "block";
      // Make player inputs required
      playerRollResultInput.required = true;
      opponentScoreInput.required = true;
      // Remove required from GM inputs
      gmDrivingScoreInput.required = false;
      gmOpponentScoreInput.required = false;
    }
  }

  rollModeRadios.forEach((radio) => {
    radio.addEventListener('change', () => {
      switchRollMode(radio.value);
    });
  });

  // Initialize default
  switchRollMode("GM");

  /******************************************************************************
   * 7. GM Dice Roll button
   *****************************************************************************/
  rollDiceButton.addEventListener('click', () => {
    const gmDrivingScore = parseInt(gmDrivingScoreInput.value, 10);
    const gmOpponentScore = parseInt(gmOpponentScoreInput.value, 10) || 0;
    const modifier = parseInt(gmModifierInput.value, 10) || 0;

    if (isNaN(gmDrivingScore)) {
      alert("Please enter a valid GM Driving Score.");
      return;
    }
    // Simulate 2d6
    const die1 = rollDie();
    const die2 = rollDie();
    const isBoxcars = (die1 === 6 && die2 === 6);

    // The raw dice sum
    const diceSum = die1 + die2;

    // We'll store the "final roll" as dice + gmDrivingScore + mod - gmOpponentScore
    // but we won't apply the squeal/crunch or driver-attack formula yet
    const finalRoll = diceSum + gmDrivingScore + modifier - gmOpponentScore;

    let resultText = `Dice: ${die1}, ${die2} → ${diceSum}. 
      Driving Score: ${gmDrivingScore}, Opponent: ${gmOpponentScore}, Mod: ${modifier}.
      Final: ${finalRoll}`;
    if (isBoxcars) {
      resultText += "  (Boxcars!)";
    }

    gmRollResultDiv.textContent = resultText;
    logEvent(`GM dice → ${die1}, ${die2}${isBoxcars ? "!" : ""}. 
      Driving: ${gmDrivingScore}, Opponent: ${gmOpponentScore}, 
      Mod: ${modifier}, => ${finalRoll}${isBoxcars ? "!" : ""}`);

    // Store finalRoll in dataset for retrieval in the "Apply Action"
    gmDrivingScoreInput.dataset.rollResult = finalRoll;
  });

  function rollDie() {
    return Math.floor(Math.random() * 6) + 1;
  }

  /******************************************************************************
   * 8. Action form submission
   *****************************************************************************/
  actionForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const actionType = actionTypeSelect.value;
    const targetId = parseInt(targetVehicleSelect.value, 10);
    const vehicle = vehicles.find((v) => v.id === targetId);
    if (!vehicle) return;

    const rollMode = document.querySelector('input[name="rollMode"]:checked').value;

    let finalRoll = 0; // the net roll result (minus opponent) BEFORE adding squeal/crunch
    let cpChange = 0;
    let actionDescription = "";

    if (rollMode === "GM") {
      // Use the final roll from dataset
      const storedRoll = parseInt(gmDrivingScoreInput.dataset.rollResult || "NaN", 10);
      if (isNaN(storedRoll)) {
        alert("Please roll the dice first (GM Mode).");
        return;
      }
      finalRoll = storedRoll;
    } else {
      // Player mode: parse the player's result
      const playerInput = playerRollResultInput.value.trim();
      let rawRoll = parseInt(playerInput.replace('!', ''), 10);
      if (isNaN(rawRoll)) {
        alert("Please enter a valid roll result (e.g., 8 or 8!).");
        return;
      }
      const oppScore = parseInt(opponentScoreInput.value, 10) || 0;
      // finalRoll is (rawRoll - opponentScore)
      finalRoll = rawRoll - oppScore;
      actionDescription += `(Player Roll: ${playerInput}, Opponent: ${oppScore}) `;
    }

    // Now compute CP changes based on action type
    // We'll add vehicle.squeal or vehicle.crunch if driving/ramming, or do driver attack logic
    if (actionType === "driving") {
      // final = finalRoll + squeal
      cpChange = finalRoll + vehicle.squeal;
      actionDescription += "Driving Check → ";
    } else if (actionType === "ramming") {
      // final = finalRoll + crunch
      cpChange = finalRoll + vehicle.crunch;
      actionDescription += "Ramming/Sideswipe → ";
    } else if (actionType === "driverAttack") {
      // final = - (finalRoll + 5)
      // (finalRoll might be negative or positive from the dice perspective)
      cpChange = -(finalRoll + 5);
      actionDescription += "Driver Attack → ";
    }

    // Apply CP change
    const oldCP = vehicle.chasePoints;
    vehicle.chasePoints += cpChange;
    if (vehicle.chasePoints < 0) {
      vehicle.chasePoints = 0;
    }

    // Build the log message
    actionDescription += `${vehicle.name} CP ${oldCP} → ${vehicle.chasePoints} (change: ${cpChange >= 0 ? "+" : ""}${cpChange})`;
    if (vehicle.chasePoints >= 35) {
      actionDescription += `. ${vehicle.name} has reached critical condition!`;
    }

    // Update UI
    updateVehicleLists();
    logEvent(actionDescription);

    // Clear out GM roll result so you can't accidentally reuse it
    gmDrivingScoreInput.dataset.rollResult = "";
    gmRollResultDiv.textContent = "";
    actionForm.reset();
    // Switch back to GM mode as default
    switchRollMode("GM");
  });

  /******************************************************************************
   * 9. Reset chase
   *****************************************************************************/
  resetButton.addEventListener('click', () => {
    vehicles.forEach((v) => {
      v.chasePoints = 0;
    });
    updateVehicleLists();
    logEvent("New chase started. All vehicles reset.");
  });

  /******************************************************************************
   * 10. Log helper
   *****************************************************************************/
  function logEvent(message) {
    const li = document.createElement('li');
    li.textContent = message;
    logList.appendChild(li);
  }
});
