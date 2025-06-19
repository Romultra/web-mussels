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

// Fetch latest sensor data
async function fetchData() {
  try {
    const res = await fetch(`${API_BASE}/data`);
    const data = await res.json();
    if (data.length > 0) {
      const latest = data[0];
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

// Fetch real lamp state from backend/controller
async function fetchLampState() {
  try {
    const res = await fetch(`${API_BASE}/lamp_state`);
    const data = await res.json();
    lampStateDisplay.innerText = data.lamp_state;
    // Update lamp button to reflect real state
    lampBtn.textContent = data.lamp_state;
    lampBtn.classList.toggle('on', data.lamp_state === "ON");
  } catch (e) {
    lampStateDisplay.innerText = '--';
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

// Update lamp state via backend/controller
async function setLampState(state) {
  await fetch(`${API_BASE}/lamp_state`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ state }),
  });
  // Optionally, refresh the lamp state after a short delay
  setTimeout(fetchLampState, 500);
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

lampBtn.addEventListener('click', () => {
  const newState = lampBtn.textContent === "ON" ? "OFF" : "ON";
  setLampState(newState);
});

// Initial load
window.addEventListener('DOMContentLoaded', () => {
  fetchData();
  fetchSettings();
  fetchLampState();
  setInterval(fetchData, 3000); // Optionally refresh data every 3 seconds
  setInterval(fetchLampState, 2000); // Poll lamp state every 2 seconds
});