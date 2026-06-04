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

  /* -----------------------------------------------------------------------
     DONACIONES — Stripe Embedded Checkout
  ----------------------------------------------------------------------- */
  var stripeBtn           = document.getElementById('don-stripe-btn');
  var stripeCloseBtn      = document.getElementById('don-stripe-close');
  var checkoutContainer   = document.getElementById('stripe-checkout-container');
  var checkoutEl          = document.getElementById('stripe-checkout');
  var activeCheckout      = null; // stripe.initEmbeddedCheckout() instance

  /* Obtiene el importe seleccionado (en euros, número) o null si no es válido */
  function getSelectedAmount() {
    var activeBtn = document.querySelector('.don__amt--active');
    if (!activeBtn) return null;

    var dataAmount = activeBtn.getAttribute('data-amount');
    if (dataAmount === 'custom') {
      var val = customInp ? parseFloat(customInp.value) : NaN;
      return (!isNaN(val) && val >= 1) ? val : null;
    }
    var parsed = parseFloat(dataAmount);
    return (!isNaN(parsed) && parsed >= 1) ? parsed : null;
  }

  /* Destruye el checkout montado y oculta el contenedor */
  function destroyCheckout() {
    if (activeCheckout) {
      activeCheckout.destroy();
      activeCheckout = null;
    }
    if (checkoutEl) {
      checkoutEl.innerHTML = '';
    }
    if (checkoutContainer) {
      checkoutContainer.hidden = true;
    }
  }

  /* Muestra un mensaje de error dentro del contenedor de checkout */
  function showCheckoutError(msg) {
    if (checkoutContainer && checkoutEl) {
      checkoutEl.innerHTML =
        '<p class="don__stripe-checkout-error">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" ' +
              'width="18" height="18" aria-hidden="true">' +
            '<circle cx="12" cy="12" r="10"/>' +
            '<path d="M12 8v4m0 4h.01"/>' +
          '</svg>' +
          msg +
        '</p>';
      checkoutContainer.hidden = false;
    }
  }

  if (stripeBtn) {
    stripeBtn.addEventListener('click', function () {
      var amount = getSelectedAmount();

      /* Importe no válido → agitar el botón visualmente */
      if (!amount) {
        stripeBtn.classList.add('don__stripe-btn--shake');
        setTimeout(function () {
          stripeBtn.classList.remove('don__stripe-btn--shake');
        }, 600);
        return;
      }

      /* Si ya hay un checkout abierto → hacer scroll hasta él */
      if (checkoutContainer && !checkoutContainer.hidden && activeCheckout) {
        checkoutContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
      }

      /* Evitar doble clic */
      if (stripeBtn.disabled) return;

      var originalHTML = stripeBtn.innerHTML;
      stripeBtn.disabled = true;
      stripeBtn.innerHTML =
        '<svg class="don__stripe-spinner" viewBox="0 0 24 24" fill="none" ' +
            'stroke="currentColor" stroke-width="2" width="20" height="20" aria-hidden="true">' +
          '<circle cx="12" cy="12" r="10" stroke-opacity="0.25"/>' +
          '<path d="M12 2a10 10 0 0 1 10 10" stroke-linecap="round"/>' +
        '</svg>' +
        ' Iniciando pago\u2026';

      /* 1. Pedir client_secret al backend */
      fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: amount })
      })
        .then(function (res) {
          if (!res.ok) {
            return res.json().then(function (body) {
              throw new Error(body.error || 'Error del servidor (' + res.status + ')');
            });
          }
          return res.json();
        })
        .then(function (data) {
          if (!data.clientSecret) {
            throw new Error('No se recibió el client_secret de Stripe.');
          }

          var pk = window.STRIPE_PK;
          if (!pk || pk.indexOf('REEMPLAZA') !== -1) {
            throw new Error(
              'La clave publicable de Stripe no está configurada. ' +
              'Actualiza window.STRIPE_PK en index.html.'
            );
          }

          /* 2. Inicializar Embedded Checkout */
          // eslint-disable-next-line no-undef
          var stripeObj = Stripe(pk);
          return stripeObj.initEmbeddedCheckout({ clientSecret: data.clientSecret });
        })
        .then(function (checkout) {
          activeCheckout = checkout;

          /* 3. Montar en el DOM */
          if (checkoutEl) {
            checkoutEl.innerHTML = '';
            checkout.mount('#stripe-checkout');
          }

          /* 4. Mostrar y hacer scroll */
          if (checkoutContainer) {
            checkoutContainer.hidden = false;
            setTimeout(function () {
              checkoutContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 80);
          }
        })
        .catch(function (err) {
          console.error('[Stripe Embedded Checkout]', err.message || err);
          showCheckoutError(
            'No se pudo iniciar el pago. Por favor, inténtalo de nuevo.'
          );
        })
        .then(function () {
          /* finally — se ejecuta tanto en éxito como en error */
          stripeBtn.disabled = false;
          stripeBtn.innerHTML = originalHTML;
        });
    });
  }

  /* Botón "Cerrar" del checkout */
  if (stripeCloseBtn) {
    stripeCloseBtn.addEventListener('click', function () {
      destroyCheckout();
    });
  }

})();
