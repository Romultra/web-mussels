// JavaScript for graphs.html moved here for clarity and maintainability.
const API_BASE = "https://mussels.yperion.dev";
const maxPoints = 100;

// Chart.js data objects
const tempData = {
  labels: [],
  datasets: [{
    label: 'Temperature (°C)',
    borderColor: 'rgba(255, 0, 0, 1)',
    backgroundColor: 'rgba(0,0,0,0)', // No area fill
    data: [],
    tension: 0.3,
    fill: false,
  }],
};
const odData = {
  labels: [],
  datasets: [{
    label: 'Algae Concentration (cells/mL)',
    borderColor: 'rgba(0, 128, 0, 1)',
    backgroundColor: 'rgba(0,0,0,0)', // No area fill
    data: [],
    tension: 0.3,
    fill: false,
  }],
};
const pumpData = {
  labels: [],
  datasets: [{
    label: 'Pump Speed (%)',
    borderColor: 'rgba(0, 0, 255, 1)',
    backgroundColor: 'rgba(0,0,0,0)', // No area fill
    data: [],
    tension: 0.3,
    fill: false,
  }],
};

// Chart.js chart objects
const tempChart = new Chart(document.getElementById('tempChart'), {
  type: 'line',
  data: tempData,
  options: {
    responsive: true,
    animation: false,
    plugins: {
      legend: {
        labels: {
          usePointStyle: true,
          pointStyle: 'line',
        }
      }
    },
    scales: {
      x: { title: { display: true, text: 'Time' } },
      y: { beginAtZero: true }
    }
  }
});
const odChart = new Chart(document.getElementById('odChart'), {
  type: 'line',
  data: odData,
  options: {
    responsive: true,
    animation: false,
    plugins: {
      legend: {
        labels: {
          usePointStyle: true,
          pointStyle: 'line',
        }
      }
    },
    scales: {
      x: { title: { display: true, text: 'Time' } },
      y: { beginAtZero: true }
    }
  }
});
const pumpChart = new Chart(document.getElementById('pumpChart'), {
  type: 'line',
  data: pumpData,
  options: {
    responsive: true,
    animation: false,
    plugins: {
      legend: {
        labels: {
          usePointStyle: true,
          pointStyle: 'line',
        }
      }
    },
    scales: {
      x: { title: { display: true, text: 'Time' } },
      y: { beginAtZero: true }
    }
  }
});

let pollInterval = null;
let lastFromTime = null;
let liveMode = true;

// Fetch data from backend and update charts
async function fetchAndShowData(fromTime = null) {
  let url = `${API_BASE}/data`;
  const params = [];
  if (fromTime) params.push(`from_time=${encodeURIComponent(fromTime)}`);
  if (params.length > 0) url += `?${params.join('&')}`;
  const res = await fetch(url);
  const data = await res.json();

  // Prepare arrays for charts
  const labels = [];
  const tempArr = [];
  const odArr = [];
  const pumpArr = [];

  data.slice(-maxPoints).forEach(entry => {
    const timeLabel = new Date(entry.timestamp).toLocaleTimeString();
    labels.push(timeLabel);
    tempArr.push(entry.temperature);
    odArr.push(entry.od_value);
    pumpArr.push(entry.pump_speed);
  });

  tempData.labels = odData.labels = pumpData.labels = labels;
  tempData.datasets[0].data = tempArr;
  odData.datasets[0].data = odArr;
  pumpData.datasets[0].data = pumpArr;
  tempChart.update();
  odChart.update();
  pumpChart.update();
}

function startLivePolling() {
  if (pollInterval) clearInterval(pollInterval);
  pollInterval = setInterval(() => fetchAndShowData(lastFromTime), 3000);
}
function stopLivePolling() {
  if (pollInterval) clearInterval(pollInterval);
  pollInterval = null;
}

document.getElementById('liveMode').addEventListener('change', (e) => {
  const toFields = document.getElementById('toFields');
  if (e.target.checked) {
    toFields.style.visibility = 'hidden';
    toFields.style.height = '0';
    // Start live polling immediately
    const fromDay = document.getElementById('fromDay').value || '2025-06-18';
    const fromTime = document.getElementById('fromTime').value;
    let lastFromTime = fromTime ? `${fromDay}T${fromTime}:00` : null;
    fetchAndShowData(lastFromTime, null);
    startLivePolling();
  } else {
    toFields.style.visibility = 'visible';
    toFields.style.height = 'auto';
    stopLivePolling();
  }
});

document.getElementById('fetchBtn').addEventListener('click', () => {
  const fromDay = document.getElementById('fromDay').value || '2025-06-18';
  const fromTime = document.getElementById('fromTime').value;
  liveMode = document.getElementById('liveMode').checked;
  let lastFromTime = fromTime ? `${fromDay}T${fromTime}:00` : null;
  let lastToTime = null;
  if (!liveMode) {
    const toDay = document.getElementById('toDay').value || fromDay;
    const toTime = document.getElementById('toTime').value;
    lastToTime = (toTime && toDay) ? `${toDay}T${toTime}:00` : null;
  }
  fetchAndShowData(lastFromTime, liveMode ? null : lastToTime);
  if (liveMode) {
    startLivePolling();
  } else {
    stopLivePolling();
  }
});

// On page load, show latest and start live polling
window.addEventListener('DOMContentLoaded', () => {
  // Set liveMode to off by default and show To fields
  const liveModeCheckbox = document.getElementById('liveMode');
  const toFields = document.getElementById('toFields');
  liveModeCheckbox.checked = false;
  toFields.style.visibility = 'visible';
  toFields.style.height = 'auto';

  const fromDay = document.getElementById('fromDay').value || '2025-06-18';
  const fromTime = document.getElementById('fromTime').value;
  let lastFromTime = fromTime ? `${fromDay}T${fromTime}:00` : null;
  fetchAndShowData(lastFromTime, null);
  stopLivePolling();
});
