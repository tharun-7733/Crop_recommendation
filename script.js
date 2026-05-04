/* script.js – Global Interactions */
document.addEventListener('DOMContentLoaded', () => {

  /* ── Cursor Glow ── */
  const cursor = document.getElementById('cursorGlow');
  if (cursor) {
    document.addEventListener('mousemove', e => {
      cursor.style.left = e.clientX + 'px';
      cursor.style.top  = e.clientY + 'px';
    });
  }

  /* ── Scroll Reveal ── */
  const obs = new IntersectionObserver(entries => {
    entries.forEach(en => { if (en.isIntersecting) en.target.classList.add('visible'); });
  }, { threshold: 0.08 });
  document.querySelectorAll('[data-reveal]').forEach(el => obs.observe(el));

  /* ── Navbar Scroll ── */
  const navbar    = document.getElementById('navbar');
  const navInner  = document.getElementById('navInner');
  function onScroll() {
    if (!navbar) return;
    navbar.classList.toggle('scrolled', window.scrollY > 50);
    if (navInner) {
      navInner.style.padding = window.scrollY > 50 ? '8px 18px' : '10px 20px';
    }
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ── Active Nav Link on Scroll ── */
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-link');
  const sectionObs = new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (en.isIntersecting) {
        navLinks.forEach(l => l.classList.remove('active'));
        const match = document.querySelector(`.nav-link[href="#${en.target.id}"]`);
        if (match) match.classList.add('active');
      }
    });
  }, { threshold: 0.4 });
  sections.forEach(s => sectionObs.observe(s));

  /* ── Hamburger Menu ── */
  const hamburger = document.getElementById('hamburger');
  const navDrawer  = document.getElementById('navDrawer');
  if (hamburger && navDrawer) {
    hamburger.addEventListener('click', () => {
      const open = navDrawer.classList.toggle('open');
      const bars = hamburger.querySelectorAll('span');
      bars[0].style.transform = open ? 'translateY(7px) rotate(45deg)' : '';
      bars[1].style.opacity   = open ? '0' : '1';
      bars[2].style.transform = open ? 'translateY(-7px) rotate(-45deg)' : '';
    });
    navDrawer.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => {
        navDrawer.classList.remove('open');
        hamburger.querySelectorAll('span').forEach(s => { s.style.transform = ''; s.style.opacity = '1'; });
      });
    });
  }

  /* ── Hero Image Parallax ── */
  const heroImg = document.getElementById('heroImg');
  window.addEventListener('scroll', () => {
    if (heroImg && window.scrollY < window.innerHeight) {
      heroImg.style.transform = `scale(1.08) translateY(${window.scrollY * 0.12}px)`;
    }
  }, { passive: true });

  /* ── Card 3D Tilt ── */
  document.querySelectorAll('.b-card, .step').forEach(card => {
    card.addEventListener('mousemove', e => {
      const r  = card.getBoundingClientRect();
      const xPct = ((e.clientX - r.left) / r.width - 0.5);
      const yPct = ((e.clientY - r.top)  / r.height - 0.5);
      card.style.transform = `perspective(800px) rotateX(${-yPct * 8}deg) rotateY(${xPct * 8}deg) translateY(-8px)`;
    });
    card.addEventListener('mouseleave', () => { card.style.transform = ''; });
  });

  /* ── Number Count-Up ── */
  document.querySelectorAll('.stat-num').forEach(el => {
    const raw = el.textContent.replace(/[^0-9]/g, '');
    const target = parseInt(raw, 10);
    if (!target) return;
    const suffix = el.querySelector('span')?.textContent || '';
    let start = null;
    const duration = 1400;
    const count = ts => {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 4);
      el.innerHTML = Math.floor(eased * target) + (suffix ? `<span>${suffix}</span>` : '');
      if (progress < 1) requestAnimationFrame(count);
    };
    const counterObs = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) {
        requestAnimationFrame(count);
        counterObs.disconnect();
      }
    }, { threshold: 0.5 });
    counterObs.observe(el);
  });

});
