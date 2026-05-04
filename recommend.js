/* recommend.js – Crop Recommendation Engine Logic */
document.addEventListener('DOMContentLoaded', () => {

  /* Detect if page is served from file:// and warn */
  if (location.protocol === 'file:') {
    console.warn('[Farmlytics] Running from file:// — fetch to localhost will be blocked by CORS. Open via http://localhost:8080');
  }

  const API = 'http://127.0.0.1:5000/predict';

  const CROP_ICONS = {
    rice:'🌾', maize:'🌽', chickpea:'🫘', kidneybeans:'🫘', pigeonpeas:'🌿',
    mothbeans:'🌱', mungbean:'🟢', blackgram:'⚫', lentil:'🟤', pomegranate:'🍎',
    banana:'🍌', mango:'🥭', grapes:'🍇', watermelon:'🍉', muskmelon:'🍈',
    apple:'🍎', orange:'🍊', papaya:'🧡', coconut:'🥥', cotton:'🌸',
    jute:'🌿', coffee:'☕'
  };

  // Fields: slider id → display val id, bar id, guide id, min, max
  const FIELDS = [
    { id: 'N',           valId: 'val-N',    barId: 'bar-N',           guideId: 'guide-N',    min: 0,   max: 140, label: 'Nitrogen',     unit: 'kg/ha' },
    { id: 'P',           valId: 'val-P',    barId: 'bar-P',           guideId: 'guide-P',    min: 5,   max: 145, label: 'Phosphorus',   unit: 'kg/ha' },
    { id: 'K',           valId: 'val-K',    barId: 'bar-K',           guideId: 'guide-K',    min: 5,   max: 205, label: 'Potassium',    unit: 'kg/ha' },
    { id: 'temperature', valId: 'val-temp', barId: 'bar-temperature', guideId: 'guide-temp', min: 8,   max: 44,  label: 'Temperature',  unit: '°C'    },
    { id: 'humidity',    valId: 'val-hum',  barId: 'bar-humidity',    guideId: 'guide-hum',  min: 14,  max: 100, label: 'Humidity',     unit: '%'     },
    { id: 'ph',          valId: 'val-ph',   barId: 'bar-ph',          guideId: 'guide-ph',   min: 3.5, max: 9.9, label: 'pH Level',     unit: ''      },
    { id: 'rainfall',    valId: 'val-rain', barId: 'bar-rainfall',    guideId: 'guide-rain', min: 20,  max: 300, label: 'Rainfall',     unit: 'mm'    },
  ];

  /* ─────────────────────────────────────────
     Slider Sync + Progress + Guide highlight
     ───────────────────────────────────────── */
  function pct(val, min, max) {
    return ((val - min) / (max - min) * 100).toFixed(2) + '%';
  }

  function updateProgress() {
    const total = FIELDS.length;
    const moved = FIELDS.filter(f => {
      const el = document.getElementById(f.id);
      return el && parseFloat(el.value) !== f.min;
    }).length;
    const p = Math.round(moved / total * 100);
    document.getElementById('progressFill').style.width = p + '%';
    document.getElementById('progressLabel').textContent = `${moved} of ${total} fields adjusted`;
  }

  FIELDS.forEach(field => {
    const slider  = document.getElementById(field.id);
    const valEl   = document.getElementById(field.valId);
    const barEl   = document.getElementById(field.barId);
    const guideEl = document.getElementById(field.guideId);

    if (!slider) return;

    // Init display
    valEl.textContent = slider.value;
    barEl.style.width = pct(slider.value, field.min, field.max);

    slider.addEventListener('input', () => {
      const v = parseFloat(slider.value);
      valEl.textContent = Number.isInteger(v) ? v : v.toFixed(1);
      barEl.style.width = pct(v, field.min, field.max);
      updateProgress();

      // Highlight active guide item
      document.querySelectorAll('.guide-item').forEach(g => g.classList.remove('active'));
      if (guideEl) guideEl.classList.add('active');
    });

    slider.addEventListener('focus', () => {
      document.querySelectorAll('.guide-item').forEach(g => g.classList.remove('active'));
      if (guideEl) guideEl.classList.add('active');
    });
  });

  // Initial progress
  updateProgress();

  /* ─────────────────────────────────────────
     Gather Values
     ───────────────────────────────────────── */
  function getValues() {
    const out = {};
    FIELDS.forEach(f => { out[f.id] = parseFloat(document.getElementById(f.id).value); });
    return out;
  }

  /* ─────────────────────────────────────────
     Toast
     ───────────────────────────────────────── */
  const toastEl = document.getElementById('toast');
  function showToast(msg) {
    document.getElementById('toastMsg').textContent = msg;
    toastEl.classList.add('show');
    setTimeout(() => toastEl.classList.remove('show'), 4500);
  }

  /* ─────────────────────────────────────────
     Loading
     ───────────────────────────────────────── */
  const overlay = document.getElementById('loadingOverlay');
  const submitBtn = document.getElementById('submitBtn');

  function setLoading(on) {
    overlay.classList.toggle('show', on);
    submitBtn.disabled = on;
    submitBtn.classList.toggle('loading', on);
  }

  /* ─────────────────────────────────────────
     Confetti
     ───────────────────────────────────────── */
  function launchConfetti() {
    const container = document.getElementById('confettiContainer');
    container.innerHTML = '';
    const colors = ['#4caf50','#81c784','#a5d6a7','#ffeb3b','#fff59d','#b2dfdb'];
    for (let i = 0; i < 70; i++) {
      const p = document.createElement('div');
      p.className = 'confetti-piece';
      p.style.cssText = `
        left: ${Math.random() * 100}%;
        background: ${colors[Math.floor(Math.random() * colors.length)]};
        width: ${6 + Math.random() * 6}px;
        height: ${6 + Math.random() * 6}px;
        animation-duration: ${1.4 + Math.random() * 2}s;
        animation-delay: ${Math.random() * 0.5}s;
        border-radius: ${Math.random() > 0.5 ? '50%' : '3px'};
      `;
      container.appendChild(p);
    }
  }

  /* ─────────────────────────────────────────
     Render Results
     ───────────────────────────────────────── */
  function renderResults(data, inputs) {
    // Banner
    document.getElementById('resultCropName').textContent = data.primary;
    document.getElementById('resultCluster').textContent = `Soil Cluster #${data.cluster}`;

    // Crown icon
    const crown = CROP_ICONS[data.primary.toLowerCase()] || '🌾';
    document.getElementById('resultCrown').textContent = crown;

    launchConfetti();

    // Soil grid
    const soilGrid = document.getElementById('soilGrid');
    soilGrid.innerHTML = '';
    FIELDS.forEach(f => {
      const v = inputs[f.id];
      soilGrid.innerHTML += `
        <div class="soil-item">
          <div class="soil-item-label">${f.label}</div>
          <div class="soil-item-value">${Number.isInteger(v) ? v : v.toFixed(1)}</div>
          <div class="soil-item-unit">${f.unit}</div>
        </div>`;
    });

    // Crop cards
    const cropsGrid = document.getElementById('cropsGrid');
    cropsGrid.innerHTML = '';
    document.getElementById('cropsSubtitle').textContent =
      `${data.recommendations.length} crops identified for your field conditions`;

    data.recommendations.forEach((crop, i) => {
      const isPrimary = crop.name === data.primary;
      const icon = CROP_ICONS[crop.name.toLowerCase()] || '🌱';
      const seasons = Array.isArray(crop.season) ? crop.season.join(', ') : (crop.season || 'N/A');
      const card = document.createElement('div');
      card.className = 'crop-card' + (isPrimary ? ' is-primary' : '');
      card.style.animationDelay = (i * 0.06) + 's';
      card.innerHTML = `
        ${isPrimary ? '<div class="crop-primary-tag">⭐ Top Pick</div>' : ''}
        <div class="crop-icon">${icon}</div>
        <div class="crop-name">${crop.name}</div>
        <div class="crop-meta">
          <div class="crop-meta-row">🗓 <strong>${seasons}</strong></div>
          <div class="crop-meta-row">💧 <strong>${crop.water}</strong></div>
          <div class="crop-meta-row">⏱ <strong>${crop.period}</strong></div>
        </div>
      `;
      cropsGrid.appendChild(card);
    });

    // Show results, hide form
    document.getElementById('formSection').style.display = 'none';
    const rs = document.getElementById('resultsSection');
    rs.classList.add('show');
    rs.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  /* ─────────────────────────────────────────
     Form Submit
     ───────────────────────────────────────── */
  document.getElementById('cropForm').addEventListener('submit', async e => {
    e.preventDefault();
    const values = getValues();
    setLoading(true);

    try {
      const res  = await fetch(API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      const data = await res.json();

      if (!data.success) throw new Error(data.error || 'Prediction failed');
      renderResults(data, values);

    } catch (err) {
      const isFileProt = location.protocol === 'file:';
      const isNetwork  = err.message.toLowerCase().includes('fetch') ||
                         err.message.toLowerCase().includes('failed') ||
                         err.message.toLowerCase().includes('network');

      if (isFileProt) {
        showToast('Open via http://localhost:8080, not as a file');
      } else if (isNetwork) {
        showToast('⚡ Backend offline — run: python app.py');
      } else {
        showToast(err.message);
      }
    } finally {
      setLoading(false);
    }
  });

  /* ─────────────────────────────────────────
     Reset
     ───────────────────────────────────────── */
  document.getElementById('resetBtn').addEventListener('click', () => {
    FIELDS.forEach(f => {
      const slider = document.getElementById(f.id);
      if (slider) {
        slider.value = f.min;
        document.getElementById(f.valId).textContent = f.min;
        document.getElementById(f.barId).style.width = '0%';
      }
    });
    document.querySelectorAll('.guide-item').forEach(g => g.classList.remove('active'));
    updateProgress();
  });

  /* ─────────────────────────────────────────
     Try Again
     ───────────────────────────────────────── */
  document.getElementById('tryAgainBtn').addEventListener('click', () => {
    const rs = document.getElementById('resultsSection');
    rs.classList.remove('show');
    const fs = document.getElementById('formSection');
    fs.style.display = '';
    fs.scrollIntoView({ behavior: 'smooth' });
  });

});
