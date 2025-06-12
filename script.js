console.log("🟡 script.js wurde geladen");

const options = {
  connectTimeout: 4000,
  clientId: 'webclient_' + Math.random().toString(16).substr(2, 8),
};

const host = 'ws://localhost:9001/mqtt';
const client = mqtt.connect('ws://localhost:9001');
console.log("⏳ Versuche MQTT-Verbindung...");

client.on('connect', () => {
  console.log('✅ MQTT connected');
  client.subscribe('musselfarm/temperature');
  client.subscribe('musselfarm/pumpspeed');
});

client.on('error', (err) => {
  console.error("❌ MQTT Fehler:", err);
});

// UI Elements
const temperatureDisplay = document.getElementById('temperature');
const pumpDisplay = document.getElementById('pumpSpeed');
const targetTempSlider = document.getElementById('targetTemp');
const targetTempValue = document.getElementById('targetTempValue');

// PID Number Inputs
const pidP = document.getElementById('pidP');
const pidI = document.getElementById('pidI');
const pidD = document.getElementById('pidD');

const lampBtn = document.getElementById('lampToggle');

// MQTT Logic
client.on('connect', () => {
  console.log('✅ MQTT connected');
  client.subscribe('musselfarm/temperature');
  client.subscribe('musselfarm/pumpspeed');
});

client.on('message', (topic, message) => {
  const value = message.toString();
  if (topic === 'musselfarm/temperature') {
    temperatureDisplay.innerText = value;
  } else if (topic === 'musselfarm/pumpspeed') {
    pumpDisplay.innerText = value;
  }
});

function sendCommand(topic, value) {
  client.publish(`musselfarm/${topic}`, String(value));
}

// Set Temperature
targetTempSlider.addEventListener('input', () => {
  const val = targetTempSlider.value;
  targetTempValue.innerText = val;
  sendCommand('settemp', val);
});

// Send PID values (Number Inputs)
pidP.addEventListener('change', () => {
  sendCommand('pid/p', pidP.value);
});
pidI.addEventListener('change', () => {
  sendCommand('pid/i', pidI.value);
});
pidD.addEventListener('change', () => {
  sendCommand('pid/d', pidD.value);
});

// Lamp Toggle
let lampState = false; // false = OFF, true = ON

lampBtn.addEventListener('click', () => {
  lampState = !lampState;
  const stateStr = lampState ? 'ON' : 'OFF';
  sendCommand('lamp', stateStr);

  lampBtn.textContent = stateStr;
  lampBtn.classList.toggle('on', lampState);
});
