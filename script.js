/******************************************************************************
 * PREDEFINED VEHICLES
 * Each entry includes: acceleration, handling, and frame.
 * (No "driving" stat is provided, as that is entered manually.)
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
  // Removed GM Driving Base input; now only a modifier field remains.
  const gmModifierInput = document.getElementById('gmModifier');
  const rollDiceButton = document.getElementById('rollDiceButton');
  const gmRollResultDiv = document.getElementById('gmRollResult');

  // Player mode inputs
  const playerRollPanel = document.getElementById('playerRollPanel');
  const playerRollResultInput = document.getElementById('playerRollResult');
  const playerModifierInput = document.getElementById('playerModifier');

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
    } else {
      gmRollPanel.style.display = "none";
      playerRollPanel.style.display = "block";
    }
  }
  rollModeRadios.forEach(radio => {
    radio.addEventListener('change', () => {
      switchRollMode(radio.value);
    });
  });
  switchRollMode("GM");

  /******************************************************************************
   * 7. GM Roll Dice Button: Roll 2d6 (one positive, one negative) with exploding dice.
   *    - For each die, if a 6 is rolled, roll again and add.
   *    - The final dice outcome = (Positive Die Total) - (Negative Die Total).
   *    - If both dice are 6 on the first roll, mark as Boxcars.
   *    - Final Check = Acting Vehicle's Driving + Outcome + Modifier.
   *****************************************************************************/
  rollDiceButton.addEventListener('click', () => {
    // Get acting vehicle from actingVehicleSelect
    const actingId = parseInt(actingVehicleSelect.value, 10);
    const actingVehicle = vehicles.find(v => v.id === actingId);
    if (!actingVehicle) {
      alert("No acting vehicle selected!");
      return;
    }
    const modifier = parseInt(gmModifierInput.value, 10) || 0;

    // Roll two dice
    const posInitial = rollDie();
    const negInitial = rollDie();
    const boxcars = (posInitial === 6 && negInitial === 6);
    const posTotal = rollExplodingDie(posInitial);
    const negTotal = rollExplodingDie(negInitial);
    const diceOutcome = posTotal - negTotal;

    // Final Check = Acting Vehicle's Driving + diceOutcome + modifier
    const finalCheck = actingVehicle.driving + diceOutcome + modifier;
    // Store final check in gmRollResultDiv's dataset for use in action submission
    gmRollResultDiv.dataset.finalCheck = finalCheck;

    let resultText = `Positive Die: ${posTotal} (initial: ${posInitial}), Negative Die: ${negTotal} (initial: ${negInitial}) → Dice Outcome: ${diceOutcome}. Final Check = Acting Driving (${actingVehicle.driving}) + ${diceOutcome} + Modifier (${modifier}) = ${finalCheck}`;
    if (boxcars) resultText += " (Boxcars!)";
    gmRollResultDiv.textContent = resultText;
    logEvent(`GM rolled: +die=${posTotal} (initial ${posInitial}), -die=${negTotal} (initial ${negInitial}), Outcome=${diceOutcome}. Final Check = ${actingVehicle.driving} + ${diceOutcome} + ${modifier} = ${finalCheck}${boxcars ? " (Boxcars!)" : ""}`);
  });

  // Roll a single d6
  function rollDie() {
    return Math.floor(Math.random() * 6) + 1;
  }

  // Roll an exploding die: given an initial roll, if 6, continue rolling.
  function rollExplodingDie(initial) {
    let total = initial;
    while (initial === 6) {
      initial = rollDie();
      total += initial;
    }
    return total;
  }

  /******************************************************************************
   * 8. Action Form Submission: Calculate CP Change and update target vehicle.
   *
   * For GM:
   *   Final Check is taken from gmRollResultDiv.dataset.finalCheck.
   * For Player:
   *   Final Check = (entered roll result + player's modifier).
   *
   * Outcome = Final Check – (Target Vehicle's Driving Score)
   * If Outcome < 0, treat CP Change as 0.
   * Otherwise, CP Change = Outcome + (Acting Vehicle's Squeal) – (Target Vehicle's Handling)
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
    let finalCheck = 0;
    let outcome = 0;
    let cpChange = 0;
    let logCalc = "";

    if (rollMode === "GM") {
      finalCheck = parseInt(gmRollResultDiv.dataset.finalCheck || "0", 10);
      if (isNaN(finalCheck) || finalCheck === 0) {
        alert("Please roll the dice first (GM Mode).");
        return;
      }
      logCalc += `GM Final Check: ${finalCheck} `;
    } else {
      let playerInput = playerRollResultInput.value.trim();
      finalCheck = parseInt(playerInput.replace('!', ''), 10);
      if (isNaN(finalCheck)) {
        alert("Please enter a valid roll result (e.g., 18 or 18!)");
        return;
      }
      const playerModifier = parseInt(playerModifierInput.value, 10) || 0;
      finalCheck += playerModifier;
      logCalc += `Player Final Check: ${finalCheck} (Modifier: ${playerModifier}) `;
    }

    // Outcome = Final Check - (Target Vehicle's Driving Score)
    outcome = finalCheck - targetVehicle.driving;
    // If Outcome is negative, operation stops and CP change is 0.
    if (outcome < 0) {
      cpChange = 0;
      logCalc += `| Outcome (${finalCheck} - ${targetVehicle.driving} = ${outcome}) is negative. CP Change = 0.`;
    } else {
      logCalc += `| Outcome = ${finalCheck} - ${targetVehicle.driving} = ${outcome} `;
      if (actionType === "driving" || actionType === "ramming") {
        cpChange = outcome + actingVehicle.squeal - targetVehicle.handling;
        logCalc += `| CP Change = ${outcome} + Acting Squeal (${actingVehicle.squeal}) - Target Handling (${targetVehicle.handling}) = ${cpChange}`;
      } else if (actionType === "driverAttack") {
        cpChange = - (outcome + 5);
        logCalc += `| Driver Attack CP Change = - (${outcome} + 5) = ${cpChange}`;
      }
    }

    const oldCP = targetVehicle.chasePoints;
    targetVehicle.chasePoints += cpChange;
    if (targetVehicle.chasePoints < 0) targetVehicle.chasePoints = 0;
    logCalc = `${actionType === "driving" ? "Driving Check" : actionType === "ramming" ? "Ramming/Sideswipe" : "Driver Attack"}: ` +
              `Acting Vehicle (${actingVehicle.name}) Final Check = ${finalCheck}, Outcome = ${outcome}, ` +
              `+ Acting Squeal (${actingVehicle.squeal}) - Target Handling (${targetVehicle.handling}) → CP Change = ${cpChange}. ` +
              `(${targetVehicle.name}: ${oldCP} → ${targetVehicle.chasePoints} CP)`;
    if (targetVehicle.chasePoints >= 35) {
      logCalc += ` - CRITICAL condition reached!`;
    }
    logEvent(logCalc);
    updateVehicleLists();
    actionForm.reset();
    gmRollResultDiv.textContent = "";
    delete gmRollResultDiv.dataset.finalCheck;
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
