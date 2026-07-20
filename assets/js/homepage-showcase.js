/**
 * Reactive Resume–style homepage interactions (vanilla JS).
 * Spotlight drift, comet-card tilt, text mask, scroll reveals, theme marquee pause.
 */
(function () {
  'use strict';

  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function initSpotlight() {
    var root = document.getElementById('showcase-spotlight');
    if (!root || reducedMotion) return;

    var left = root.querySelector('.showcase-spotlight-left');
    var right = root.querySelector('.showcase-spotlight-right');
    if (!left || !right) return;

    var offset = 0;
    var direction = 1;

    function tick() {
      offset += direction * 0.15;
      if (offset > 100) direction = -1;
      if (offset < -100) direction = 1;
      left.style.transform = 'translateX(' + offset + 'px)';
      right.style.transform = 'translateX(' + (-offset) + 'px)';
      requestAnimationFrame(tick);
    }

    requestAnimationFrame(tick);
  }

  function initCometCard() {
    var card = document.getElementById('showcase-comet-card');
    var glare = document.getElementById('showcase-comet-glare');
    if (!card || reducedMotion) return;

    var rotateX = 0;
    var rotateY = 0;
    var targetRotateX = 0;
    var targetRotateY = 0;
    var glareX = 50;
    var glareY = 50;
    var targetGlareX = 50;
    var targetGlareY = 50;

    function onMove(event) {
      var rect = card.getBoundingClientRect();
      var xPct = (event.clientX - rect.left) / rect.width - 0.5;
      var yPct = (event.clientY - rect.top) / rect.height - 0.5;
      targetRotateY = xPct * 14;
      targetRotateX = -yPct * 14;
      targetGlareX = ((event.clientX - rect.left) / rect.width) * 100;
      targetGlareY = ((event.clientY - rect.top) / rect.height) * 100;
    }

    function onLeave() {
      targetRotateX = 0;
      targetRotateY = 0;
      targetGlareX = 50;
      targetGlareY = 50;
    }

    function animate() {
      rotateX += (targetRotateX - rotateX) * 0.12;
      rotateY += (targetRotateY - rotateY) * 0.12;
      glareX += (targetGlareX - glareX) * 0.15;
      glareY += (targetGlareY - glareY) * 0.15;
      card.style.transform =
        'perspective(900px) rotateX(' + rotateX + 'deg) rotateY(' + rotateY + 'deg) scale3d(1.02,1.02,1.02)';
      if (glare) {
        glare.style.background =
          'radial-gradient(circle at ' +
          glareX +
          '% ' +
          glareY +
          '%, color-mix(in srgb, var(--turbo-text-primary) 35%, transparent) 0%, transparent 65%)';
      }
      requestAnimationFrame(animate);
    }

    card.addEventListener('mousemove', onMove);
    card.addEventListener('mouseleave', onLeave);
    animate();
  }

  function initTextMask() {
    var wrap = document.getElementById('showcase-text-mask');
    if (!wrap || reducedMotion) return;

    wrap.addEventListener('mousemove', function (event) {
      var rect = wrap.getBoundingClientRect();
      var mx = ((event.clientX - rect.left) / rect.width) * 100;
      var my = ((event.clientY - rect.top) / rect.height) * 100;
      wrap.style.setProperty('--mx', mx + '%');
      wrap.style.setProperty('--my', my + '%');
      wrap.classList.add('is-hovering');
    });

    wrap.addEventListener('mouseleave', function () {
      wrap.classList.remove('is-hovering');
      wrap.style.setProperty('--mx', '50%');
      wrap.style.setProperty('--my', '50%');
    });
  }

  function initScrollReveal() {
    if (!('IntersectionObserver' in window)) return;
    var items = document.querySelectorAll('[data-showcase-reveal]');
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -40px 0px' },
    );
    items.forEach(function (el) {
      if (reducedMotion) {
        el.classList.add('is-visible');
      } else {
        observer.observe(el);
      }
    });
  }

  function initMarqueePause() {
    document.querySelectorAll('.showcase-marquee-row').forEach(function (row) {
      row.addEventListener('mouseenter', function () {
        row.style.animationPlayState = 'paused';
      });
      row.addEventListener('mouseleave', function () {
        row.style.animationPlayState = 'running';
      });
    });
  }

  function initPreviewCard() {
    var tabs = document.querySelectorAll('.showcase-preview-tab');
    var panels = document.querySelectorAll('.showcase-preview-panel');
    var toast = document.getElementById('showcase-preview-toast');
    var toastTimer;
    var progressTarget = 92;
    var progressFill = document.getElementById('showcase-progress-fill');
    var progressValue = document.getElementById('showcase-progress-value');
    var progressBar = document.getElementById('showcase-progress-bar');

    function showToast(message) {
      if (!toast) return;
      toast.textContent = message;
      toast.hidden = false;
      clearTimeout(toastTimer);
      toastTimer = setTimeout(function () {
        toast.hidden = true;
      }, 1600);
    }

    function animateProgress() {
      if (!progressFill || !progressValue) return;
      progressFill.style.width = '0%';
      progressValue.textContent = '0%';
      if (progressBar) progressBar.setAttribute('aria-valuenow', '0');
      if (reducedMotion) {
        progressFill.style.width = progressTarget + '%';
        progressValue.textContent = progressTarget + '%';
        if (progressBar) progressBar.setAttribute('aria-valuenow', String(progressTarget));
        return;
      }
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          progressFill.style.width = progressTarget + '%';
          progressValue.textContent = progressTarget + '%';
          if (progressBar) progressBar.setAttribute('aria-valuenow', String(progressTarget));
        });
      });
    }

    tabs.forEach(function (tab) {
      tab.addEventListener('click', function () {
        var target = tab.getAttribute('data-preview-tab');
        if (!target) return;

        tabs.forEach(function (t) {
          var isActive = t === tab;
          t.classList.toggle('active', isActive);
          t.setAttribute('aria-selected', isActive ? 'true' : 'false');
        });

        panels.forEach(function (panel) {
          var isActive = panel.getAttribute('data-preview-panel') === target;
          panel.classList.toggle('is-active', isActive);
          panel.hidden = !isActive;
        });

        if (target === 'overview') animateProgress();
      });
    });

    var codeBtn = document.getElementById('showcase-preview-code');
    if (codeBtn) {
      codeBtn.addEventListener('click', function () {
        var snippet =
          'background: var(--turbo-bg-surface);\ncolor: var(--turbo-text-primary);';
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(snippet).then(function () {
            showToast('Copied CSS snippet');
          });
        } else {
          showToast(snippet);
        }
      });
    }

    var primaryBtn = document.getElementById('showcase-preview-primary');
    if (primaryBtn) {
      primaryBtn.addEventListener('click', function () {
        primaryBtn.classList.add('is-pressed');
        showToast('Primary action');
        setTimeout(function () {
          primaryBtn.classList.remove('is-pressed');
        }, 300);
      });
    }

    var outlineBtn = document.getElementById('showcase-preview-outline');
    if (outlineBtn) {
      outlineBtn.addEventListener('click', function () {
        outlineBtn.classList.toggle('is-active');
        showToast(outlineBtn.classList.contains('is-active') ? 'Outline active' : 'Outline default');
      });
    }

    document.addEventListener('showcase-theme-change', function (event) {
      var theme = event.detail && event.detail.theme;
      var meta = window.__showcaseMeta;
      if (!theme || !meta) return;

      var nameEl = document.getElementById('showcase-preview-theme-name');
      var iconEl = document.getElementById('showcase-preview-theme-icon');
      if (nameEl) nameEl.textContent = meta.themeFullNames[theme] || meta.themeNames[theme] || theme;
      if (iconEl) {
        iconEl.src = meta.baseUrl + '/assets/img/' + (meta.themeIcons[theme] || 'catppuccin-logo-macchiato.png');
      }

      var overviewPanel = document.querySelector('[data-preview-panel="overview"]');
      if (overviewPanel && overviewPanel.classList.contains('is-active')) {
        animateProgress();
      }
    });

    var currentTheme = document.documentElement.getAttribute('data-theme') || 'catppuccin-mocha';
    document.dispatchEvent(new CustomEvent('showcase-theme-change', { detail: { theme: currentTheme } }));
    animateProgress();
  }

  initSpotlight();
  initCometCard();
  initTextMask();
  initScrollReveal();
  initMarqueePause();
  initPreviewCard();
})();
