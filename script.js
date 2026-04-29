document.addEventListener('DOMContentLoaded', () => {

  /* ── Hamburger menu ── */
  const hamburger = document.getElementById('hamburger');
  const navDrawer = document.getElementById('navDrawer');

  hamburger?.addEventListener('click', () => {
    const open = navDrawer.classList.toggle('open');
    const s = hamburger.querySelectorAll('span');
    if (open) {
      s[0].style.transform = 'translateY(7px) rotate(45deg)';
      s[1].style.opacity = '0';
      s[2].style.transform = 'translateY(-7px) rotate(-45deg)';
    } else {
      s.forEach(el => { el.style.transform = ''; el.style.opacity = ''; });
    }
  });

  navDrawer?.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => {
      navDrawer.classList.remove('open');
      hamburger.querySelectorAll('span').forEach(el => { el.style.transform = ''; el.style.opacity = ''; });
    });
  });

  /* ── Navbar shrink on scroll ── */
  const navbar = document.getElementById('navbar');
  window.addEventListener('scroll', () => {
    navbar.style.top = window.scrollY > 60 ? '8px' : '18px';
  }, { passive: true });

  /* ── Active nav link highlight ── */
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-link');

  const navObserver = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        navLinks.forEach(l => l.classList.remove('active'));
        const active = document.querySelector(`.nav-link[href="#${e.target.id}"]`);
        if (active) active.classList.add('active');
      }
    });
  }, { threshold: 0.4 });

  sections.forEach(s => navObserver.observe(s));

  /* ── Scroll reveal ── */
  document.querySelectorAll('[data-reveal]').forEach(el => {
    new IntersectionObserver(([entry], obs) => {
      if (entry.isIntersecting) {
        el.classList.add('visible');
        obs.disconnect();
      }
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }).observe(el);
  });

  /* ── Hero parallax ── */
  const heroImg = document.querySelector('.hero-img');
  window.addEventListener('scroll', () => {
    if (heroImg && window.scrollY < window.innerHeight) {
      heroImg.style.transform = `scale(1) translateY(${window.scrollY * 0.18}px)`;
    }
  }, { passive: true });

  /* ── Gallery tilt on hover ── */
  document.querySelectorAll('.g-item').forEach(item => {
    item.addEventListener('mousemove', e => {
      const r = item.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      item.style.transform = `perspective(700px) rotateX(${-y * 5}deg) rotateY(${x * 5}deg) scale(1.02)`;
    });
    item.addEventListener('mouseleave', () => { item.style.transform = ''; });
  });

});
