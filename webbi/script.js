console.log("🟢 script.js loaded (HTTP backend mode)");

const API_BASE = "http://localhost:8000";

// UI Elements
const temperatureDisplay = document.getElementById('temperature');
const pumpDisplay = document.getElementById('pumpSpeed');
const odDisplay = document.getElementById('odValue');
const targetTempSlider = document.getElementById('targetTemp');
const targetTempValue = document.getElementById('targetTempValue');
const pidP = document.getElementById('pidP');
const pidI = document.getElementById('pidI');
const pidD = document.getElementById('pidD');
const lampBtn = document.getElementById('lampToggle');

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
    targetTempSlider.value = settings.target_temp;
    targetTempValue.innerText = settings.target_temp;
    pidP.value = settings.pid_p;
    pidI.value = settings.pid_i;
    pidD.value = settings.pid_d;
    lampBtn.textContent = settings.lamp_state;
    lampBtn.classList.toggle('on', settings.lamp_state === "ON");
  } catch (e) {
    console.error("Failed to fetch settings", e);
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

// Event listeners for UI controls
targetTempSlider.addEventListener('input', () => {
  targetTempValue.innerText = targetTempSlider.value;
  updateSettings();
});

pidP.addEventListener('change', updateSettings);
pidI.addEventListener('change', updateSettings);
pidD.addEventListener('change', updateSettings);

lampBtn.addEventListener('click', () => {
  lampBtn.textContent = lampBtn.textContent === "ON" ? "OFF" : "ON";
  lampBtn.classList.toggle('on', lampBtn.textContent === "ON");
  updateSettings();
});

// Initial load
window.addEventListener('DOMContentLoaded', () => {
  fetchData();
  fetchSettings();
  setInterval(fetchData, 3000); // Optionally refresh data every 3 seconds
});