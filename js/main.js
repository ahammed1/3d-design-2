(function () {
      // 1. Split words into animated character boxes matching the video's vertical-slice reveal
      function buildSlicedWord(el, text) {
        el.innerHTML = '';
        const chars = text.split('');
        chars.forEach((ch, idx) => {
          const box = document.createElement('span');
          box.className = 'char-box';
          const inner = document.createElement('span');
          inner.className = 'char-inner';
          inner.style.transitionDelay = (idx * 55) + 'ms';
          inner.textContent = ch;
          box.appendChild(inner);
          el.appendChild(box);
        });
      }

      const introWord = document.getElementById('intro-word');
      const heroWord = document.getElementById('hero-word');
      const conceptWord = document.getElementById('concept-word');
      const preorderWord = document.getElementById('preorder-word');
      const footerWord = document.getElementById('footer-word');

      buildSlicedWord(introWord, 'mushroom');
      buildSlicedWord(heroWord, 'mushroom');
      buildSlicedWord(conceptWord, 'concept');
      buildSlicedWord(preorderWord, 'preorder');
      buildSlicedWord(footerWord, 'mushroom');

      // 2. Run Initial Splash Intro Animation (00:01 -> 00:02 in video)
      const introLoader = document.getElementById('intro-loader');
      function playIntroSequence() {
        introLoader.classList.remove('hidden-loader');
        introWord.classList.remove('word-revealed');
        heroWord.classList.remove('word-revealed');

        requestAnimationFrame(() => {
          setTimeout(() => {
            introWord.classList.add('word-revealed');
          }, 80);

          setTimeout(() => {
            introLoader.classList.add('hidden-loader');
            heroWord.classList.add('word-revealed');
            introCompletedTime = performance.now();
          }, 1150);
        });
      }
      playIntroSequence();

      // 3. IntersectionObserver to trigger "concept", "preorder", and footer "mushroom" slice reveals on scroll
      const wordObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add('word-revealed');
            } else if (entry.boundingClientRect.top > window.innerHeight * 0.7) {
              entry.target.classList.remove('word-revealed');
            }
          });
        },
        { threshold: 0.18 }
      );
      [heroWord, conceptWord, preorderWord, footerWord].forEach((w) => wordObserver.observe(w));

      // 4. Scroll-Linked Animations:
      //    - Left double-chevron Mushroom scroll indicator position (top 36px -> bottom 36px)
      //    - Floating 3D Mushroom chargers parallax
      //    - Exploded Orange Charger 3-layer separation
      //    - Wireframe Charger + USB-C Cable diagonal plug-in animation
      const scrollBtn = document.getElementById('scroll-mushroom-btn');
      const floatingChargers = document.querySelectorAll('.floating-charger');
      const expStage = document.getElementById('exploded-stage');
      const expTop = document.getElementById('exp-layer-top');
      const expRing = document.getElementById('exp-layer-ring');
      const expBase = document.getElementById('exp-layer-base');
      const explodeSlider = document.getElementById('explode-slider');
      const plugStage = document.getElementById('wireframe-plug-stage');
      const wireChargerLower = document.getElementById('wireframe-charger-lower');
      const wireCable = document.getElementById('wireframe-cable');

      const galCol1 = document.getElementById('gal-col-1');
      const galCol2 = document.getElementById('gal-col-2');
      const galCol3 = document.getElementById('gal-col-3');

      let manualExplodeOverride = false;
      let manualExplodeTarget = 0.85;
      let currentExplodeFactor = 0.0;
      let manualPlugged = false;

      // Track mouse pointer for interactive 3D plate parallax & tilt
      let targetMouseX = 0;
      let targetMouseY = 0;
      let smoothMouseX = 0;
      let smoothMouseY = 0;
      let smoothScrollY = window.scrollY || window.pageYOffset || 0;
      let introCompletedTime = performance.now() + 1150;

      window.addEventListener('mousemove', (e) => {
        targetMouseX = (e.clientX / Math.max(1, window.innerWidth) - 0.5) * 2;
        targetMouseY = (e.clientY / Math.max(1, window.innerHeight) - 0.5) * 2;
      }, { passive: true });

      function applyExplodeFactor(factor) {
        // factor: 0 (completely closed/assembled like frame_024) to 1 (fully separated 3 plates like frame_025)
        const topY = -8 - factor * 86;
        const ringY = 0 - factor * 4;
        const baseY = 8 + factor * 78;
        const ringScale = 0.94 + factor * 0.06;
        expTop.style.transform = `translate3d(0px, ${topY.toFixed(1)}px, 0px)`;
        expRing.style.transform = `translate3d(0px, ${ringY.toFixed(1)}px, 0px) scale(${ringScale.toFixed(3)})`;
        expBase.style.transform = `translate3d(0px, ${baseY.toFixed(1)}px, 0px)`;
      }

      function applyPlugFactor(t) {
        // t: 0 (separated) to 1 (plugged into USB-C port like frame_039/040)
        const cableX = (1 - t) * 76;
        const cableY = (1 - t) * 48;
        const chargerX = (1 - t) * 38;
        wireChargerLower.style.transform = `translate3d(${chargerX.toFixed(1)}px, 0px, 0px)`;
        wireCable.style.transform = `translate3d(${cableX.toFixed(1)}px, ${cableY.toFixed(1)}px, 0px)`;
      }

      // Click on exploded stage to toggle assembled <-> exploded plates directly
      if (expStage) {
        expStage.style.cursor = 'pointer';
        expStage.title = 'Click or scroll to animate charger plates';
        expStage.addEventListener('click', () => {
          manualExplodeOverride = true;
          manualExplodeTarget = currentExplodeFactor > 0.5 ? 0.0 : 1.0;
          explodeSlider.value = Math.round(manualExplodeTarget * 100);
        });
      }

      // Continuous 60fps animation loop so plates glide smoothly on scroll, mouse movement, and idle
      function animatePlatesLoop(now) {
        const rawScrollY = window.scrollY || window.pageYOffset || 0;
        smoothScrollY += (rawScrollY - smoothScrollY) * 0.12;
        smoothMouseX += (targetMouseX - smoothMouseX) * 0.08;
        smoothMouseY += (targetMouseY - smoothMouseY) * 0.08;

        const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
        const progress = Math.min(1, Math.max(0, smoothScrollY / maxScroll));

        // 1. Move fixed left mushroom double-chevron along the viewport height
        const minTop = 36;
        const maxTop = Math.max(minTop, window.innerHeight - 64);
        const currentTop = minTop + progress * (maxTop - minTop);
        scrollBtn.style.top = currentTop.toFixed(1) + 'px';

        // Entry sweep factor right after splash screen (0 -> 1 over 1.2s)
        const entryElapsed = Math.max(0, (now - introCompletedTime) / 1200);
        const entryEase = 1 - Math.pow(1 - Math.min(1, entryElapsed), 3);

        // 2. Floating 3D Charger Plates: strong scroll parallax + mouse 3D drift + rotation
        floatingChargers.forEach((el, idx) => {
          const speed = parseFloat(el.getAttribute('data-parallax') || '-0.35');
          const baseRot = parseFloat(el.getAttribute('data-rotate') || '0');
          const sectionRect = el.parentElement.getBoundingClientRect();
          const sectionCenterOffset = (window.innerHeight * 0.55) - sectionRect.top;

          // Scroll vertical travel (amplified so each plate visibly glides past the giant text)
          const scrollDy = sectionCenterOffset * speed * 0.85;
          // Entry fly-in offset when page loads
          const entryDy = (1 - entryEase) * (90 + idx * 35);
          const entryDx = (1 - entryEase) * (45 + idx * 15);

          // Interactive mouse parallax per layer depth
          const depth = Math.abs(speed) * 2.2;
          const mouseDx = smoothMouseX * 28 * depth;
          const mouseDy = smoothMouseY * 18 * depth;

          const totalX = entryDx + mouseDx;
          const totalY = scrollDy + entryDy + mouseDy;
          const scrollRot = (sectionCenterOffset * 0.018) * (baseRot >= 0 ? 1 : -1);
          const mouseRot = smoothMouseX * 4.5 * (idx % 2 === 0 ? 1 : -1);
          const totalRot = baseRot + scrollRot + mouseRot;

          el.style.transform = `translate3d(${totalX.toFixed(1)}px, ${totalY.toFixed(1)}px, 0px) rotate(${totalRot.toFixed(2)}deg)`;
        });

        // 3. Exploded Orange Charger 3-Plate Stack (Assembled <-> Exploded on scroll + gentle breathing)
        if (expStage) {
          let targetFactor;
          if (manualExplodeOverride) {
            targetFactor = manualExplodeTarget;
          } else {
            const rect = expStage.getBoundingClientRect();
            // Start at 0 (closed/assembled) when entering bottom of viewport, reach 1 (fully exploded) near center
            const rawFactor = (window.innerHeight * 0.78 - rect.top) / (window.innerHeight * 0.42);
            const scrollFactor = Math.min(1, Math.max(0, rawFactor));
            // Add subtle continuous breathing motion so the 3 plates visibly float even when scroll stops
            const breathe = Math.sin(now * 0.0028) * 0.08;
            targetFactor = Math.min(1, Math.max(0, scrollFactor + breathe));
            explodeSlider.value = Math.round(targetFactor * 100);
          }
          currentExplodeFactor += (targetFactor - currentExplodeFactor) * 0.14;
          applyExplodeFactor(currentExplodeFactor);
        }

        // 4. 3-Column Lifestyle Gallery staggered vertical scroll parallax (frame_027 -> frame_030)
        if (galCol1 && galCol2 && galCol3 && window.innerWidth >= 768) {
          const galRect = galCol2.parentElement.getBoundingClientRect();
          const galOffset = (window.innerHeight * 0.5 - galRect.top) * 0.14;
          galCol1.style.transform = `translate3d(0px, ${(galOffset * 0.9).toFixed(1)}px, 0px)`;
          galCol2.style.transform = `translate3d(0px, ${(-galOffset * 0.5).toFixed(1)}px, 0px)`;
          galCol3.style.transform = `translate3d(0px, ${(-galOffset * 1.15).toFixed(1)}px, 0px)`;
        }

        // 5. Wireframe USB-C cable scroll-driven plug-in
        if (!manualPlugged && plugStage) {
          const rect = plugStage.getBoundingClientRect();
          const raw = (window.innerHeight * 0.85 - rect.top) / (window.innerHeight * 0.48);
          const t = Math.min(1, Math.max(0, raw));
          applyPlugFactor(t);
        }

        requestAnimationFrame(animatePlatesLoop);
      }
      requestAnimationFrame(animatePlatesLoop);

      // Resume scroll-driven plate explosion when user scrolls after manual slider/click
      window.addEventListener('scroll', () => {
        if (manualExplodeOverride) {
          manualExplodeOverride = false;
        }
      }, { passive: true });

      // Explode slider manual control
      explodeSlider.addEventListener('input', (e) => {
        manualExplodeOverride = true;
        manualExplodeTarget = parseFloat(e.target.value) / 100;
      });

      // Interactive Specs items highlight & explode animation
      const specItems = document.querySelectorAll('.spec-item');
      const specCallout = document.getElementById('spec-callout-pill');
      specItems.forEach((item) => {
        item.addEventListener('click', () => {
          specItems.forEach((s) => s.classList.remove('active-spec'));
          item.classList.add('active-spec');
          const text = item.getAttribute('data-spec');
          const targetExplode = parseFloat(item.getAttribute('data-explode') || '90') / 100;
          manualExplodeOverride = true;
          manualExplodeTarget = targetExplode;
          explodeSlider.value = Math.round(targetExplode * 100);
          specCallout.textContent = text;
          specCallout.classList.remove('opacity-0');
        });
      });

      // Toggle USB-C Cable button
      const togglePlugBtn = document.getElementById('toggle-plug-btn');
      togglePlugBtn.addEventListener('click', () => {
        manualPlugged = !manualPlugged;
        applyPlugFactor(manualPlugged ? 1 : 0);
        togglePlugBtn.textContent = manualPlugged ? 'Unplug USB-C Cable' : 'Connect USB-C Cable';
      });

      // Left mushroom scroll indicator & footer word click actions
      scrollBtn.addEventListener('click', () => {
        if (window.scrollY > 120) {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
          playIntroSequence();
        }
      });
      footerWord.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        setTimeout(playIntroSequence, 450);
      });

      // Smooth scroll navigation links
      document.querySelectorAll('.nav-scroll').forEach((link) => {
        link.addEventListener('click', (e) => {
          e.preventDefault();
          const targetId = link.getAttribute('href').slice(1);
          const targetEl = document.getElementById(targetId);
          if (targetEl) {
            targetEl.scrollIntoView({ behavior: 'smooth' });
          }
        });
      });

      // 5. Preorder & Store Configurator Modal
      const modal = document.getElementById('preorder-modal');
      const closeModalBtn = document.getElementById('close-modal-btn');
      const modalImg = document.getElementById('modal-charger-img');
      const modalColorLabel = document.getElementById('modal-color-label');
      const swatches = document.querySelectorAll('.finish-swatch');
      const qtyMinus = document.getElementById('qty-minus');
      const qtyPlus = document.getElementById('qty-plus');
      const qtyVal = document.getElementById('qty-val');
      const totalPriceEl = document.getElementById('modal-total-price');
      const preorderForm = document.getElementById('preorder-form');
      const preorderSuccess = document.getElementById('preorder-success');
      const confirmSummary = document.getElementById('confirm-summary');

      let currentQty = 1;
      let currentFinishLabel = 'Nordic Blue';

      function selectFinish(finishKey) {
        swatches.forEach((btn) => {
          if (btn.getAttribute('data-finish') === finishKey) {
            btn.classList.add('ring-2');
            modalImg.src = btn.getAttribute('data-img');
            currentFinishLabel = btn.getAttribute('data-label');
            modalColorLabel.textContent = currentFinishLabel;
          } else {
            btn.classList.remove('ring-2');
          }
        });
      }

      function openModal(defaultColor) {
        if (defaultColor) selectFinish(defaultColor);
        preorderSuccess.classList.add('hidden');
        modal.classList.remove('hidden');
        modal.classList.add('flex');
      }

      function closeModal() {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
      }

      document.querySelectorAll('.open-preorder-modal').forEach((btn) => {
        btn.addEventListener('click', () => openModal(btn.getAttribute('data-color') || 'blue'));
      });
      document.getElementById('nav-store-btn').addEventListener('click', () => openModal('blue'));
      closeModalBtn.addEventListener('click', closeModal);
      modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
      });

      swatches.forEach((btn) => {
        btn.addEventListener('click', () => selectFinish(btn.getAttribute('data-finish')));
      });

      function updateQty(newQty) {
        currentQty = Math.max(1, Math.min(10, newQty));
        qtyVal.textContent = String(currentQty);
        totalPriceEl.textContent = '$' + (currentQty * 129);
      }
      qtyMinus.addEventListener('click', () => updateQty(currentQty - 1));
      qtyPlus.addEventListener('click', () => updateQty(currentQty + 1));

      preorderForm.addEventListener('submit', (e) => {
        e.preventDefault();
        confirmSummary.textContent = `${currentQty}x Mushroom (${currentFinishLabel}) — $${currentQty * 129}`;
        preorderSuccess.classList.remove('hidden');
      });

      // Toast helper for social icons & Shakuro credit
      const toast = document.getElementById('toast-banner');
      let toastTimer = null;
      function showToast(msg) {
        toast.textContent = msg;
        toast.classList.remove('opacity-0');
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => {
          toast.classList.add('opacity-0');
        }, 2600);
      }

      document.querySelectorAll('.social-trigger').forEach((btn) => {
        btn.addEventListener('click', () => {
          const network = btn.getAttribute('data-social');
          showToast(`Mushroom official ${network} showcase (@shakuro)`);
        });
      });
      document.getElementById('credit-link').addEventListener('click', () => {
        showToast('Designed & developed by Shakuro — Webflow Showcase');
      });
    })();
