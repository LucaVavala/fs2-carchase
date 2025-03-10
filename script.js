// Predefined vehicles (you can add more as needed)
const predefinedVehicles = {
  "Maserati": { acceleration: 8, handling: 7, frame: 6 },
  "Police Pursuit Van": { acceleration: 6, handling: 5, frame: 8 }
};

document.addEventListener('DOMContentLoaded', () => {
  let vehicles = [];
  let vehicleIdCounter = 0;
  let chaseGap = "Far"; // overall chase gap (set manually via dropdown)

  // DOM elements
  const addVehicleForm = document.getElementById('addVehicleForm');
  const vehicleTypeSelect = document.getElementById('vehicleType');
  const customStatsDiv = document.getElementById('customStats');
  const vehicleListSelect = document.getElementById('targetVehicle');
  const chaseGapSelect = document.getElementById('chaseGap');
  const pursuerList = document.getElementById('pursuerList');
  const evaderList = document.getElementById('evaderList');
  const actionForm = document.getElementById('actionForm');
  const logList = document.getElementById('logList');
  const resetButton = document.getElementById('resetChase');
  
  const gmRollPanel = document.getElementById('gmRollPanel');
  const playerRollPanel = document.getElementById('playerRollPanel');
  const rollDiceButton = document.getElementById('rollDiceButton');
  const gmRollResultDiv = document.getElementById('gmRollResult');
  const rollModeRadios = document.getElementsByName('rollMode');

  // When vehicle type changes, show/hide custom inputs
  vehicleTypeSelect.addEventListener('change', (e) => {
    if (e.target.value === "Custom") {
      customStatsDiv.style.display = "block";
    } else {
      customStatsDiv.style.display = "none";
    }
  });

  // Add vehicle form submission
  addVehicleForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const type = vehicleTypeSelect.value;
    const name = document.getElementById('vehicleName').value;
    let acceleration, handling, frame;
    if (type === "Custom") {
      acceleration = parseInt(document.getElementById('acceleration').value);
      handling = parseInt(document.getElementById('handling').value);
      frame = parseInt(document.getElementById('frame').value);
    } else {
      // Use predefined values
      const stats = predefinedVehicles[type];
      acceleration = stats.acceleration;
      handling = stats.handling;
      frame = stats.frame;
    }
    const role = document.getElementById('vehicleRole').value; // Pursuer/Evader
    const control = document.getElementById('controlType').value; // GM/Player

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
    updateVehicleLists();
    updateVehicleSelect();
    addVehicleForm.reset();
    customStatsDiv.style.display = "none";
    logEvent(`Added vehicle: ${name} (${role}, ${control})`);
  });

  // Update the dropdown for selecting a target vehicle (all vehicles)
  function updateVehicleSelect() {
    vehicleListSelect.innerHTML = '';
    vehicles.forEach(v => {
      const option = document.createElement('option');
      option.value = v.id;
      option.textContent = `${v.name} (${v.role}, ${v.control})`;
      vehicleListSelect.appendChild(option);
    });
  }

  // Update the dashboard lists for pursuers and evaders
  function updateVehicleLists() {
    pursuerList.innerHTML = '';
    evaderList.innerHTML = '';
    vehicles.forEach(v => {
      const li = document.createElement('li');
      li.className = "vehicleItem";
      li.textContent = `${v.name}: ${v.chasePoints} CP`;
      if (v.role === "Pursuer") {
        pursuerList.appendChild(li);
      } else {
        evaderList.appendChild(li);
      }
    });
  }

  // Update overall chase gap from dropdown
  chaseGapSelect.addEventListener('change', (e) => {
    chaseGap = e.target.value;
    logEvent(`Chase Gap set to: ${chaseGap}`);
  });

  // Toggle roll panels based on roll mode selection
  rollModeRadios.forEach(radio => {
    radio.addEventListener('change', () => {
      if (document.querySelector('input[name="rollMode"]:checked').value === "GM") {
        gmRollPanel.style.display = "block";
        playerRollPanel.style.display = "none";
      } else {
        gmRollPanel.style.display = "none";
        playerRollPanel.style.display = "block";
      }
    });
  });

  // GM Roll Dice button handler: simulate two d6 and calculate final result
  rollDiceButton.addEventListener('click', () => {
    const drivingScore = parseInt(document.getElementById('gmDrivingScore').value);
    const modifier = parseInt(document.getElementById('gmModifier').value) || 0;
    if (isNaN(drivingScore)) {
      alert("Please enter a valid Driving Score.");
      return;
    }
    // Simulate two d6 rolls
    const die1 = rollDie();
    const die2 = rollDie();
    let boxcars = (die1 === 6 && die2 === 6);
    let finalRoll = die1 + die2 + drivingScore + modifier;
    // Display results in gmRollResultDiv
    let resultText = `Dice: ${die1}, ${die2} → Final Result: ${finalRoll}`;
    if (boxcars) {
      resultText += " !"; // exclamation mark for boxcars
    }
    gmRollResultDiv.textContent = resultText;
    logEvent(`GM rolled: ${die1} and ${die2} (Driving Score: ${drivingScore}, Modifier: ${modifier}) = ${finalRoll}${boxcars ? "!" : ""}`);
    // Store the final roll result in a hidden field (or you can set the value of gmDrivingScore to finalRoll)
    document.getElementById('gmDrivingScore').dataset.rollResult = finalRoll;
  });

  function rollDie() {
    return Math.floor(Math.random() * 6) + 1;
  }

  // Handle action form submission
  actionForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const actionType = document.getElementById('actionType').value;
    const targetId = parseInt(vehicleListSelect.value);
    const vehicle = vehicles.find(v => v.id === targetId);
    if (!vehicle) return;
    const rollMode = document.querySelector('input[name="rollMode"]:checked').value;
    let rollResult = 0;
    let opponentScore = 0;
    
    if (rollMode === "GM") {
      // Use the final result stored from the GM roll dice panel
      rollResult = parseInt(document.getElementById('gmDrivingScore').dataset.rollResult);
      if (isNaN(rollResult)) {
        alert("Please roll the dice first.");
        return;
      }
    } else {
      // Player mode: use manually entered roll result.
      const playerInput = document.getElementById('playerRollResult').value;
      // Remove any exclamation mark and parse the number
      rollResult = parseInt(playerInput.replace('!', ''));
      if (isNaN(rollResult)) {
        alert("Please enter a valid roll result.");
        return;
      }
      opponentScore = parseInt(document.getElementById('opponentScore').value);
      if (isNaN(opponentScore)) {
        alert("Please enter the opponent's Driving Score.");
        return;
      }
    }
    
    // Calculate CP change based on action type.
    let cpChange = 0;
    let bonus = 0;
    if (actionType === "driving") {
      bonus = (vehicle.squeal);
      if (rollMode === "GM") {
        cpChange = rollResult + bonus;
      } else {
        cpChange = rollResult + bonus - opponentScore;
      }
    } else if (actionType === "ramming") {
      bonus = (vehicle.crunch);
      if (rollMode === "GM") {
        cpChange = rollResult + bonus;
      } else {
        cpChange = rollResult + bonus - opponentScore;
      }
    } else if (actionType === "driverAttack") {
      if (rollMode === "GM") {
        cpChange = - (rollResult + 5);
      } else {
        cpChange = - ((rollResult - opponentScore) + 5);
      }
    }
    
    vehicle.chasePoints += cpChange;
    if (vehicle.chasePoints < 0) vehicle.chasePoints = 0;
    // Update the vehicle's CP display (we update entire dashboard)
    updateVehicleLists();
    
    let actionDescription = `${actionType === "driving" ? "Driving Check" : actionType === "ramming" ? "Ramming/Sideswipe" : "Driver Attack"} on ${vehicle.name} `;
    actionDescription += (rollMode === "GM" ? `(GM Roll: ${rollResult})` : `(Player Roll: ${rollResult}, Opponent: ${opponentScore})`);
    actionDescription += ` with bonus ${bonus} results in ${cpChange >= 0 ? "adding" : "subtracting"} ${Math.abs(cpChange)} CP.`;
    if (vehicle.chasePoints >= 35) {
      actionDescription += ` ${vehicle.name} has reached critical condition!`;
    }
    logEvent(actionDescription);
    // Reset the roll panels for next action
    actionForm.reset();
    gmRollResultDiv.textContent = "";
    // Re-set roll mode to GM by default
    document.querySelector('input[name="rollMode"][value="GM"]').checked = true;
    gmRollPanel.style.display = "block";
    playerRollPanel.style.display = "none";
  });

  // Reset chase: reset chase points for all vehicles
  resetButton.addEventListener('click', () => {
    vehicles.forEach(v => {
      v.chasePoints = 0;
    });
    updateVehicleLists();
    logEvent('New chase started. All vehicles reset.');
  });

  // Log event helper
  function logEvent(message) {
    const li = document.createElement('li');
    li.textContent = message;
    logList.appendChild(li);
  }
});
