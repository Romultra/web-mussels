console.log("🟡 script.js wurde geladen");

//const options = {
//  connectTimeout: 4000,
//  clientId: 'webclient_' + Math.random().toString(16).substr(2, 8),
//};

//const host = 'ws://localhost:9001';
//const client = mqtt.connect(host);


// WebSocket Secure (wss://) über Caddy-Proxy
const client = mqtt.connect('wss://mqtt.yperion.dev', {
  connectTimeout: 4000,
  clientId: 'webclient_' + Math.random().toString(16).substr(2, 8),
});

console.log("⏳ Versuche MQTT-Verbindung...");

// Verbindung erfolgreich
client.on('connect', () => {
  console.log('✅ MQTT connected');
  client.subscribe('musselfarm/temperature');
  client.subscribe('musselfarm/pumpspeed');
  client.subscribe('musselfarm/od');
});
// Fehlerbehandlung
client.on('error', (err) => {
  console.error("❌ MQTT Fehler:", err);
});

// UI Elements
const temperatureDisplay = document.getElementById('temperature');
const pumpDisplay = document.getElementById('pumpSpeed');
const odDisplay = document.getElementById('odValue');
const targetTempSlider = document.getElementById('targetTemp');
const targetTempValue = document.getElementById('targetTempValue');

// PID Number Inputs
const pidP = document.getElementById('pidP');
const pidI = document.getElementById('pidI');
const pidD = document.getElementById('pidD');

// Lamp button
const lampBtn = document.getElementById('lampToggle');

// MQTT message handling
client.on('message', (topic, message) => {
  const value = message.toString();
  if (topic === 'musselfarm/temperature') {
    temperatureDisplay.innerText = value;
  } else if (topic === 'musselfarm/pumpspeed') {
    pumpDisplay.innerText = value;
  } else if (topic === 'musselfarm/od') {
    odDisplay.innerText = value;
  }
});

// Publish helper
function sendCommand(topic, value) {
  client.publish(`musselfarm/${topic}`, String(value));
}

// Target temperature slider
targetTempSlider.addEventListener('input', () => {
  const val = targetTempSlider.value;
  targetTempValue.innerText = val;
  sendCommand('settemp', val);
});

// PID changes
pidP.addEventListener('change', () => sendCommand('pid/p', pidP.value));
pidI.addEventListener('change', () => sendCommand('pid/i', pidI.value));
pidD.addEventListener('change', () => sendCommand('pid/d', pidD.value));

// Lamp toggle logic
let lampState = false;

lampBtn.addEventListener('click', () => {
  lampState = !lampState;
  const stateStr = lampState ? 'ON' : 'OFF';
  sendCommand('lamp', stateStr);
  lampBtn.textContent = stateStr;
  lampBtn.classList.toggle('on', lampState);
});
