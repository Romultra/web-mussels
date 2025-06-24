console.log("🟢 script.js loaded (HTTP backend mode)");

const API_BASE = "https://mussels.yperion.dev";

// UI Elements
const temperatureDisplay = document.getElementById('temperature');
const pumpDisplay = document.getElementById('pumpSpeed');
const odDisplay = document.getElementById('odValue');
const targetTempSlider = document.getElementById('targetTemp');
const targetTempValue = document.getElementById('targetTempValue');
const targetTempPreview = document.getElementById('targetTempPreview');
const setTargetTempBtn = document.getElementById('setTargetTempBtn');
const pidP = document.getElementById('pidP');
const pidI = document.getElementById('pidI');
const pidD = document.getElementById('pidD');
const lampBtn = document.getElementById('lampToggle');
const pidPValue = document.getElementById('pidPValue');
const pidIValue = document.getElementById('pidIValue');
const pidDValue = document.getElementById('pidDValue');
const lampStateDisplay = document.getElementById('lampStateDisplay');
const controllerPidP = document.getElementById('controllerPidP');
const controllerPidI = document.getElementById('controllerPidI');
const controllerPidD = document.getElementById('controllerPidD');
const controllerTargetTemp = document.getElementById('controllerTargetTemp');

// Fetch latest sensor data
async function fetchData() {
  try {
    const res = await fetch(`${API_BASE}/data/latest`);
    const latest = await res.json();
    if (latest && Object.keys(latest).length > 0) {
      temperatureDisplay.innerText = latest.temperature ?? "--";
      pumpDisplay.innerText = latest.pump_speed ?? "--";
      odDisplay.innerText = latest.od_value ?? "--";
    }
  } catch (e) {
    console.error("Failed to fetch data", e);
  }
}

// Fetch current settings
async function fetchSettings() {
  try {
    const res = await fetch(`${API_BASE}/settings`);
    const settings = await res.json();
    if (settings.target_temp !== undefined && settings.target_temp !== null) {
      targetTempSlider.value = settings.target_temp;
      targetTempValue.innerText = settings.target_temp;
      targetTempPreview.innerText = settings.target_temp;
    } else {
      targetTempValue.innerText = '--';
      targetTempPreview.innerText = '--';
    }
    pidP.value = settings.pid_p;
    pidI.value = settings.pid_i;
    pidD.value = settings.pid_d;
    pidPValue.innerText = settings.pid_p;
    pidIValue.innerText = settings.pid_i;
    pidDValue.innerText = settings.pid_d;
    lampBtn.textContent = settings.lamp_state;
    lampBtn.classList.toggle('on', settings.lamp_state === "ON");
  } catch (e) {
    targetTempValue.innerText = '--';
    targetTempPreview.innerText = '--';
    console.error("Failed to fetch settings", e);
  }
}

// Fetch real lamp state from backend/controller (from /data)
async function fetchLampStateFromData() {
  try {
    const res = await fetch(`${API_BASE}/data/latest`);
    const latest = await res.json();
    console.log('DEBUG /data/latest response:', latest); // Debug log
    if (latest && Object.keys(latest).length > 0) {
      lampStateDisplay.innerText = latest.lamp_state ?? '--';
      lampBtn.textContent = latest.lamp_state ?? '--';
      lampBtn.classList.toggle('on', latest.lamp_state === "ON");
      // Update controller values for PID and wanted temp
      controllerPidP.innerText = (latest.pid_p !== undefined && latest.pid_p !== null) ? latest.pid_p : '--';
      controllerPidI.innerText = (latest.pid_i !== undefined && latest.pid_i !== null) ? latest.pid_i : '--';
      controllerPidD.innerText = (latest.pid_d !== undefined && latest.pid_d !== null) ? latest.pid_d : '--';
      controllerTargetTemp.innerText = (latest.target_temp !== undefined && latest.target_temp !== null) ? latest.target_temp : '--';
    }
  } catch (e) {
    lampStateDisplay.innerText = '--';
    lampBtn.textContent = '--';
    lampBtn.classList.remove('on');
    controllerPidP.innerText = '--';
    controllerPidI.innerText = '--';
    controllerPidD.innerText = '--';
    controllerTargetTemp.innerText = '--';
    console.error('Error fetching controller data:', e); // Debug log
  }
}

// Update settings on backend
async function updateSettings() {
  const body = {
    target_temp: parseFloat(targetTempSlider.value),
    lamp_state: lampBtn.textContent,
    pid_p: parseFloat(pidP.value),
    pid_i: parseFloat(pidI.value),
    pid_d: parseFloat(pidD.value),
  };
  await fetch(`${API_BASE}/settings`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

// Update lamp state via backend/controller (send to /settings)
async function setLampStateViaSettings(newState) {
  // Get current settings to preserve other values
  const res = await fetch(`${API_BASE}/settings`);
  const settings = await res.json();
  const body = {
    target_temp: settings.target_temp,
    lamp_state: newState,
    pid_p: settings.pid_p,
    pid_i: settings.pid_i,
    pid_d: settings.pid_d,
  };
  await fetch(`${API_BASE}/settings`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  // Poll until the real lamp state matches the requested state
  let attempts = 0;
  const maxAttempts = 10;
  const poll = async () => {
    attempts++;
    const res = await fetch(`${API_BASE}/data/latest`);
    const latest = await res.json();
    if (latest && latest.lamp_state === newState) {
      fetchLampStateFromData();
      return;
    }
    if (attempts < maxAttempts) {
      setTimeout(poll, 500);
    } else {
      fetchLampStateFromData(); // fallback update
    }
  };
  poll();
}

// Event listeners for UI controls
targetTempSlider.addEventListener('input', () => {
  targetTempPreview.innerText = targetTempSlider.value || '--';
});

setTargetTempBtn.addEventListener('click', async () => {
  // Use current slider value, keep other settings as before
  const res = await fetch(`${API_BASE}/settings`);
  const settings = await res.json();
  const body = {
    target_temp: parseFloat(targetTempSlider.value),
    lamp_state: settings.lamp_state,
    pid_p: settings.pid_p,
    pid_i: settings.pid_i,
    pid_d: settings.pid_d,
  };
  await fetch(`${API_BASE}/settings`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  // Refresh current setting from backend
  fetchSettings();
});

pidP.addEventListener('change', () => {
  pidPValue.innerText = pidP.value;
  updateSettings();
});
pidI.addEventListener('change', () => {
  pidIValue.innerText = pidI.value;
  updateSettings();
});
pidD.addEventListener('change', () => {
  pidDValue.innerText = pidD.value;
  updateSettings();
});

lampBtn.addEventListener('click', async () => {
  // Use the real state to determine the next state
  const res = await fetch(`${API_BASE}/data/latest`);
  const latest = await res.json();
  let currentState = (latest && latest.lamp_state) ? latest.lamp_state : 'OFF';
  const newState = currentState === "ON" ? "OFF" : "ON";
  setLampStateViaSettings(newState);
});

// Initial load
window.addEventListener('DOMContentLoaded', () => {
  fetchData();
  fetchSettings();
  fetchLampStateFromData();
  setInterval(fetchData, 3000); // Optionally refresh data every 3 seconds
  setInterval(fetchLampStateFromData, 2000); // Poll lamp state and controller values every 2 seconds
});
