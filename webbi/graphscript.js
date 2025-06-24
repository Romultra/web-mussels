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

// Helper: Convert date+time string in Europe/Copenhagen to UTC ISO string
function dkTimeToUtcIso(dateStr, timeStr) {
  if (!dateStr || !timeStr) return null;
  // Europe/Copenhagen offset (handles DST automatically)
  const dkDate = new Date(`${dateStr}T${timeStr}:00`);
  // Get UTC time by subtracting the local timezone offset (in minutes)
  // But we want to treat the input as Europe/Copenhagen, not browser local
  // So we use Intl to get the offset for Europe/Copenhagen
  try {
    const tz = 'Europe/Copenhagen';
    // Get the offset in minutes for the given date/time in DK
    const fmt = new Intl.DateTimeFormat('en-US', { timeZone: tz, hour12: false, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const parts = fmt.formatToParts(dkDate);
    // Build a UTC date from the DK time parts
    const y = parts.find(p => p.type === 'year').value;
    const m = parts.find(p => p.type === 'month').value;
    const d = parts.find(p => p.type === 'day').value;
    const h = parts.find(p => p.type === 'hour').value;
    const min = parts.find(p => p.type === 'minute').value;
    const s = parts.find(p => p.type === 'second').value;
    // This is the time in DK, so create a Date object as if it's UTC, then subtract the DK offset
    const dkAsUtc = new Date(Date.UTC(y, m-1, d, h, min, s));
    // Now get the offset between DK and UTC at that time
    const dkOffset = -dkAsUtc.getTimezoneOffset(); // in minutes
    // But getTimezoneOffset() uses browser local, so instead, use the original dkDate
    // The correct UTC ISO string is:
    return new Date(dkDate.getTime() - (dkDate.getTimezoneOffset() - dkAsUtc.getTimezoneOffset())*60000).toISOString();
  } catch (e) {
    // Fallback: treat as browser local
    return new Date(dkDate.getTime() - dkDate.getTimezoneOffset()*60000).toISOString();
  }
}

// Fetch data from backend and update charts
async function fetchAndShowData(fromTime = null, toTime = null) {
  let url = `${API_BASE}/data`;
  const params = [];
  if (fromTime) params.push(`from_time=${encodeURIComponent(fromTime)}`);
  if (toTime) params.push(`to_time=${encodeURIComponent(toTime)}`);
  if (params.length > 0) url += `?${params.join('&')}`;
  console.log('DEBUG fetch url:', url); // Debug log
  const res = await fetch(url);
  const data = await res.json();
  console.log('DEBUG data response:', data); // Debug log

  // Prepare arrays for charts
  const labels = [];
  const tempArr = [];
  const odArr = [];
  const pumpArr = [];

  data.forEach(entry => {
    // Convert ISO string to Denmark local time
    const date = new Date(entry.timestamp);
    // Denmark is Europe/Copenhagen, browser will use local time zone
    const timeLabel = date.toLocaleString('da-DK', { hour: '2-digit', minute: '2-digit', second: '2-digit', day: '2-digit', month: '2-digit', year: '2-digit' });
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

function startLivePolling(fromTime) {
  if (pollInterval) clearInterval(pollInterval);
  pollInterval = setInterval(() => fetchAndShowData(fromTime, null), 3000);
}

function stopLivePolling() {
  if (pollInterval) clearInterval(pollInterval);
  pollInterval = null;
}

document.getElementById('liveMode').addEventListener('change', (e) => {
  const toFields = document.getElementById('toFields');
  const fromDay = document.getElementById('fromDay').value || '2025-06-18';
  const fromTime = document.getElementById('fromTime').value;
  let lastFromTime = null;
  if (fromTime) {
    lastFromTime = dkTimeToUtcIso(fromDay, fromTime);
  }
  if (e.target.checked) {
    toFields.style.visibility = 'hidden';
    toFields.style.height = '0';
    fetchAndShowData(lastFromTime, null);
    startLivePolling(lastFromTime);
  } else {
    toFields.style.visibility = 'visible';
    toFields.style.height = 'auto';
    stopLivePolling();
  }
});

document.getElementById('fetchBtn').addEventListener('click', () => {
  const fromDay = document.getElementById('fromDay').value || '2025-06-18';
  const fromTime = document.getElementById('fromTime').value;
  let lastFromTime = null;
  if (fromTime) {
    lastFromTime = dkTimeToUtcIso(fromDay, fromTime);
  }
  let lastToTime = null;
  if (!document.getElementById('liveMode').checked) {
    const toDay = document.getElementById('toDay').value || fromDay;
    const toTime = document.getElementById('toTime').value;
    if (toTime && toDay) {
      lastToTime = dkTimeToUtcIso(toDay, toTime);
    }
  }
  console.log('DEBUG fetchBtn from:', lastFromTime, 'to:', lastToTime); // Debug log
  fetchAndShowData(lastFromTime, lastToTime);
  if (document.getElementById('liveMode').checked) {
    startLivePolling(lastFromTime);
  }
});

// Utility to download CSV from chart data
function downloadCsv(labels, data, label, filename) {
  let csv = 'Time,' + label + '\n';
  for (let i = 0; i < labels.length; i++) {
    csv += `${labels[i]},${data[i]}\n`;
  }
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

document.getElementById('downloadTempCsv').addEventListener('click', () => {
  downloadCsv(tempData.labels, tempData.datasets[0].data, 'Temperature (°C)', 'temperature.csv');
});
document.getElementById('downloadOdCsv').addEventListener('click', () => {
  downloadCsv(odData.labels, odData.datasets[0].data, 'Algae Concentration (cells/mL)', 'algae_concentration.csv');
});
document.getElementById('downloadPumpCsv').addEventListener('click', () => {
  downloadCsv(pumpData.labels, pumpData.datasets[0].data, 'Pump Speed (%)', 'pump_speed.csv');
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
  let lastFromTime = fromTime ? new Date(`${fromDay}T${fromTime}:00Z`).toISOString() : null;
  fetchAndShowData(lastFromTime, null);
  stopLivePolling();

  document.getElementById('liveMode').addEventListener('change', (e) => {
    const toFields = document.getElementById('toFields');
    const fromDay = document.getElementById('fromDay').value || '2025-06-18';
    const fromTime = document.getElementById('fromTime').value;
    let lastFromTime = null;
    if (fromTime) {
      lastFromTime = dkTimeToUtcIso(fromDay, fromTime);
    }
    if (e.target.checked) {
      toFields.style.visibility = 'hidden';
      toFields.style.height = '0';
      fetchAndShowData(lastFromTime, null);
      startLivePolling(lastFromTime);
    } else {
      toFields.style.visibility = 'visible';
      toFields.style.height = 'auto';
      stopLivePolling();
    }
  });

  document.getElementById('fetchBtn').addEventListener('click', () => {
    const fromDay = document.getElementById('fromDay').value || '2025-06-18';
    const fromTime = document.getElementById('fromTime').value;
    let lastFromTime = null;
    if (fromTime) {
      lastFromTime = dkTimeToUtcIso(fromDay, fromTime);
    }
    let lastToTime = null;
    if (!document.getElementById('liveMode').checked) {
      const toDay = document.getElementById('toDay').value || fromDay;
      const toTime = document.getElementById('toTime').value;
      if (toTime && toDay) {
        lastToTime = dkTimeToUtcIso(toDay, toTime);
      }
    }
    fetchAndShowData(lastFromTime, lastToTime);
    if (document.getElementById('liveMode').checked) {
      startLivePolling(lastFromTime);
    }
  });

  document.getElementById('downloadTempCsv').addEventListener('click', () => {
    downloadCsv(tempData.labels, tempData.datasets[0].data, 'Temperature (°C)', 'temperature.csv');
  });
  document.getElementById('downloadOdCsv').addEventListener('click', () => {
    downloadCsv(odData.labels, odData.datasets[0].data, 'Algae Concentration (cells/mL)', 'algae_concentration.csv');
  });
  document.getElementById('downloadPumpCsv').addEventListener('click', () => {
    downloadCsv(pumpData.labels, pumpData.datasets[0].data, 'Pump Speed (%)', 'pump_speed.csv');
  });
});

window.addEventListener('error', function(e) {
  console.error('Global JS error:', e.message, e);
});
