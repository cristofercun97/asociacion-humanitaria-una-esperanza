/* ==========================================================================
   Fundación Humanitaria Una Esperanza — main.js
   ========================================================================== */

(function () {
  'use strict';

  /* -----------------------------------------------------------------------
     Elements
  ----------------------------------------------------------------------- */
  var header    = document.getElementById('header');
  var hamburger = document.getElementById('hamburger');
  var nav       = document.getElementById('nav');
  var navLinks  = document.querySelectorAll('.nav__link');
  var footerYear = document.getElementById('footer-year');
  var sections  = document.querySelectorAll('main section[id]');

  /* -----------------------------------------------------------------------
     Set current year in footer
  ----------------------------------------------------------------------- */
  if (footerYear) {
    footerYear.textContent = new Date().getFullYear();
  }

  /* -----------------------------------------------------------------------
     Header shadow on scroll
  ----------------------------------------------------------------------- */
  function handleScroll() {
    if (window.scrollY > 10) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
    setActiveLink();
  }

  window.addEventListener('scroll', handleScroll, { passive: true });
  handleScroll(); // run once on load

  /* -----------------------------------------------------------------------
     Mobile menu — open / close
  ----------------------------------------------------------------------- */
  function toggleMenu(forceOpen) {
    var isOpen = typeof forceOpen === 'boolean'
      ? forceOpen
      : !nav.classList.contains('open');

    nav.classList.toggle('open', isOpen);
    hamburger.classList.toggle('open', isOpen);
    hamburger.setAttribute('aria-expanded', String(isOpen));

    // Prevent body scroll while menu is open
    document.body.style.overflow = isOpen ? 'hidden' : '';
  }

  hamburger.addEventListener('click', function () {
    toggleMenu();
  });

  // Close on nav link click
  navLinks.forEach(function (link) {
    link.addEventListener('click', function () {
      toggleMenu(false);
    });
  });

  // Close on outside click
  document.addEventListener('click', function (e) {
    if (
      nav.classList.contains('open') &&
      !nav.contains(e.target) &&
      !hamburger.contains(e.target)
    ) {
      toggleMenu(false);
    }
  });

  // Close on Escape
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && nav.classList.contains('open')) {
      toggleMenu(false);
    }
  });

  /* -----------------------------------------------------------------------
     Active nav link highlighting on scroll
  ----------------------------------------------------------------------- */
  function setActiveLink() {
    // Use header height dynamically
    var headerH = header ? header.offsetHeight : 72;

    sections.forEach(function (section) {
      var top    = section.offsetTop;
      var bottom = top + section.offsetHeight;
      var id     = section.getAttribute('id');
      var link   = document.querySelector('.nav__link[href="#' + id + '"]');

      if (link) {
        if (window.scrollY + headerH + 32 >= top && window.scrollY + headerH + 32 < bottom) {
          navLinks.forEach(function (l) { l.classList.remove('active'); });
          link.classList.add('active');
        }
      }
    });
  }

  /* -----------------------------------------------------------------------
     Smooth scroll — offset accounts for sticky header
  ----------------------------------------------------------------------- */
  document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
    anchor.addEventListener('click', function (e) {
      var href   = anchor.getAttribute('href');
      if (!href || href === '#') return;

      var target = document.querySelector(href);
      if (!target) return;

      e.preventDefault();

      var headerH = header ? header.offsetHeight : 72;
      var top     = target.getBoundingClientRect().top + window.scrollY - headerH - 8;

      window.scrollTo({ top: top, behavior: 'smooth' });
    });
  });

  /* -----------------------------------------------------------------------
     DONACIONES — Selección de importe
  ----------------------------------------------------------------------- */
  var amtBtns   = document.querySelectorAll('.don__amt');
  var customWrap = document.getElementById('don-custom-wrap');
  var customInp  = document.getElementById('don-custom-inp');

  amtBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      // Desactivar todos
      amtBtns.forEach(function (b) {
        b.classList.remove('don__amt--active');
        b.setAttribute('aria-pressed', 'false');
      });

      // Activar el pulsado
      btn.classList.add('don__amt--active');
      btn.setAttribute('aria-pressed', 'true');

      // Mostrar/ocultar campo personalizado
      var isCustom = btn.getAttribute('data-amount') === 'custom';
      if (customWrap) {
        customWrap.hidden = !isCustom;
        if (isCustom && customInp) {
          customInp.focus();
        }
      }
    });
  });

  /* -----------------------------------------------------------------------
     DONACIONES — Copiar IBAN + Toast
  ----------------------------------------------------------------------- */
  var copyBtn = document.getElementById('don-copy-iban');

  // Crear el toast una sola vez
  var toast = document.createElement('div');
  toast.className = 'don__toast';
  toast.setAttribute('role', 'status');
  toast.setAttribute('aria-live', 'polite');
  toast.innerHTML =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true">' +
      '<polyline points="20 6 9 17 4 12"/>' +
    '</svg>' +
    '<span>IBAN copiado correctamente</span>';
  document.body.appendChild(toast);

  var toastTimer = null;

  function showToast() {
    toast.classList.add('don__toast--show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      toast.classList.remove('don__toast--show');
    }, 2800);
  }

  if (copyBtn) {
    copyBtn.addEventListener('click', function () {
      var ibanRaw = 'ES3400730100550506342514';

      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(ibanRaw).then(showToast).catch(function () {
          fallbackCopy(ibanRaw);
        });
      } else {
        fallbackCopy(ibanRaw);
      }
    });
  }

  function fallbackCopy(text) {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.style.cssText = 'position:fixed;top:-9999px;left:-9999px;opacity:0';
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    try {
      document.execCommand('copy');
      showToast();
    } catch (err) {
      // No se pudo copiar
    }
    document.body.removeChild(ta);
  }

})();
