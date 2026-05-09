    (function() {
      'use strict';

      // ===== LOADER =====
      var loader = document.getElementById('loader');
      var loaderCount = document.getElementById('loader-count');
      var countVal = 0;

      function hideLoader() {
        if (loader) loader.classList.add('done');
      }
      setTimeout(hideLoader, 3200);

      var countInt = setInterval(function() {
        countVal += Math.floor(Math.random() * 5) + 3;
        if (countVal >= 100) { countVal = 100; clearInterval(countInt); }
        if (loaderCount) loaderCount.textContent = countVal.toString().padStart(3, '0');
      }, 45);

      // ===== GSAP SETUP =====
      var hasGSAP = typeof gsap !== 'undefined';
      var hasST = typeof ScrollTrigger !== 'undefined';
      var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      if (!hasGSAP || !hasST) {
        hideLoader();
        document.getElementById('nav').style.opacity = '1';
        document.getElementById('nav').style.transform = 'none';
        return;
      }

      try {
        gsap.registerPlugin(ScrollTrigger);
        gsap.defaults({ ease: 'power3.out', duration: 1.1 });

        // Lenis
        var lenis = new Lenis({ lerp: 0.08, smooth: true });
        lenis.on('scroll', ScrollTrigger.update);
        gsap.ticker.add(function(t) { lenis.raf(t * 1000); });
        gsap.ticker.lagSmoothing(0);

        // Smooth anchors
        document.querySelectorAll('a[href^="#"]').forEach(function(a) {
          a.addEventListener('click', function(e) {
            e.preventDefault();
            var target = document.querySelector(a.getAttribute('href'));
            if (target) lenis.scrollTo(target, { offset: -80 });
          });
        });

        // ===== LOADER MOUSE TRAIL =====
        var trailImages = ['images/product-01.png','images/product-02.png','images/product-03.png','images/product-04.png','images/product-05.png','images/product-06.png','images/product-07.png'];
        var lastTrail = 0;
        var loaderEl = document.getElementById('loader');
        if (loaderEl && !reducedMotion) {
          loaderEl.addEventListener('mousemove', function(e) {
            var now = Date.now();
            if (now - lastTrail < 50) return;
            lastTrail = now;

            var img = document.createElement('img');
            img.src = trailImages[Math.floor(Math.random() * trailImages.length)];
            img.className = 'loader-trail-img';
            var rot = (Math.random() * 20 - 10).toFixed(1);
            img.style.setProperty('--r', rot + 'deg');
            img.style.left = (e.clientX - 32) + 'px';
            img.style.top = (e.clientY - 32) + 'px';
            loaderEl.appendChild(img);

            setTimeout(function() {
              if (img.parentNode) img.parentNode.removeChild(img);
            }, 3500);
          });
        }

        // ===== REVEALS =====
        function initReveals() {
          gsap.to('#nav', { opacity: 1, y: 0, duration: 0.7, delay: 0.3 });
          gsap.from('.hero__eyebrow', { opacity: 0, y: 30, duration: 0.8, delay: 0.5 });
          gsap.from('.hero__headline', { opacity: 0, y: 50, duration: 1, delay: 0.7 });
          gsap.from('.hero__sub', { opacity: 0, y: 30, duration: 0.8, delay: 0.9 });
          gsap.from('.hero__ctas', { opacity: 0, y: 20, duration: 0.8, delay: 1.1 });

          // Scroll hint fade in
          gsap.to('.scroll-hint', { opacity: 1, duration: 0.5, delay: 2 });

          // Hide scroll hint on scroll
          var scrollHintEl = document.querySelector('.scroll-hint');
          function updateScrollHint() {
            if (!scrollHintEl) return;
            if (window.scrollY > 60) {
              scrollHintEl.style.opacity = '0';
              scrollHintEl.style.pointerEvents = 'none';
            } else {
              scrollHintEl.style.opacity = '1';
              scrollHintEl.style.pointerEvents = 'auto';
            }
          }
          window.addEventListener('scroll', updateScrollHint, { passive: true });
          updateScrollHint();

          // Nav scroll background
          var nav = document.getElementById('nav');
          ScrollTrigger.create({
            start: 'top -100',
            onEnter: function() { nav.classList.add('scrolled'); },
            onLeaveBack: function() { nav.classList.remove('scrolled'); }
          });

          // Section reveals
          var revealEls = document.querySelectorAll('.category-card, .product-card, .step, .gift-item, .about-grid, .section-pad .container > div:first-child');
          revealEls.forEach(function(el) {
            // Skip stack items on mobile — they have their own entrance animation
            if (window.innerWidth <= 968 && (el.classList.contains('product-card') || el.classList.contains('step') || el.classList.contains('gift-item'))) return;
            gsap.from(el, {
              opacity: 0, y: 40, duration: 0.9,
              scrollTrigger: { trigger: el, start: 'top 85%' }
            });
          });
        }

        // ===== MOBILE STACKS (strictly mobile-only via matchMedia) =====
        function initMobileStacks() {
          ScrollTrigger.matchMedia({
            '(max-width: 968px)': function() {
              function buildStack(gridSelector, itemSelector) {
                var grid = document.querySelector(gridSelector);
                if (!grid) return;
                var items = grid.querySelectorAll(itemSelector);
                if (items.length === 0) return;

                var section = grid.closest('.stack-section');
                if (!section) return;

                var vh = window.innerHeight;
                items.forEach(function(item, i) {
                  if (i > 0) gsap.set(item, { y: vh });
                });

                var tl = gsap.timeline({
                  scrollTrigger: {
                    trigger: section,
                    pin: true,
                    scrub: 1.2,
                    anticipatePin: 1,
                    invalidateOnRefresh: true,
                    start: 'top top',
                    end: '+=' + (items.length * 80) + '%'
                  }
                });

                items.forEach(function(item, i) {
                  if (i > 0) {
                    tl.to(item, { y: 0, duration: 1, ease: 'none' }, i - 1);
                  }
                });
              }

              buildStack('#featured .products-grid', '.product-card');
              buildStack('#process .steps', '.step');
              buildStack('.gift-section .gift-grid', '.gift-item');
            }
          });
        }

        // ===== CURSOR =====
        function initCursor() {
          if (window.innerWidth <= 968) return;
          var cursor = document.querySelector('.cursor');
          var dot = document.querySelector('.cursor-dot');
          if (!cursor || !dot) return;
          window.addEventListener('mousemove', function(e) {
            gsap.to(cursor, { x: e.clientX, y: e.clientY, duration: 0.5, ease: 'power2.out' });
            gsap.to(dot, { x: e.clientX, y: e.clientY, duration: 0.08 });
          });
          document.querySelectorAll('a, button, [data-open-modal]').forEach(function(el) {
            el.addEventListener('mouseenter', function() { cursor.classList.add('hover'); });
            el.addEventListener('mouseleave', function() { cursor.classList.remove('hover'); });
          });
        }

        // ===== MODAL =====
        var modal = document.getElementById('commission-modal');
        var overlay = document.getElementById('modal-overlay');
        var closeBtn = document.getElementById('modal-close');

        function openModal() {
          if (modal) modal.classList.add('open');
          if (overlay) overlay.classList.add('open');
          if (lenis) lenis.stop();
          document.body.style.overflow = 'hidden';
        }
        function closeModal() {
          if (modal) modal.classList.remove('open');
          if (overlay) overlay.classList.remove('open');
          if (lenis) lenis.start();
          document.body.style.overflow = '';
        }

        document.querySelectorAll('[data-open-modal]').forEach(function(btn) {
          btn.addEventListener('click', openModal);
        });
        if (closeBtn) closeBtn.addEventListener('click', closeModal);
        if (overlay) overlay.addEventListener('click', closeModal);
        document.addEventListener('keydown', function(e) {
          if (e.key === 'Escape') closeModal();
        });

        // ===== FORM =====
        var form = document.getElementById('commission-form');
        var toast = document.getElementById('toast');
        function showToast(msg) {
          if (!toast) return;
          toast.textContent = msg;
          toast.classList.add('show');
          setTimeout(function() { toast.classList.remove('show'); }, 3500);
        }
        if (form) {
          form.addEventListener('submit', function(e) {
            e.preventDefault();
            var name = form.querySelector('[name="name"]').value.trim();
            var t = translations[currentLang];
            if (!name) { showToast(t.toast_name); return; }

            var email = form.querySelector('[name="email"]').value.trim();
            var phone = form.querySelector('[name="phone"]').value.trim();
            var productType = form.querySelector('[name="product_type"]').value;
            var wood = form.querySelector('[name="wood"]').value;
            var epoxy = form.querySelector('[name="epoxy"]').value;
            var size = form.querySelector('[name="size"]').value.trim();
            var budget = form.querySelector('[name="budget"]').value.trim();
            var engraving = form.querySelector('[name="engraving"]').value.trim();
            var message = form.querySelector('[name="message"]').value.trim();

            var subject = encodeURIComponent('Custom Board Request — ' + name);
            var bodyLines = [
              'Name: ' + name,
              'Email: ' + email,
              'Phone: ' + (phone || '-'),
              'Product: ' + (productType || '-'),
              'Wood: ' + (wood || '-'),
              'Epoxy: ' + (epoxy || '-'),
              'Size: ' + (size || '-'),
              'Budget: ' + (budget ? '€' + budget : '-'),
              'Engraving: ' + (engraving || '-'),
              '',
              'Message:',
              message || '-'
            ];
            var body = encodeURIComponent(bodyLines.join('\n'));

            window.location.href = 'mailto:Mezameistars387@gmail.com?subject=' + subject + '&body=' + body;
            showToast(t.toast_thanks.replace('{name}', name));
            form.reset();
            closeModal();
          });
        }

        // ===== SUPPORT MODAL =====
        var supportModal = document.getElementById('support-modal');
        var supportClose = document.getElementById('support-close');
        var supportOverlay = document.getElementById('modal-overlay');

        function openSupportModal(tab) {
          if (supportModal) supportModal.classList.add('open');
          if (supportOverlay) supportOverlay.classList.add('open');
          if (lenis) lenis.stop();
          document.body.style.overflow = 'hidden';

          // Switch to requested tab
          if (tab) {
            document.querySelectorAll('.support-tab').forEach(function(t) {
              t.classList.toggle('active', t.getAttribute('data-tab') === tab);
            });
            document.querySelectorAll('.support-panel').forEach(function(p) {
              p.classList.toggle('active', p.id === tab + '-panel');
            });
          }
        }
        function closeSupportModal() {
          if (supportModal) supportModal.classList.remove('open');
          if (supportOverlay) supportOverlay.classList.remove('open');
          if (lenis) lenis.start();
          document.body.style.overflow = '';
        }

        if (supportClose) supportClose.addEventListener('click', closeSupportModal);
        if (supportOverlay) supportOverlay.addEventListener('click', function() {
          closeModal(); closeSupportModal();
        });
        document.querySelectorAll('[data-open-support]').forEach(function(btn) {
          btn.addEventListener('click', function(e) {
            e.preventDefault();
            openSupportModal(btn.getAttribute('data-open-support'));
          });
        });
        document.querySelectorAll('.support-tab').forEach(function(tab) {
          tab.addEventListener('click', function() {
            var target = tab.getAttribute('data-tab');
            document.querySelectorAll('.support-tab').forEach(function(t) { t.classList.remove('active'); });
            document.querySelectorAll('.support-panel').forEach(function(p) { p.classList.remove('active'); });
            tab.classList.add('active');
            var panel = document.getElementById(target + '-panel');
            if (panel) panel.classList.add('active');
          });
        });

        // ===== FAQ ACCORDION =====
        document.querySelectorAll('.faq-q').forEach(function(q) {
          q.addEventListener('click', function() {
            var item = q.closest('.faq-item');
            var isOpen = item.classList.contains('open');
            document.querySelectorAll('.faq-item').forEach(function(i) { i.classList.remove('open'); });
            if (!isOpen) item.classList.add('open');
          });
        });

        // ===== MOBILE MENU =====
        var mobileToggle = document.getElementById('mobile-toggle');
        var mobileMenu = document.getElementById('mobile-menu');
        var mobileClose = document.getElementById('mobile-close');
        if (mobileToggle && mobileMenu) {
          mobileToggle.addEventListener('click', function() { mobileMenu.classList.add('open'); });
          if (mobileClose) mobileClose.addEventListener('click', function() { mobileMenu.classList.remove('open'); });
          mobileMenu.querySelectorAll('a').forEach(function(a) {
            a.addEventListener('click', function() { mobileMenu.classList.remove('open'); });
          });
        }

        // Start
        if (reducedMotion) {
          hideLoader();
          document.getElementById('nav').style.opacity = '1';
          document.getElementById('nav').style.transform = 'none';
          initCursor();
          initMobileStacks();
        } else {
          setTimeout(function() {
            hideLoader();
            initReveals();
            initCursor();
            initMobileStacks();
          }, 2400);
        }
      } catch (err) {
        console.error('GSAP error:', err);
        hideLoader();
        var n = document.getElementById('nav');
        if (n) { n.style.opacity = '1'; n.style.transform = 'none'; }
      }

      // ===== LANGUAGE SWITCH =====
      var translations = {
        en: {
          nav_products: 'Products', nav_process: 'Process', nav_about: 'About', nav_contact: 'Contact', nav_cta: 'Request Custom Board',
          hero_eyebrow: 'Handmade in Latvia',
          hero_headline: '<em>Handcrafted</em><br>Wood &amp; Epoxy Boards',
          hero_sub: 'Unique chess boards and serving boards made from natural wood, epoxy resin, and custom details. One-of-a-kind pieces for gifts, home decor, and everyday use.',
          hero_cta_primary: 'View Products', hero_cta_secondary: 'Request Custom Order', scroll_hint: 'Scroll',
          cat_label: 'Category', cat_chess_title: 'Chess Boards',
          cat_chess_desc: 'Handmade boards for playing, collecting, gifting, and display. Each board is precision-crafted with natural wood and resin design.',
          cat_chess_btn: 'View Chess Boards', cat_serving_title: 'Serving Boards',
          cat_serving_desc: 'Elegant wood-and-epoxy boards for food presentation, kitchens, and gifts. Built to use, made to display.',
          cat_serving_btn: 'View Serving Boards',
          featured_eyebrow: 'Selected Works', featured_title: 'Pieces with Provenance',
          p1_title: 'Walnut & Blue Resin Serving Board', p1_meta: 'Handmade serving board with natural wood and blue epoxy resin', p1_price: 'From €150', p1_tag1: 'Walnut', p1_tag2: 'Blue Resin',
          p2_title: 'Black Gold Chess Board', p2_meta: 'Luxury chess board with natural wood and black-gold epoxy border', p2_price: 'From €180', p2_tag1: 'Black Gold', p2_tag2: 'Chess',
          p3_title: 'Ash Epoxy Serving Board', p3_meta: 'Decorative serving board with natural ash wood and clear epoxy', p3_price: 'From €85', p3_tag1: 'Ash', p3_tag2: 'Food-Safe',
          process_eyebrow: 'How It Works', process_title: 'From Idea to Board',
          step1_title: 'Choose Your Product', step1_desc: 'Select a chess board or serving board. Browse our collection or start from scratch.',
          step2_title: 'Pick Your Style', step2_desc: 'Choose wood, epoxy color, size, and details. Add engraving for a personal touch.',
          step3_title: 'We Handcraft It', step3_desc: 'The board is poured, sanded, polished, and finished by hand over 6 to 8 weeks.',
          step4_title: 'Receive Your Board', step4_desc: 'The finished piece is carefully packed and delivered ready to use or gift.',
          commission_eyebrow: 'Custom Orders', commission_title: 'Create a Board Made Just for You',
          commission_desc: 'Choose the product type, wood, epoxy color, size, engraving, and finish. Perfect for gifts, home decor, chess lovers, weddings, and special occasions.',
          commission_cta: 'Start Custom Order',
          gift_eyebrow: 'Gifts', gift_title: 'Made for Meaningful Gifts',
          gift_desc: 'Our boards are made for people who want something personal, useful, and memorable. Suitable for birthdays, weddings, anniversaries, housewarming, and special occasions.',
          gift1_title: 'Name Engraving', gift1_desc: 'Add a name, date, or short message carved directly into the wood.',
          gift2_title: 'Date Engraving', gift2_desc: 'Mark a wedding, anniversary, or milestone with a permanent inscription.',
          gift3_title: 'Gift Packaging', gift3_desc: 'Each board arrives wrapped and ready to give. No extra wrapping needed.',
          gift4_title: 'Custom Colour Choices', gift4_desc: 'Pick the epoxy tone and wood type to match the recipient\'s style.',
          about_eyebrow: 'About', about_title: 'Built to Use. Made to Display.',
          about_desc1: 'We create handmade wood-and-epoxy boards that combine natural wood grain with modern resin design. Every piece is unique, carefully finished, and made to be both useful and beautiful.',
          about_desc2: 'Founded by Patriks Sergējevs and Emīls Apšukrapšs in Latvia. Each board is poured, sanded, and polished by hand using food-safe finishes. No two pieces are ever the same.',
          contact_eyebrow: 'Get in Touch', contact_title: 'Have an Idea? Let\'s Talk.',
          contact_desc: 'Whether you know exactly what you want or just have a rough idea, we\'re here to help. Every custom order starts with a conversation.',
          contact_cta: 'Request Custom Board', contact_country: 'Latvia',
          footer_desc: 'Handmade wood-and-epoxy boards from Latvia. Chess boards and serving boards, built to last and made to gift.',
          footer_explore: 'Explore', footer_custom: 'Custom Orders', footer_support: 'Support',
          footer_care: 'Care Guide', footer_shipping: 'Shipping', footer_returns: 'Returns',
          footer_contact: 'Contact', footer_social: 'Social',
          footer_copy: '© 2025–2026 Meža meistars. Handcrafted in Latvia.',
          modal_title: 'Request a Custom Board', modal_name: 'Name', modal_email: 'Email', modal_phone: 'Phone',
          modal_product: 'Product Type', modal_select: 'Select...', modal_chess: 'Chess Board', modal_serving: 'Serving Board',
          modal_wood: 'Wood Preference', modal_select_wood: 'Select wood...',
          modal_epoxy: 'Epoxy Color', modal_select_color: 'Select color...',
          modal_black_gold: 'Black & Gold', modal_forest_green: 'Forest Green', modal_ocean_blue: 'Ocean Blue',
          modal_natural: 'Natural Clear', modal_custom: 'Custom — describe below',
          modal_size: 'Preferred Size', modal_budget: 'Budget (EUR)',
          modal_engraving: 'Engraving Text (optional)', modal_message: 'Message', modal_submit: 'Send Request',
          toast_name: 'Please enter your name',
          toast_thanks: 'Thank you, {name}. Your request has been sent. We will reply within 1–2 days.',
          support_title: 'Support & Policies', tab_care: 'Care Guide', tab_shipping: 'Shipping',
          care_title1: 'Daily Care',
          care_desc1: 'Our boards are finished with food-safe oil and wax. To keep them beautiful, hand wash only with warm water and mild soap. Do not soak or submerge. Wipe dry immediately after washing with a soft cloth.',
          care_title2: 'What to Avoid',
          care_avoid1: 'Never place in a dishwasher or microwave',
          care_avoid2: 'Do not leave in standing water or soak for extended periods',
          care_avoid3: 'Avoid direct sunlight and extreme heat sources (stovetops, ovens)',
          care_avoid4: 'Do not use abrasive scrubbers or harsh chemical cleaners',
          care_avoid5: 'Do not cut directly on the epoxy surface — use the wood area or a separate cutting board',
          care_title3: 'Re-oiling Your Board',
          care_desc3: 'Over time the wood may dry out. Apply a thin coat of food-grade mineral oil or beeswax every 4–6 weeks, or when the wood looks dull. Rub in with a soft cloth and let sit overnight. Wipe off any excess before use.',
          care_title4: 'Epoxy Surface Care',
          care_desc4: 'The epoxy resin surface is non-porous and easy to clean. A damp cloth with mild soap is sufficient. For stubborn residue, a small amount of rubbing alcohol on a soft cloth can be used. Avoid ammonia-based cleaners as they may dull the finish over time.',
          care_title5: 'Storage',
          care_desc5: 'Store upright or flat in a dry place away from heat sources. Do not stack heavy objects on top. If displaying, keep out of direct sunlight to preserve the epoxy colour and wood grain.',
          ship_title1: 'Production Time',
          ship_desc1: 'Each board is handmade to order. Standard production takes 6 to 8 weeks from order confirmation. Custom or complex designs may take up to 10 weeks. You will receive an update when your board enters the final finishing stage.',
          ship_title2: 'Shipping Methods',
          ship_desc2: 'We ship across Latvia and the European Union. Boards are carefully wrapped in protective foam, placed in a sturdy cardboard box, and sealed against moisture. Every package is insured for its full value.',
          ship_method1: 'Latvia: 2–4 business days via courier',
          ship_method2: 'EU: 5–10 business days via tracked parcel service',
          ship_method3: 'Rest of Europe: 7–14 business days',
          ship_title3: 'Shipping Costs',
          ship_cost1: 'Latvia: €8 (free on orders over €150)',
          ship_cost2: 'EU: €18 (free on orders over €250)',
          ship_cost3: 'Rest of Europe: calculated at checkout based on weight and destination',
          ship_title4: 'Pickup Option',
          ship_desc4: 'Local pickup is available in Sigulda, Latvia by appointment. We will contact you to schedule a convenient time once your board is ready. No shipping cost applies for pickup orders.',
          ship_title5: 'Damaged in Transit',
          ship_desc5: 'If your board arrives damaged, contact us within 48 hours with clear photos of the packaging and the damage. Every shipment is fully insured and we will work with you to repair or replace the piece at no extra cost.',
          faq_eyebrow: 'Questions', faq_title: 'Common Questions',
          faq1_q: 'Can I order a custom size?', faq1_a: 'Yes. Every board is made to order, so you can request specific dimensions. Tell us the size you need in the custom order form and we will confirm what is possible with the wood available.',
          faq2_q: 'Do you ship outside Latvia?', faq2_a: 'We ship across the European Union. For destinations outside the EU, contact us directly and we will check delivery options and pricing for your country.',
          faq3_q: 'How do I care for the board?', faq3_a: 'Hand wash only with warm water and mild soap. Wipe dry immediately. Do not soak, dishwasher, or microwave. Re-oil with food-grade mineral oil every 4–6 weeks to keep the wood hydrated.',
          faq4_q: 'How long does production take?', faq4_a: 'Standard boards take 6 to 8 weeks from order confirmation. Complex or large custom designs may take up to 10 weeks. We will send you an update when your board enters the final finishing stage.',
          faq5_q: 'Is the finish food-safe?', faq5_a: 'Yes. All serving boards are finished with food-safe oil and wax that meets direct food contact standards. The epoxy resin is also non-toxic and fully cured before delivery.'
        },
        lv: {
          nav_products: 'Produkti', nav_process: 'Process', nav_about: 'Par mums', nav_contact: 'Kontakti', nav_cta: 'Pasūtīt individuāli',
          hero_eyebrow: 'Handmade Latvijā',
          hero_headline: '<em>Rokdarbu</em><br>Koka &amp; Epoksīda Dēļi',
          hero_sub: 'Unikāli šaha dēļi un pasniegšanas dēļi no dabīga koka, epoksīda sveķiem un pielāgotiem elementiem. Unikāli izstrādājumi dāvanām, mājas dekoram un ikdienas lietošanai.',
          hero_cta_primary: 'Skatīt produktus', hero_cta_secondary: 'Individuāls pasūtījums', scroll_hint: 'Tālāk',
          cat_label: 'Kategorija', cat_chess_title: 'Šaha dēļi',
          cat_chess_desc: 'Rokdarbu dēļi spēlēšanai, kolekcionēšanai, dāvanām un izstādīšanai. Katrs dēlis ir precīzi izgatavots no dabīga koka un sveķu dizaina.',
          cat_chess_btn: 'Skatīt šaha dēļus', cat_serving_title: 'Pasniegšanas dēļi',
          cat_serving_desc: 'Eleganti koka-un-epoksīda dēļi ēdiena pasniegšanai, virtuvei un dāvanām. Izveidoti lietošanai, radīti izstādīšanai.',
          cat_serving_btn: 'Skatīt pasniegšanas dēļus',
          featured_eyebrow: 'Izvēlētie darbi', featured_title: 'Darbi ar izcelsmi',
          p1_title: 'Valriekstu & zilā sveķu pasniegšanas dēlis', p1_meta: 'Rokdarbu pasniegšanas dēlis no dabīga koka un zilā epoksīda sveķiem', p1_price: 'No €150', p1_tag1: 'Valrieksts', p1_tag2: 'Zilais sveķis',
          p2_title: 'Melnais zelta šaha dēlis', p2_meta: 'Luksusa šaha dēlis no dabīga koka un melnā-zelta epoksīda apmales', p2_price: 'No €180', p2_tag1: 'Melnais zelts', p2_tag2: 'Šahs',
          p3_title: 'Kļavu epoksīda pasniegšanas dēlis', p3_meta: 'Dekoratīvs pasniegšanas dēlis no dabīgas kļavas un caurspīdīga epoksīda', p3_price: 'No €85', p3_tag1: 'Kļava', p3_tag2: 'Pārtikas drošs',
          process_eyebrow: 'Kā tas strādā', process_title: 'No idejas līdz dēlim',
          step1_title: 'Izvēlieties produktu', step1_desc: 'Izvēlieties šaha dēli vai pasniegšanas dēli. Iepazīstieties ar kolekciju vai sāciet no nulles.',
          step2_title: 'Izvēlieties stilu', step2_desc: 'Izvēlieties koku, epoksīda krāsu, izmēru un detaļas. Pievienojiet gravējumu personiskai notijai.',
          step3_title: 'Mēs izgatavojam ar rokām', step3_desc: 'Dēlis tiek izliets, slīpēts, pulēts un apstrādāts ar rokām 6 līdz 8 nedēļās.',
          step4_title: 'Saņemiet savu dēli', step4_desc: 'Gatavais izstrādājums tiek uzmanīgi iepakots un piegādāts gatavs lietošanai vai dāvināšanai.',
          commission_eyebrow: 'Individuālie pasūtījumi', commission_title: 'Izveidojiet dēli tieši Jums',
          commission_desc: 'Izvēlieties produkta veidu, koku, epoksīda krāsu, izmēru, gravējumu un apdari. Ideāli piemērots dāvanām, mājas dekoram, šaha cienītājiem, kāzām un īpašiem notikumiem.',
          commission_cta: 'Sākt individuālo pasūtījumu',
          gift_eyebrow: 'Dāvanas', gift_title: 'Radītas nozīmīgām dāvanām',
          gift_desc: 'Mūsu dēļi ir radīti cilvēkiem, kas vēlas kaut ko personisku, noderīgu un neaizmirstamu. Piemēroti dzimšanas dienām, kāzām, jubilejām, mājas svinībām un īpašiem notikumiem.',
          gift1_title: 'Vārda gravējums', gift1_desc: 'Pievienojiet vārdu, datumu vai īsu ziņu, kas iegriezta tieši kokā.',
          gift2_title: 'Datuma gravējums', gift2_desc: 'Atzīmējiet kāzas, jubileju vai nozīmīgu notikumu ar pastāvīgu uzrakstu.',
          gift3_title: 'Dāvanu iepakojums', gift3_desc: 'Katrs dēlis ierodas iesaiņots un gatavs dāvināšanai. Nav nepieciešama papildu iesaiņošana.',
          gift4_title: 'Pielāgotas krāsu izvēles', gift4_desc: 'Izvēlieties epoksīda toni un koka veidu, kas atbilst saņēmēja stilam.',
          about_eyebrow: 'Par mums', about_title: 'Radīti lietošanai. Radīti izstādīšanai.',
          about_desc1: 'Mēs radām rokdarbu koka-un-epoksīda dēļus, kas apvieno dabīga koka struktūru ar modernu sveķu dizainu. Katrs gabals ir unikāls, rūpīgi apstrādāts un radīts, lai būtu gan noderīgs, gan skaists.',
          about_desc2: 'Dibinājuši Patriks Sergējevs un Emīls Apšukrapšs Latvijā. Katrs dēlis tiek izliets, slīpēts un pulēts ar rokām, izmantojot pārtikai drošus apdares materiālus. Neviena detaļa nav līdzīga citai.',
          contact_eyebrow: 'Sazināties', contact_title: 'Ir ideja? Runāsim.',
          contact_desc: 'Vai Jūs precīzi zināt, ko vēlaties, vai tikai aptuvenu ideju — mēs esam šeit, lai palīdzētu. Katrs individuālais pasūtījums sākas ar sarunu.',
          contact_cta: 'Pasūtīt individuāli', contact_country: 'Latvija',
          footer_desc: 'Rokdarbu koka-un-epoksīda dēļi no Latvijas. Šaha dēļi un pasniegšanas dēļi, radīti ilgai lietošanai un dāvināšanai.',
          footer_explore: 'Izpētīt', footer_custom: 'Individuālie pasūtījumi', footer_support: 'Atbalsts',
          footer_care: 'Kopšanas ceļvedis', footer_shipping: 'Piegāde', footer_returns: 'Atgriešana',
          footer_contact: 'Kontakti', footer_social: 'Sociālie tīkli',
          footer_copy: '© 2025–2026 Meža meistars. Rokdarbi Latvijā.',
          modal_title: 'Individuāls pasūtījums', modal_name: 'Vārds', modal_email: 'E-pasts', modal_phone: 'Tālrunis',
          modal_product: 'Produkta veids', modal_select: 'Izvēlieties...', modal_chess: 'Šaha dēlis', modal_serving: 'Pasniegšanas dēlis',
          modal_wood: 'Koka veids', modal_select_wood: 'Izvēlieties koku...',
          modal_epoxy: 'Epoksīda krāsa', modal_select_color: 'Izvēlieties krāsu...',
          modal_black_gold: 'Melnais & Zelts', modal_forest_green: 'Meža zaļā', modal_ocean_blue: 'Okeāna zilā',
          modal_natural: 'Dabīgi caurspīdīgs', modal_custom: 'Cita — aprakstiet zemāk',
          modal_size: 'Vēlamais izmērs', modal_budget: 'Budžets (EUR)',
          modal_engraving: 'Gravējuma teksts (neobligāti)', modal_message: 'Ziņa', modal_submit: 'Nosūtīt pieprasījumu',
          toast_name: 'Lūdzu, ievadiet savu vārdu',
          toast_thanks: 'Paldies, {name}. Jūsu pieprasījums ir nosūtīts. Atbildēsim 1–2 dienu laikā.',
          support_title: 'Atbalsts un politika', tab_care: 'Kopšanas ceļvedis', tab_shipping: 'Piegāde',
          care_title1: 'Ikdienas kopšana',
          care_desc1: 'Mūsu dēļi ir apstrādāti ar pārtikai drošu eļļu un vasku. Lai tie saglabātu skaistumu, mazgājiet tikai ar rokām, izmantojot siltu ūdeni un maigu ziepes. Nenogremdējiet ūdenī. Nomazgājot, noslauciet sausu ar mīkstu drānu.',
          care_title2: 'Ko izvairīties',
          care_avoid1: 'Nekad nelieciet trauku mazgājamajā mašīnā vai mikroviļņu krāsnī',
          care_avoid2: 'Neatstājiet stāvošā ūdenī vai nenogremdējiet uz ilgu laiku',
          care_avoid3: 'Izvairieties no tiešas saules gaismas un ekstrēma karstuma avotiem (plīts virsmas, cepeškrāsnis)',
          care_avoid4: 'Neizmantojiet abrazīvus skrubjus vai agresīvus ķīmiskos tīrīšanas līdzekļus',
          care_avoid5: 'Negrieziet tieši uz epoksīda virsmas — izmantojiet koka zonu vai atsevišķu griešanas dēli',
          care_title3: 'Dēļa atjaunošana ar eļļu',
          care_desc3: 'Laika gaitā koks var izžūt. Uzklājiet plānu kārtu pārtikai drošas minerāleļļas vai bišu vaska katras 4–6 nedēļas, vai kad koks izskatās matēts. Ierubjiet ar mīkstu drānu un atstājiet uz nakti. Pirms lietošanas noslaukiet lieko.',
          care_title4: 'Epoksīda virsmas kopšana',
          care_desc4: 'Epoksīda sveķu virsma ir necaurlaidīga un viegli tīrāma. Pietiek ar mitru drānu un maigu ziepju šķīdumu. Noturīgām traipu paliekām var izmantot nelielu daudzumu spirta uz mīkstas drānas. Izvairieties no amonjaka saturošiem tīrīšanas līdzekļiem, jo tie ar laiku var matēt apdari.',
          care_title5: 'Uzglabāšana',
          care_desc5: 'Uzglabājiet vertikāli vai horizontāli sausā vietā, prom no karstuma avotiem. Neuzkrāvajiet smagus priekšmetus virsū. Ja izstādat, turiet prom no tiešas saules gaismas, lai saglabātu epoksīda krāsu un koka struktūru.',
          ship_title1: 'Ražošanas laiks',
          ship_desc1: 'Katrs dēlis tiek izgatavots pēc pasūtījuma. Standarta ražošana aizņem 6 līdz 8 nedēļas no pasūtījuma apstiprināšanas. Individuāli vai sarežģīti dizaini var aizņemt līdz 10 nedēļām. Jūs saņemsiet atjauninājumu, kad dēlis ieies pēdējā apdares stadijā.',
          ship_title2: 'Piegādes veidi',
          ship_desc2: 'Mēs piegādājam visā Latvijā un Eiropas Savienībā. Dēļi ir rūpīgi ietīti aizsargājošā putuplastā, ievietoti stingrā kartona kastē un noslēgti pret mitrumu. Katrs sūtījums ir apdrošināts pilnā vērtībā.',
          ship_method1: 'Latvija: 2–4 darba dienas ar kurjeru',
          ship_method2: 'ES: 5–10 darba dienas ar izsekojamu paku pakalpojumu',
          ship_method3: 'Pārējā Eiropa: 7–14 darba dienas',
          ship_title3: 'Piegādes izmaksas',
          ship_cost1: 'Latvija: €8 (bezmaksas pasūtījumiem virs €150)',
          ship_cost2: 'ES: €18 (bezmaksas pasūtījumiem virs €250)',
          ship_cost3: 'Pārējā Eiropa: aprēķināts pasūtījuma laikā, pamatojoties uz svaru un galamērķi',
          ship_title4: 'Pašizņemšanas iespēja',
          ship_desc4: 'Pašizņemšana ir pieejama Siguldā, Latvijā, pēc iepriekšēja pieraksta. Mēs ar Jums sazināsimies, lai saskaņotu ērtu laiku, kad dēlis būs gatavs. Pašizņemšanas pasūtījumiem nav piegādes izmaksu.',
          ship_title5: 'Bojājumi transportēšanas laikā',
          ship_desc5: 'Ja dēlis ierodas bojāts, sazinieties ar mums 48 stundu laikā ar skaidrām iepakojuma un bojājumu fotogrāfijām. Katrs sūtījums ir pilnībā apdrošināts, un mēs sadarbosimies ar Jums, lai salabotu vai aizvietotu gabalu bez papildu izmaksām.',
          faq_eyebrow: 'Jautājumi', faq_title: 'Biežāk uzdotie jautājumi',
          faq1_q: 'Vai varu pasūtīt pielāgotu izmēru?', faq1_a: 'Jā. Katrs dēlis tiek izgatavots pēc pasūtījuma, tāpēc varat pieprasīt konkrētus izmērus. Pastāstiet mums vajadzīgo izmēru individuālā pasūtījuma veidlapā, un mēs apstiprināsim, kas ir iespējams ar pieejamo koku.',
          faq2_q: 'Vai piegādājat ārpus Latvijas?', faq2_a: 'Mēs piegādājam visā Eiropas Savienībā. Destinācijām ārpus ES sazinieties ar mums tieši, un mēs pārbaudīsim piegādes iespējas un cenu jūsu valstij.',
          faq3_q: 'Kā kopt dēli?', faq3_a: 'Mazgājiet tikai ar rokām, izmantojot siltu ūdeni un maigu ziepju šķīdumu. Noslauciet sausu uzreiz. Nenogremdējiet, nelieciet trauku mazgājamajā mašīnā vai mikroviļņu krāsnī. Atjaunojiet eļļu ar pārtikai drošu minerāleļļu katras 4–6 nedēļas, lai koks saglabātu mitrumu.',
          faq4_q: 'Cik ilgs ir ražošanas laiks?', faq4_a: 'Standarta dēļiem nepieciešamas 6 līdz 8 nedēļas no pasūtījuma apstiprināšanas. sarežģītiem vai lieliem individuāliem dizainiem var būt nepieciešamas līdz 10 nedēļām. Mēs nosūtīsim jums atjauninājumu, kad dēlis ieies pēdējā apdares stadijā.',
          faq5_q: 'Vai apdare ir pārtikai droša?', faq5_a: 'Jā. Visi pasniegšanas dēļi ir apstrādāti ar pārtikai drošu eļļu un vasku, kas atbilst tiešas saskares ar pārtiku standartiem. Epoksīda sveķi ir arī netoksiski un pilnībā sacietējuši pirms piegādes.'
        }
      };

      var currentLang = localStorage.getItem('mm_lang') || 'en';
      var langToggle = document.getElementById('lang-toggle');

      function setLanguage(lang) {
        currentLang = lang;
        localStorage.setItem('mm_lang', lang);
        var t = translations[lang];
        if (!t) return;

        document.querySelectorAll('[data-i18n]').forEach(function(el) {
          var key = el.getAttribute('data-i18n');
          if (t[key] !== undefined) el.textContent = t[key];
        });
        document.querySelectorAll('[data-i18n-html]').forEach(function(el) {
          var key = el.getAttribute('data-i18n-html');
          if (t[key] !== undefined) el.innerHTML = t[key];
        });

        if (langToggle) langToggle.textContent = lang === 'en' ? 'LV' : 'EN';
      }

      if (langToggle) {
        langToggle.addEventListener('click', function() {
          setLanguage(currentLang === 'en' ? 'lv' : 'en');
        });
      }

      setLanguage(currentLang);
    })();
