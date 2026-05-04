/* recommend.js – Interactive AI Crop Recommendation */
document.addEventListener('DOMContentLoaded', () => {

  const API = 'http://127.0.0.1:5000/predict';

  const SLIDERS = [
    { id: 'n',    valId: 'valN' },
    { id: 'p',    valId: 'valP' },
    { id: 'k',    valId: 'valK' },
    { id: 'temp', valId: 'valT' },
    { id: 'hum',  valId: 'valH' },
    { id: 'ph',   valId: 'valPH' },
    { id: 'rain', valId: 'valR' }
  ];

  const CROP_ICONS = {
    rice:'🌾', maize:'🌽', chickpea:'🫘', kidneybeans:'🫘', pigeonpeas:'🌿',
    mothbeans:'🌱', mungbean:'🟢', blackgram:'⚫', lentil:'🟤', pomegranate:'🍎',
    banana:'🍌', mango:'🥭', grapes:'🍇', watermelon:'🍉', muskmelon:'🍈',
    apple:'🍎', orange:'🍊', papaya:'🧡', coconut:'🥥', cotton:'🌸',
    jute:'🌿', coffee:'☕'
  };

  /* ── Range value display ── */
  SLIDERS.forEach(({ id, valId }) => {
    const slider = document.getElementById(id);
    const display = document.getElementById(valId);
    if (slider && display) {
      slider.addEventListener('input', () => {
        display.textContent = slider.value;
      });
      // Set initial
      display.textContent = slider.value;
    }
  });

  /* ── Form Submit ── */
  const cropForm = document.getElementById('cropForm');
  const loadingOverlay = document.getElementById('loadingOverlay');
  const resultsSection = document.getElementById('resultsSection');
  const resultsContent = document.getElementById('resultsContent');

  cropForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Gather values
    const payload = {
      N: parseFloat(document.getElementById('n').value),
      P: parseFloat(document.getElementById('p').value),
      K: parseFloat(document.getElementById('k').value),
      temperature: parseFloat(document.getElementById('temp').value),
      humidity: parseFloat(document.getElementById('hum').value),
      ph: parseFloat(document.getElementById('ph').value),
      rainfall: parseFloat(document.getElementById('rain').value)
    };

    loadingOverlay.classList.add('show');

    try {
      const response = await fetch(API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await response.json();

      if (data.success) {
        renderResults(data);
      } else {
        alert("Error: " + (data.error || "Unknown prediction error"));
      }
    } catch (err) {
      console.error(err);
      alert("Backend connection failed. Is Flask running on port 5000?");
    } finally {
      loadingOverlay.classList.remove('show');
    }
  });

  function renderResults(data) {
    resultsSection.style.display = 'block';
    
    let recsHtml = '';
    data.recommendations.forEach(crop => {
      const isPrimary = crop.name === data.primary;
      const icon = CROP_ICONS[crop.name.toLowerCase()] || '🌱';
      recsHtml += `
        <div class="card glass ${isPrimary ? 'primary-card' : ''}" style="margin-bottom: 20px;">
          <div style="display: flex; gap: 20px; align-items: center;">
            <div style="font-size: 40px;">${icon}</div>
            <div>
              <h3 style="margin-bottom: 4px;">${crop.name} ${isPrimary ? '(Top Choice)' : ''}</h3>
              <p style="margin-bottom: 0;">Water: ${crop.water} | Period: ${crop.period}</p>
            </div>
          </div>
        </div>
      `;
    });

    resultsContent.innerHTML = `
      <div class="card glass" style="border-color: var(--primary); margin-bottom: 40px; text-align: center;">
        <span class="tag-pill">Recommendation Results</span>
        <h2 class="gradient-text" style="font-size: 42px; margin-bottom: 10px;">${data.primary}</h2>
        <p>This crop has the highest compatibility with your field parameters (Cluster ${data.cluster}).</p>
      </div>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
        ${recsHtml}
      </div>
    `;

    resultsSection.scrollIntoView({ behavior: 'smooth' });
  }

  /* ── Interactive Card Tilt ── */
  document.addEventListener('mousemove', e => {
    const cards = document.querySelectorAll('.card');
    cards.forEach(card => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      if (x > 0 && x < rect.width && y > 0 && y < rect.height) {
        const xRotate = ((y - rect.height / 2) / rect.height) * 10;
        const yRotate = ((x - rect.width / 2) / rect.width) * -10;
        card.style.transform = `perspective(1000px) rotateX(${xRotate}deg) rotateY(${yRotate}deg) translateY(-8px)`;
      } else {
        card.style.transform = '';
      }
    });
  });

});
