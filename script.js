/******************************************************************************
 * PREDEFINED VEHICLES
 * Each entry includes: acceleration, handling, and frame.
 * (No "driving" stat is provided, since that is entered manually.)
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

  // GM mode inputs – only modifier field now.
  const gmModifierInput = document.getElementById('gmModifier');
  const rollDiceButton = document.getElementById('rollDiceButton');
  const gmRollResultDiv = document.getElementById('gmRollResult');

  // Player mode inputs – includes modifier.
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
    // Initialize condition stat at 0.
    const condition = 0;

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
      condition,
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
   * 4. Render vehicle cards in dashboard lists with CP and Condition,
   *    each with "+" and "–" buttons.
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
           <button data-id="${v.id}" class="decCP">–</button>
        </p>
        <p class="condContainer">Condition: <span id="cond-${v.id}">${v.condition}</span>
           <button data-id="${v.id}" class="incCond">+</button>
           <button data-id="${v.id}" class="decCond">–</button>
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
    document.querySelectorAll('.decCP').forEach(button => {
      button.addEventListener('click', () => {
        const id = parseInt(button.dataset.id, 10);
        const veh = vehicles.find(v => v.id === id);
        if (veh) {
          veh.chasePoints--;
          if (veh.chasePoints < 0) veh.chasePoints = 0;
          updateVehicleLists();
          logEvent(`Manually decreased CP for ${veh.name} to ${veh.chasePoints}`);
        }
      });
    });
    document.querySelectorAll('.incCond').forEach(button => {
      button.addEventListener('click', () => {
        const id = parseInt(button.dataset.id, 10);
        const veh = vehicles.find(v => v.id === id);
        if (veh) {
          veh.condition++;
          updateVehicleLists();
          logEvent(`Manually increased Condition for ${veh.name} to ${veh.condition}`);
        }
      });
    });
    document.querySelectorAll('.decCond').forEach(button => {
      button.addEventListener('click', () => {
        const id = parseInt(button.dataset.id, 10);
        const veh = vehicles.find(v => v.id === id);
        if (veh) {
          veh.condition--;
          if (veh.condition < 0) veh.condition = 0;
          updateVehicleLists();
          logEvent(`Manually decreased Condition for ${veh.name} to ${veh.condition}`);
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
   * 7. GM Roll Dice Button:
   *    - Roll 2d6: one die is positive, one is negative.
   *    - Each die "explodes" if it comes up 6.
   *    - Dice outcome = (Positive Total) – (Negative Total).
   *    - If both dice are 6 on the first roll, mark as Boxcars.
   *    - Final Check = Acting Vehicle's Driving + diceOutcome + Modifier.
   *****************************************************************************/
  rollDiceButton.addEventListener('click', () => {
    const actingId = parseInt(actingVehicleSelect.value, 10);
    const actingVehicle = vehicles.find(v => v.id === actingId);
    if (!actingVehicle) {
      alert("No acting vehicle selected!");
      return;
    }
    const modifier = parseInt(gmModifierInput.value, 10) || 0;

    const posInitial = rollDie();
    const negInitial = rollDie();
    const boxcars = (posInitial === 6 && negInitial === 6);
    const posTotal = rollExplodingDie(posInitial);
    const negTotal = rollExplodingDie(negInitial);
    const diceOutcome = posTotal - negTotal;

    const finalCheck = actingVehicle.driving + diceOutcome + modifier;
    gmRollResultDiv.dataset.finalCheck = finalCheck;
    let resultText = `Positive Die: ${posTotal} (initial: ${posInitial}), Negative Die: ${negTotal} (initial: ${negInitial}) → Dice Outcome: ${diceOutcome}. Final Check = ${actingVehicle.driving} + ${diceOutcome} + Modifier (${modifier}) = ${finalCheck}`;
    if (boxcars) resultText += " (Boxcars!)";
    gmRollResultDiv.textContent = resultText;
    logEvent(`GM rolled: +die=${posTotal} (initial ${posInitial}), -die=${negTotal} (initial ${negInitial}), Outcome=${diceOutcome}. Final Check = ${actingVehicle.driving} + ${diceOutcome} + ${modifier} = ${finalCheck}${boxcars ? " (Boxcars!)" : ""}`);
  });

  // Roll a single d6.
  function rollDie() {
    return Math.floor(Math.random() * 6) + 1;
  }

  // Exploding die: if a 6 is rolled, keep rolling and add.
  function rollExplodingDie(initial) {
    let total = initial;
    while (initial === 6) {
      initial = rollDie();
      total += initial;
    }
    return total;
  }

  /******************************************************************************
   * 8. Action Form Submission:
   *    For both GM and Player modes:
   *      Final Check is:
   *         - GM: from gmRollResultDiv.dataset.finalCheck.
   *         - Player: (entered roll result + player's modifier).
   *      Outcome = Final Check – (Target's Driving Score).
   *      If Outcome < 0, CP Change = 0.
   *
   *    For Driving Check:
   *      CP Change = Outcome + (Acting Vehicle's Squeal) – (Target's Handling).
   *
   *    For Ramming/Sideswipe:
   *      CP Change = Outcome + (Acting Vehicle's Crunch) – (Target's Frame).
   *      Additionally, if Acting Vehicle's Frame < Target's Frame,
   *         Extra CP = (Target's Frame – Acting Vehicle's Frame) is added to the acting vehicle.
   *      The same CP Change (and extra, if any) is added to the Condition stat of the target.
   *
   *    For Driver Attack:
   *      CP Change = - (Outcome + 5).
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

    // Outcome = Final Check - Target's Driving Score.
    outcome = finalCheck - targetVehicle.driving;
    logCalc += `| Outcome = ${finalCheck} - ${targetVehicle.driving} = ${outcome} `;
    if (outcome < 0) {
      cpChange = 0;
      logCalc += `| Outcome is negative. CP Change = 0.`;
    } else {
      if (actionType === "driving") {
        cpChange = outcome + actingVehicle.squeal - targetVehicle.handling;
        logCalc += `| CP Change = ${outcome} + Acting Squeal (${actingVehicle.squeal}) - Target Handling (${targetVehicle.handling}) = ${cpChange}`;
      } else if (actionType === "ramming") {
        cpChange = outcome + actingVehicle.crunch - targetVehicle.frame;
        logCalc += `| CP Change = ${outcome} + Acting Crunch (${actingVehicle.crunch}) - Target Frame (${targetVehicle.frame}) = ${cpChange}`;
        // Extra CP for acting vehicle if its frame is lower than target's frame.
        if (actingVehicle.frame < targetVehicle.frame) {
          const extraCP = targetVehicle.frame - actingVehicle.frame;
          actingVehicle.chasePoints += extraCP;
          actingVehicle.condition = (actingVehicle.condition || 0) + extraCP;
          logCalc += ` | Extra CP for Acting Vehicle = ${extraCP} (Frame diff: ${targetVehicle.frame} - ${actingVehicle.frame})`;
        }
        // For ramming actions, update Condition for target vehicle by same CP Change.
        targetVehicle.condition = (targetVehicle.condition || 0) + cpChange;
      } else if (actionType === "driverAttack") {
        cpChange = - (outcome + 5);
        logCalc += `| Driver Attack CP Change = - (${outcome} + 5) = ${cpChange}`;
      }
    }
    const oldTargetCP = targetVehicle.chasePoints;
    targetVehicle.chasePoints += cpChange;
    if (targetVehicle.chasePoints < 0) targetVehicle.chasePoints = 0;
    logCalc += ` → (${targetVehicle.name} CP: ${oldTargetCP} → ${targetVehicle.chasePoints})`;
    if (targetVehicle.chasePoints >= 35) {
      logCalc += ` - CRITICAL condition reached!`;
    }
    logEvent(`${actionType === "driving" ? "Driving Check" : actionType === "ramming" ? "Ramming/Sideswipe" : "Driver Attack"}: ` + logCalc);
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
