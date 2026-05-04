/* supply-chain.js — Supply Chain Profiler */
document.addEventListener('DOMContentLoaded', () => {

  const API = 'http://127.0.0.1:5000/supply-chain';

  const FIELDS = [
    { id: 'N',           valId: 'val-N',    barId: 'bar-N',           min: 0,   max: 140, label: 'Nitrogen',     unit: 'kg/ha' },
    { id: 'P',           valId: 'val-P',    barId: 'bar-P',           min: 5,   max: 145, label: 'Phosphorus',   unit: 'kg/ha' },
    { id: 'K',           valId: 'val-K',    barId: 'bar-K',           min: 5,   max: 205, label: 'Potassium',    unit: 'kg/ha' },
    { id: 'temperature', valId: 'val-temp', barId: 'bar-temperature', min: 8,   max: 44,  label: 'Temperature',  unit: '°C'    },
    { id: 'humidity',    valId: 'val-hum',  barId: 'bar-humidity',    min: 14,  max: 100, label: 'Humidity',     unit: '%'     },
    { id: 'ph',          valId: 'val-ph',   barId: 'bar-ph',          min: 3.5, max: 9.9, label: 'pH Level',     unit: ''      },
    { id: 'rainfall',    valId: 'val-rain', barId: 'bar-rainfall',    min: 20,  max: 300, label: 'Rainfall',     unit: 'mm'    },
  ];

  /* ── Slider sync ── */
  function pct(v, min, max) { return ((v - min) / (max - min) * 100).toFixed(2) + '%'; }

  function updateProgress() {
    const moved = FIELDS.filter(f => {
      const el = document.getElementById(f.id);
      return el && parseFloat(el.value) !== f.min;
    }).length;
    const p = Math.round(moved / FIELDS.length * 100);
    document.getElementById('progressFill').style.width = p + '%';
    document.getElementById('progressLabel').textContent = `${moved} of ${FIELDS.length} fields adjusted`;
  }

  FIELDS.forEach(field => {
    const slider = document.getElementById(field.id);
    const valEl  = document.getElementById(field.valId);
    const barEl  = document.getElementById(field.barId);
    if (!slider) return;

    valEl.textContent = slider.value;
    barEl.style.width = pct(slider.value, field.min, field.max);

    slider.addEventListener('input', () => {
      const v = parseFloat(slider.value);
      valEl.textContent = Number.isInteger(v) ? v : v.toFixed(1);
      barEl.style.width = pct(v, field.min, field.max);
      updateProgress();
    });
  });

  updateProgress();

  /* ── Gather values ── */
  function getValues() {
    const out = {};
    FIELDS.forEach(f => { out[f.id] = parseFloat(document.getElementById(f.id).value); });
    return out;
  }

  /* ── Toast ── */
  const toastEl = document.getElementById('scToast');
  function showToast(msg) {
    document.getElementById('scToastMsg').textContent = msg;
    toastEl.classList.add('show');
    setTimeout(() => toastEl.classList.remove('show'), 4500);
  }

  /* ── Loading ── */
  const overlay   = document.getElementById('scLoadingOverlay');
  const submitBtn = document.getElementById('scSubmitBtn');

  function setLoading(on) {
    overlay.classList.toggle('show', on);
    submitBtn.disabled = on;
    submitBtn.classList.toggle('loading', on);
  }

  /* ── Render Results ── */
  function renderResults(data, inputs) {
    const p = data.profile;
    const color = p.color || '#ff9800';

    // Set CSS variable for accent color on results
    const rs = document.getElementById('scResultsSection');
    rs.style.setProperty('--sc-color', color);

    // Banner
    document.getElementById('scProfileIcon').textContent   = p.icon;
    document.getElementById('scProfileLabel').textContent  = p.label;
    document.getElementById('scProfileName').textContent   = p.name;
    document.getElementById('scProfileDesc').textContent   = p.desc;

    const banner = document.getElementById('scProfileBanner');
    banner.style.borderColor = color + '40';
    banner.style.setProperty('--sc-color', color);

    // Warning
    const warnBanner = document.getElementById('scWarningBanner');
    if (p.warning) {
      document.getElementById('scWarningText').textContent = p.warning;
      warnBanner.style.display = 'flex';
    } else {
      warnBanner.style.display = 'none';
    }

    // KPI Row
    const kpiData = [
      { label: 'Strategy',      value: p.strategy,    sub: 'Recommended approach' },
      { label: 'Margin Range',  value: p.margin,      sub: 'Expected profit margin' },
      { label: 'Sell-Through',  value: p.sell_through, sub: 'Market velocity' },
    ];
    const kpiRow = document.getElementById('scKpiRow');
    kpiRow.innerHTML = '';
    kpiData.forEach((k, i) => {
      kpiRow.innerHTML += `
        <div class="sc-kpi" style="animation-delay:${i*0.07}s; border-left: 3px solid ${color};">
          <div class="sc-kpi-label">${k.label}</div>
          <div class="sc-kpi-value">${k.value}</div>
          <div class="sc-kpi-sub">${k.sub}</div>
        </div>`;
    });

    // Channels
    const chEl = document.getElementById('scChannels');
    chEl.style.setProperty('--sc-color', color);
    chEl.innerHTML = p.channels.map(c => `
      <div class="sc-channel" style="border-left-color:${color};">
        <span style="font-size:16px;">📍</span> ${c}
      </div>`).join('');

    // Tips
    const tipsEl = document.getElementById('scTips');
    tipsEl.innerHTML = p.tips.map((t, i) => `
      <div class="sc-tip">
        <div class="sc-tip-num" style="background:${color}20; color:${color};">${i+1}</div>
        <span>${t}</span>
      </div>`).join('');

    // Soil grid
    const soilGrid = document.getElementById('scSoilGrid');
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

    // Show / hide
    document.getElementById('scFormSection').style.display = 'none';
    rs.classList.add('show');
    rs.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  /* ── Form submit ── */
  document.getElementById('scForm').addEventListener('submit', async e => {
    e.preventDefault();
    const values = getValues();
    setLoading(true);

    try {
      const res  = await fetch(API, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(values),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Prediction failed');
      renderResults(data, values);
    } catch (err) {
      const isFileProt = location.protocol === 'file:';
      const isNetwork  = err.message.toLowerCase().includes('fetch') ||
                         err.message.toLowerCase().includes('failed');
      if (isFileProt)    showToast('⚠️ Open via http://localhost:8080, not as a file');
      else if (isNetwork) showToast('⚡ Backend offline — run: python app.py');
      else               showToast(err.message);
    } finally {
      setLoading(false);
    }
  });

  /* ── Reset ── */
  document.getElementById('scResetBtn').addEventListener('click', () => {
    FIELDS.forEach(f => {
      const slider = document.getElementById(f.id);
      if (slider) {
        slider.value = f.min;
        document.getElementById(f.valId).textContent = f.min;
        document.getElementById(f.barId).style.width = '0%';
      }
    });
    updateProgress();
  });

  /* ── Try Again ── */
  document.getElementById('scTryAgainBtn').addEventListener('click', () => {
    const rs = document.getElementById('scResultsSection');
    rs.classList.remove('show');
    const fs = document.getElementById('scFormSection');
    fs.style.display = '';
    fs.scrollIntoView({ behavior: 'smooth' });
  });

});
