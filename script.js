console.log("🟡 script.js wurde geladen");

// MQTT-Verbindung herstellen
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

// 🔁 Empfangene MQTT-Nachrichten loggen
client.on('message', (topic, message) => {
  const value = message.toString();
  console.log(`📥 Received [${topic}]: ${value}`);

  if (topic === 'musselfarm/temperature') {
    temperatureDisplay.innerText = value;
  } else if (topic === 'musselfarm/pumpspeed') {
    pumpDisplay.innerText = value;
  } else if (topic === 'musselfarm/od') {
    odDisplay.innerText = value;
  }
});

// 📤 Funktion zum Senden + Logging
function sendCommand(topic, value) {
  const fullTopic = `musselfarm/${topic}`;
  const stringValue = String(value);
  console.log(`📤 Sent [${fullTopic}]: ${stringValue}`);
  client.publish(fullTopic, stringValue);
}

// 🎯 Zieltemperatur Slider
targetTempSlider.addEventListener('input', () => {
  const val = targetTempSlider.value;
  targetTempValue.innerText = val;
  sendCommand('settemp', val);
});

// 🛠 PID-Änderungen
pidP.addEventListener('change', () => sendCommand('pid/p', pidP.value));
pidI.addEventListener('change', () => sendCommand('pid/i', pidI.value));
pidD.addEventListener('change', () => sendCommand('pid/d', pidD.value));

// 💡 Lampen-Toggle
let lampState = false;

lampBtn.addEventListener('click', () => {
  lampState = !lampState;
  const stateStr = lampState ? 'ON' : 'OFF';
  sendCommand('lamp', stateStr);
  lampBtn.textContent = stateStr;
  lampBtn.classList.toggle('on', lampState);
});
