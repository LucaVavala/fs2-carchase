document.addEventListener('DOMContentLoaded', () => {
  let vehicles = [];
  let vehicleIdCounter = 0;
  
  const addVehicleForm = document.getElementById('addVehicleForm');
  const vehicleListDiv = document.getElementById('vehicleList');
  const targetVehicleSelect = document.getElementById('targetVehicle');
  const actionForm = document.getElementById('actionForm');
  const logList = document.getElementById('logList');
  const resetButton = document.getElementById('resetChase');

  // Update the target vehicle dropdown options
  function updateVehicleSelect() {
    targetVehicleSelect.innerHTML = '';
    vehicles.forEach(v => {
      const option = document.createElement('option');
      option.value = v.id;
      option.textContent = v.name;
      targetVehicleSelect.appendChild(option);
    });
  }

  // Render the list of vehicles on the page
  function renderVehicles() {
    vehicleListDiv.innerHTML = '';
    vehicles.forEach(v => {
      const div = document.createElement('div');
      div.classList.add('vehicle');
      div.innerHTML = `
        <h3>${v.name}</h3>
        <p>Acceleration: ${v.acceleration}</p>
        <p>Handling: ${v.handling}</p>
        <p>Frame: ${v.frame}</p>
        <p>Squeal: ${v.squeal}</p>
        <p>Crunch: ${v.crunch}</p>
        <p>Chase Points: <span id="cp-${v.id}">${v.chasePoints}</span></p>
        <p>Gap: ${v.gap}</p>
      `;
      vehicleListDiv.appendChild(div);
    });
  }

  // Append a new entry to the event log
  function logEvent(message) {
    const li = document.createElement('li');
    li.textContent = message;
    logList.appendChild(li);
  }

  // Handle new vehicle addition
  addVehicleForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('vehicleName').value;
    const acceleration = parseInt(document.getElementById('acceleration').value);
    const handling = parseInt(document.getElementById('handling').value);
    const frame = parseInt(document.getElementById('frame').value);
    
    // Derived stats: Squeal and Crunch
    const vehicle = {
      id: vehicleIdCounter++,
      name,
      acceleration,
      handling,
      frame,
      chasePoints: 0,
      gap: 'Far',
      squeal: handling + 2,
      crunch: frame + 2
    };
    vehicles.push(vehicle);
    renderVehicles();
    updateVehicleSelect();
    addVehicleForm.reset();
    logEvent(`Added vehicle: ${name}`);
  });

  // Handle chase actions
  actionForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const actionType = document.getElementById('actionType').value;
    const outcome = parseInt(document.getElementById('actionOutcome').value);
    let modifier = parseInt(document.getElementById('actionModifier').value) || 0;
    const targetId = parseInt(targetVehicleSelect.value);
    const vehicle = vehicles.find(v => v.id === targetId);
    if (!vehicle) return;
    
    let cpChange = 0;
    let actionDescription = '';
    
    if (actionType === 'driving') {
      // For a driving check, we add outcome + modifier + the vehicle’s Squeal
      cpChange = outcome + modifier + vehicle.squeal;
      actionDescription = `Driving Check: ${vehicle.name} gains ${cpChange} CP (Outcome: ${outcome}, Modifier: ${modifier}, Squeal: ${vehicle.squeal}).`;
    } else if (actionType === 'ramming') {
      // For ramming/sideswipe, we add outcome + modifier + the vehicle’s Crunch
      cpChange = outcome + modifier + vehicle.crunch;
      actionDescription = `Ramming/Sideswipe: ${vehicle.name} gains ${cpChange} CP (Outcome: ${outcome}, Modifier: ${modifier}, Crunch: ${vehicle.crunch}).`;
    } else if (actionType === 'driverAttack') {
      // For driver attack, we subtract points: outcome + modifier, then apply a penalty of 5 CP
      cpChange = -(outcome + modifier) - 5;
      actionDescription = `Driver Attack: ${vehicle.name} loses ${Math.abs(cpChange)} CP (Outcome: ${outcome}, Modifier: ${modifier}, -5 penalty).`;
    }
    
    vehicle.chasePoints += cpChange;
    // Ensure chase points do not drop below 0
    if (vehicle.chasePoints < 0) {
      vehicle.chasePoints = 0;
    }
    // Check for critical condition (35+ chase points)
    if (vehicle.chasePoints >= 35) {
      vehicle.gap = 'Critical';
      actionDescription += ` ${vehicle.name} is in critical condition!`;
    }
    
    // Update display and log the event
    const cpSpan = document.getElementById(`cp-${vehicle.id}`);
    if (cpSpan) cpSpan.textContent = vehicle.chasePoints;
    logEvent(actionDescription);
    actionForm.reset();
  });

  // Handle resetting the chase
  resetButton.addEventListener('click', () => {
    vehicles.forEach(v => {
      v.chasePoints = 0;
      v.gap = 'Far';
      const cpSpan = document.getElementById(`cp-${v.id}`);
      if (cpSpan) cpSpan.textContent = v.chasePoints;
    });
    logEvent('New chase started. All vehicles reset.');
  });
});
