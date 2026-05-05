/* supply-chain.js */
document.addEventListener('DOMContentLoaded', () => {

  const API = 'http://127.0.0.1:5000/supply-chain';

  const TIERS = {
    0: { label: 'Tier 1', name: 'Premium High-Performers', color: '#4caf50', badge: 'T1' },
    1: { label: 'Tier 2', name: 'Overstock / Slow-Moving',  color: '#ff9800', badge: 'T2' },
    2: { label: 'Tier 3', name: 'Fast-Moving Essentials',   color: '#2196f3', badge: 'T3' },
  };

  /* ─── Stepper buttons ─── */
  document.querySelectorAll('.sc-step-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.dataset.target;
      const step     = parseFloat(btn.dataset.step);
      const input    = document.getElementById(targetId);
      if (!input) return;

      let val = parseFloat(input.value) || 0;
      val = Math.round((val + step) * 1000) / 1000;

      const min = parseFloat(input.min ?? -Infinity);
      const max = parseFloat(input.max ?? Infinity);
      val = Math.max(min, Math.min(max, val));

      input.value = val;
      input.dispatchEvent(new Event('input'));
    });
  });

  /* ─── Live value chips + progress ─── */
  const fieldConfig = [
    { id: 'price_per_kg',      chipId: 'val-price', fmt: v => 'Rs ' + v.toFixed(0)                   },
    { id: 'sell_through_rate', chipId: 'val-sell',  fmt: v => (v * 100).toFixed(0) + '%'              },
    { id: 'inventory_ratio',   chipId: 'val-inv',   fmt: v => v.toFixed(2) + 'x'                      },
    { id: 'revenue',           chipId: 'val-rev',   fmt: v => 'Rs ' + v.toLocaleString('en-IN')       },
  ];

  function updateProgress() {
    const filled = fieldConfig.filter(f => {
      const el = document.getElementById(f.id);
      return el && el.value.trim() !== '' && !isNaN(parseFloat(el.value));
    }).length;
    const pct = Math.round(filled / fieldConfig.length * 100);
    document.getElementById('progressFill').style.width = pct + '%';
    document.getElementById('progressLabel').textContent =
      `${filled} of ${fieldConfig.length} fields filled`;
  }

  fieldConfig.forEach(({ id, chipId, fmt }) => {
    const input = document.getElementById(id);
    const chip  = document.getElementById(chipId);
    if (!input || !chip) return;
    input.addEventListener('input', () => {
      const v = parseFloat(input.value);
      chip.textContent = isNaN(v) ? '—' : fmt(v);
      chip.classList.toggle('chip-filled', !isNaN(v));
      clearError(input.id);
      updateProgress();
    });
  });

  updateProgress();

  /* ─── Validation ─── */
  function getGroupId(fieldId) {
    return { price_per_kg: 'group-price', sell_through_rate: 'group-sell',
             inventory_ratio: 'group-inv', revenue: 'group-rev' }[fieldId];
  }
  function clearError(fieldId) {
    document.getElementById(getGroupId(fieldId))?.classList.remove('has-error');
  }
  function showError(fieldId) {
    document.getElementById(getGroupId(fieldId))?.classList.add('has-error');
  }

  function validate() {
    let ok = true;
    const price = parseFloat(document.getElementById('price_per_kg').value);
    if (isNaN(price) || price < 1 || price > 500)  { showError('price_per_kg');      ok = false; }

    const sell  = parseFloat(document.getElementById('sell_through_rate').value);
    if (!isNaN(sell) && (sell < 0 || sell > 1))    { showError('sell_through_rate'); ok = false; }

    const inv   = parseFloat(document.getElementById('inventory_ratio').value);
    if (!isNaN(inv) && inv < 0)                    { showError('inventory_ratio');   ok = false; }

    const rev   = parseFloat(document.getElementById('revenue').value);
    if (isNaN(rev) || rev < 1000)                  { showError('revenue');           ok = false; }
    return ok;
  }

  /* ─── Toast ─── */
  const toastEl = document.getElementById('scToast');
  function showToast(msg) {
    document.getElementById('scToastMsg').textContent = msg;
    toastEl.classList.add('show');
    setTimeout(() => toastEl.classList.remove('show'), 4500);
  }

  /* ─── Loading ─── */
  const overlay   = document.getElementById('scLoadingOverlay');
  const submitBtn = document.getElementById('scSubmitBtn');
  function setLoading(on) {
    overlay.classList.toggle('show', on);
    submitBtn.disabled = on;
    submitBtn.classList.toggle('loading', on);
  }

  /* ─── Animated counter ─── */
  function animateCounter(el, target, decimals = 0, prefix = '', suffix = '') {
    const duration = 900;
    const start    = performance.now();
    const from     = 0;
    function tick(now) {
      const progress = Math.min((now - start) / duration, 1);
      const ease     = 1 - Math.pow(1 - progress, 3);
      const val      = from + (target - from) * ease;
      el.textContent = prefix + val.toFixed(decimals) + suffix;
      if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  /* ─── Render Results ─── */
  function renderResults(data) {
    const p     = data.profile;
    const tier  = TIERS[data.cluster];
    const color = tier.color;
    const rs    = document.getElementById('scResultsSection');

    // Apply accent color globally to results section
    rs.style.setProperty('--sc-color', color);

    /* Banner */
    const badge = document.getElementById('scTierBadge');
    badge.textContent  = tier.badge;
    badge.style.background    = color + '18';
    badge.style.color         = color;
    badge.style.borderColor   = color + '50';

    document.getElementById('scProfileLabel').textContent = p.label;
    document.getElementById('scProfileLabel').style.color = color;
    document.getElementById('scProfileName').textContent  = p.name;
    document.getElementById('scProfileDesc').textContent  = p.desc;

    const banner = document.getElementById('scProfileBanner');
    banner.style.setProperty('--sc-color', color);
    banner.style.borderColor = color + '35';

    /* Alert (Tier 2 only) */
    const alertEl = document.getElementById('scAlert');
    if (p.warning) {
      document.getElementById('scAlertText').textContent = p.warning;
      alertEl.style.display = 'flex';
      alertEl.querySelector('.sc-alert-bar').style.background = color;
    } else {
      alertEl.style.display = 'none';
    }

    /* Score bars */
    const scoreBarsEl = document.getElementById('scScoreBars');
    const scores      = data.scores;
    const maxScore    = Math.max(...Object.values(scores));
    scoreBarsEl.innerHTML = Object.entries(scores).map(([k, v]) => {
      const t       = TIERS[k];
      const pct     = maxScore > 0 ? (v / maxScore * 100) : 0;
      const isWin   = parseInt(k) === data.cluster;
      return `
        <div class="sc-score-row">
          <div class="sc-score-meta">
            <span class="sc-score-tier-badge" style="background:${t.color}18;color:${t.color};border-color:${t.color}40;">${t.badge}</span>
            <span class="sc-score-name">${t.name}</span>
            ${isWin ? `<span class="sc-winner-chip" style="background:${t.color}18;color:${t.color};border-color:${t.color}40;">Selected</span>` : ''}
          </div>
          <div class="sc-score-bar-wrap">
            <div class="sc-score-bar" style="background:${t.color};width:0%;"
                 data-target="${pct.toFixed(1)}"></div>
          </div>
          <span class="sc-score-num">${v.toFixed(3)}</span>
        </div>`;
    }).join('');

    /* Animate score bars after a tick */
    setTimeout(() => {
      scoreBarsEl.querySelectorAll('.sc-score-bar').forEach(bar => {
        bar.style.width = bar.dataset.target + '%';
      });
    }, 120);

    /* KPI Cards */
    const kpis = [
      { label: 'Strategy',      value: p.strategy      },
      { label: 'Margin Range',  value: p.margin        },
      { label: 'Inventory',     value: p.inventory     },
      { label: 'Sell-Through',  value: p.sell_through  },
    ];
    const kpiRow = document.getElementById('scKpiRow');
    kpiRow.innerHTML = kpis.map((k, i) => `
      <div class="sc-kpi" style="--kpi-delay:${i * 80}ms; --kpi-accent:${color};">
        <div class="sc-kpi-label">${k.label}</div>
        <div class="sc-kpi-value">${k.value}</div>
      </div>`).join('');

    /* Channels */
    document.getElementById('scChannels').innerHTML = p.channels.map(c => `
      <div class="sc-channel" style="--ch-color:${color};">
        <span class="sc-ch-dot" style="background:${color};"></span>
        ${c}
      </div>`).join('');

    /* Tips */
    document.getElementById('scTips').innerHTML = p.tips.map((t, i) => `
      <div class="sc-tip" style="--tip-delay:${i * 60}ms;">
        <span class="sc-tip-idx" style="color:${color};border-color:${color}30;">${i + 1}</span>
        <span>${t}</span>
      </div>`).join('');

    /* Input Summary */
    const inp = data.inputs;
    document.getElementById('scInputsSummary').innerHTML = `
      <div class="sc-summary-grid">
        <div class="sc-summary-item" style="--si-color:${color};">
          <div class="sc-summary-label">Price per kg</div>
          <div class="sc-summary-value">Rs ${inp.price_per_kg.toFixed(0)}</div>
        </div>
        <div class="sc-summary-item" style="--si-color:${color};">
          <div class="sc-summary-label">Sell-Through Rate</div>
          <div class="sc-summary-value">${(inp.sell_through_rate * 100).toFixed(0)}%</div>
        </div>
        <div class="sc-summary-item" style="--si-color:${color};">
          <div class="sc-summary-label">Inventory Ratio</div>
          <div class="sc-summary-value">${inp.inventory_ratio.toFixed(2)}x</div>
        </div>
        <div class="sc-summary-item" style="--si-color:${color};">
          <div class="sc-summary-label">Revenue</div>
          <div class="sc-summary-value">Rs ${inp.revenue.toLocaleString('en-IN')}</div>
        </div>
      </div>`;

    /* Show results */
    document.getElementById('scFormSection').style.display = 'none';
    rs.classList.add('show');
    setTimeout(() => rs.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80);
  }

  /* ─── Form Submit ─── */
  document.getElementById('scForm').addEventListener('submit', async e => {
    e.preventDefault();
    if (!validate()) return;

    const payload = {
      price_per_kg:       parseFloat(document.getElementById('price_per_kg').value) || 0,
      sell_through_rate:  parseFloat(document.getElementById('sell_through_rate').value) || 0,
      inventory_ratio:    parseFloat(document.getElementById('inventory_ratio').value) || 0,
      revenue:            parseFloat(document.getElementById('revenue').value) || 0,
    };

    setLoading(true);
    try {
      const res  = await fetch(API, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(payload),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Prediction failed');
      renderResults(data);
    } catch (err) {
      if (location.protocol === 'file:')
        showToast('Open via http://localhost:8080, not as a file');
      else if (err.message.toLowerCase().includes('fetch') || err.message.toLowerCase().includes('failed'))
        showToast('Backend offline — run: python app.py');
      else
        showToast(err.message);
    } finally {
      setLoading(false);
    }
  });

  /* ─── Reset ─── */
  document.getElementById('scResetBtn').addEventListener('click', () => {
    ['price_per_kg', 'sell_through_rate', 'inventory_ratio', 'revenue'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = '';
    });
    ['val-price', 'val-sell', 'val-inv', 'val-rev'].forEach(id => {
      const chip = document.getElementById(id);
      if (chip) { chip.textContent = '—'; chip.classList.remove('chip-filled'); }
    });
    ['group-price', 'group-sell', 'group-inv', 'group-rev']
      .forEach(id => document.getElementById(id)?.classList.remove('has-error'));
    updateProgress();
  });

  /* ─── Try Again ─── */
  document.getElementById('scTryAgainBtn').addEventListener('click', () => {
    const rs = document.getElementById('scResultsSection');
    rs.classList.remove('show');
    const fs = document.getElementById('scFormSection');
    fs.style.display = '';
    setTimeout(() => fs.scrollIntoView({ behavior: 'smooth' }), 60);
  });

});
