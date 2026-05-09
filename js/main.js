/**
 * Meza Meistars — Main JavaScript
 * Animation-Driven Storytelling
 */

// ─── 1. Global State ───
let lenis;
let cart = JSON.parse(localStorage.getItem('mm_cart')) || [];
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// ─── 2. Utility: Wait for fonts ───
function waitForFonts() {
  return document.fonts.ready;
}

// ─── 3. Lenis Smooth Scroll ───
function initLenis() {
  if (prefersReducedMotion) return;
  lenis = new Lenis({
    lerp: 0.08,
    smooth: true,
  });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
  window.lenis = lenis;
}

// ─── 4. GSAP Defaults ───
gsap.defaults({ ease: 'power3.out', duration: 1.2 });
gsap.registerPlugin(ScrollTrigger);
if (typeof SplitText !== 'undefined') {
  gsap.registerPlugin(SplitText);
}

// ─── 5. Loader Sequence ───
function initLoader() {
  const loader = document.querySelector('.page-loader');
  if (!loader) {
    initMainAnimations();
    return;
  }

  // Safety net: always hide loader after 4s even if GSAP fails
  const safetyTimer = setTimeout(() => {
    loader.classList.add('hidden');
    loader.style.display = 'none';
    loader.style.pointerEvents = 'none';
    initMainAnimations();
  }, 4000);

  const logo = loader.querySelector('.loader-logo');
  const tl = gsap.timeline({
    onComplete: () => {
      clearTimeout(safetyTimer);
      loader.classList.add('hidden');
      loader.style.display = 'none';
      loader.style.pointerEvents = 'none';
    }
  });

  tl.to(logo, { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out' })
    .add(() => { loader.style.pointerEvents = 'none'; }) // unblock viewport mid-wipe
    .to(loader, {
      clipPath: 'inset(0 0 100% 0)',
      duration: 0.7,
      ease: 'expo.inOut'
    })
    .call(() => initMainAnimations(), [], '-=0.35'); // overlap hero reveal with wipe end
}

// ─── 6. Hero Text Reveal (SplitText) ───
function revealHero(selector) {
  const el = document.querySelector(selector);
  if (!el) return;

  if (prefersReducedMotion) {
    gsap.set(selector, { opacity: 1 });
    return;
  }

  // Ensure element is invisible before SplitText runs to prevent flash of whole text
  gsap.set(el, { opacity: 0 });

  // Fallback if SplitText (premium plugin) isn't loaded
  if (typeof SplitText === 'undefined') {
    gsap.to(el, { opacity: 1, y: 0, duration: 1.2, ease: 'power3.out' });
    return;
  }

  const split = new SplitText(el, { type: 'lines,words,chars' });

  // Reveal container; individual chars animate from hidden
  gsap.set(el, { opacity: 1 });

  gsap.from(split.chars, {
    opacity: 0,
    y: 80,
    rotationX: -90,
    stagger: 0.015,
    duration: 1,
    ease: 'back.out(1.7)',
    transformOrigin: '50% 50% -30px',
    delay: 0,
  });
}

// ─── 7. Scroll Hint ───
function initScrollHint() {
  const hint = document.querySelector('.scroll-hint');
  if (!hint) return;

  const line = hint.querySelector('.scroll-line');
  if (line) {
    gsap.fromTo(line,
      { scaleY: 0, transformOrigin: 'top center' },
      {
        scaleY: 1,
        duration: 1.2,
        ease: 'power2.inOut',
        repeat: -1,
        yoyo: true,
        delay: 2,
      }
    );
  }

  ScrollTrigger.create({
    start: 'top -50px',
    onEnter: () => gsap.to(hint, { opacity: 0, duration: 0.5 }),
    onLeaveBack: () => gsap.to(hint, { opacity: 1, duration: 0.5 }),
  });
}

// ─── 8. Mask Reveal (Images) ───
function maskReveal(wrapper) {
  if (prefersReducedMotion) return;
  const img = wrapper.querySelector('img');
  if (!img) return;

  gsap.from(img, {
    scale: 1.15,
    duration: 1.6,
    ease: 'expo.out',
    scrollTrigger: {
      trigger: wrapper,
      start: 'top 80%',
      toggleActions: 'play none none none',
    },
  });

  gsap.from(wrapper, {
    clipPath: 'inset(0 100% 0 0)',
    duration: 1.4,
    ease: 'expo.inOut',
    scrollTrigger: {
      trigger: wrapper,
      start: 'top 80%',
    },
  });
}

// ─── 9. Parallax Layers ───
function parallaxLayers(section) {
  if (prefersReducedMotion) return;
  const layers = section.querySelectorAll('[data-depth]');
  layers.forEach((el) => {
    const depth = parseFloat(el.dataset.depth);
    gsap.to(el, {
      yPercent: -30 * depth,
      ease: 'none',
      scrollTrigger: {
        trigger: section,
        start: 'top bottom',
        end: 'bottom top',
        scrub: 1.5,
      },
    });
  });
}

// ─── 10. Fade-In Sections ───
function initFadeSections() {
  if (prefersReducedMotion) return;
  document.querySelectorAll('[data-fade]').forEach((el) => {
    const rect = el.getBoundingClientRect();
    const inViewport = rect.top < window.innerHeight * 0.92 && rect.bottom > 0;

    if (inViewport) {
      gsap.fromTo(el,
        { opacity: 0, y: 40 },
        { opacity: 1, y: 0, duration: 1, ease: 'power3.out', delay: 0.08 }
      );
    } else {
      gsap.fromTo(el,
        { opacity: 0, y: 40 },
        {
          opacity: 1,
          y: 0,
          duration: 1,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: el,
            start: 'top 85%',
            toggleActions: 'play none none none',
          },
        }
      );
    }
  });
}

// ─── 11. Magnetic Cursor ───
function initMagneticCursor() {
  if (prefersReducedMotion || window.matchMedia('(pointer: coarse)').matches) return;

  const cursor = document.querySelector('.cursor');
  const cursorDot = document.querySelector('.cursor-dot');
  if (!cursor || !cursorDot) return;

  let mouseX = window.innerWidth / 2;
  let mouseY = window.innerHeight / 2;

  // Center elements via GSAP so x/y map directly to mouse coordinates
  gsap.set(cursor, { xPercent: -50, yPercent: -50 });
  gsap.set(cursorDot, { xPercent: -50, yPercent: -50 });

  // Position at center on load so it doesn't snap from (0,0)
  gsap.set(cursor, { x: mouseX, y: mouseY });
  gsap.set(cursorDot, { x: mouseX, y: mouseY });

  window.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    gsap.to(cursor, { x: mouseX, y: mouseY, duration: 0.5, ease: 'power2.out', overwrite: 'auto' });
    gsap.to(cursorDot, { x: mouseX, y: mouseY, duration: 0.1, overwrite: 'auto' });
  });

  // Magnetic hover effect
  document.querySelectorAll('[data-magnetic]').forEach((el) => {
    el.addEventListener('mousemove', (e) => {
      const rect = el.getBoundingClientRect();
      const relX = e.clientX - rect.left - rect.width / 2;
      const relY = e.clientY - rect.top - rect.height / 2;
      gsap.to(el, { x: relX * 0.12, y: relY * 0.12, duration: 0.4, ease: 'power2.out' });
      gsap.to(cursor, { scale: 2.5, duration: 0.3 });
    });
    el.addEventListener('mouseleave', () => {
      gsap.to(el, { x: 0, y: 0, duration: 0.6, ease: 'elastic.out(1, 0.4)' });
      gsap.to(cursor, { scale: 1, duration: 0.3 });
    });
  });

  // Scale cursor on interactive elements
  const hoverTargets = document.querySelectorAll('a, button, [data-cursor-hover]');
  hoverTargets.forEach((el) => {
    el.addEventListener('mouseenter', () => cursor.classList.add('hover'));
    el.addEventListener('mouseleave', () => cursor.classList.remove('hover'));
  });
}

// ─── 12. Mobile Navigation ───
function initMobileNav() {
  const toggle = document.querySelector('.mobile-nav-toggle');
  const menu = document.querySelector('.mobile-menu');
  const closeBtn = document.querySelector('.mobile-menu-close');
  if (!toggle || !menu) return;

  toggle.addEventListener('click', () => menu.classList.add('open'));
  if (closeBtn) closeBtn.addEventListener('click', () => menu.classList.remove('open'));

  menu.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => menu.classList.remove('open'));
  });
}

// ─── 13. Micro-interactions ───
function initMicroInteractions() {
  // Nav link letter-spacing hover
  document.querySelectorAll('.nav-link').forEach((link) => {
    link.addEventListener('mouseenter', () => {
      gsap.to(link, { letterSpacing: '0.05em', duration: 0.3, ease: 'power2.out' });
    });
    link.addEventListener('mouseleave', () => {
      gsap.to(link, { letterSpacing: '-0.02em', duration: 0.4, ease: 'power2.out' });
    });
  });

  // Footer link hover translate
  document.querySelectorAll('footer a').forEach((link) => {
    if (!link.classList.contains('hover:translate-x-1')) return;
    link.addEventListener('mouseenter', () => {
      gsap.to(link, { x: 4, duration: 0.3, ease: 'power2.out' });
    });
    link.addEventListener('mouseleave', () => {
      gsap.to(link, { x: 0, duration: 0.3, ease: 'power2.out' });
    });
  });
}

// ─── 13.5 Footer Dots Interaction ───
function initFooterDotsInteraction() {
  // No-op: footer social icons remain normal, non-interactive links
}

// ─── 14. Page Transitions ───
function initPageTransitions() {
  document.querySelectorAll('a[href]').forEach((link) => {
    const href = link.getAttribute('href');
    if (!href || href.startsWith('#') || href.startsWith('http') || href.startsWith('mailto:')) return;

    link.addEventListener('click', (e) => {
      e.preventDefault();
      const curtain = document.querySelector('.page-curtain');
      if (!curtain) {
        window.location.href = href;
        return;
      }

      curtain.classList.add('active');
      setTimeout(() => {
        window.location.href = href;
      }, 700);
    });
  });
}

// ─── 15. Cart Functionality ───
function initCart() {
  const cartBtn = document.querySelector('[data-cart-toggle]');
  const drawer = document.querySelector('.cart-drawer');
  const overlay = document.querySelector('.cart-overlay');

  if (cartBtn && drawer) {
    cartBtn.addEventListener('click', () => {
      drawer.classList.add('open');
      if (overlay) overlay.classList.add('open');
      renderCartItems();
    });
  }

  if (overlay) {
    overlay.addEventListener('click', () => {
      drawer?.classList.remove('open');
      overlay.classList.remove('open');
    });
  }

  document.querySelectorAll('[data-add-to-cart]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const product = JSON.parse(btn.dataset.addToCart);
      addToCart(product);
    });
  });
}

function addToCart(product) {
  const existing = cart.find((item) => item.id === product.id);
  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({ ...product, qty: 1 });
  }
  saveCart();
  updateCartBadge();
  showToast(`${product.name} added to cart`);
}

function removeFromCart(id) {
  cart = cart.filter((item) => item.id !== id);
  saveCart();
  updateCartBadge();
  renderCartItems();
}

function saveCart() {
  localStorage.setItem('mm_cart', JSON.stringify(cart));
}

function updateCartBadge() {
  const badge = document.querySelector('.cart-badge');
  const count = cart.reduce((sum, item) => sum + item.qty, 0);
  if (badge) {
    badge.textContent = count;
    badge.style.display = count > 0 ? 'flex' : 'none';
  }
}

function renderCartItems() {
  const list = document.querySelector('.cart-items');
  if (!list) return;

  if (cart.length === 0) {
    list.innerHTML = '<div class="flex-1 flex items-center justify-center text-on-surface-variant font-body-md">Your cart is empty</div>';
    return;
  }

  list.innerHTML = cart.map((item) => `
    <div class="flex gap-4 p-4 border-b border-outline-variant/20">
      <img src="${item.image}" alt="${item.name}" class="w-20 h-20 object-cover rounded-sm">
      <div class="flex-1">
        <h4 class="font-headline-md text-headline-md text-primary text-base">${item.name}</h4>
        <p class="font-body-md text-sm text-on-surface-variant">Qty: ${item.qty}</p>
        <p class="font-body-md text-sm text-primary font-bold">€${(item.price * item.qty).toFixed(2)}</p>
      </div>
      <button onclick="removeFromCart('${item.id}')" class="text-on-surface-variant hover:text-error transition-colors">
        <span class="material-symbols-outlined">close</span>
      </button>
    </div>
  `).join('');

  const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const totalEl = document.querySelector('.cart-total');
  if (totalEl) totalEl.textContent = `€${total.toFixed(2)}`;
}

function showToast(message) {
  const toast = document.querySelector('.toast');
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3000);
}

// ─── 16. Newsletter Form ───
function initNewsletterForms() {
  document.querySelectorAll('form[data-newsletter]').forEach((form) => {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const input = form.querySelector('input[type="email"]');
      if (input && input.value) {
        showToast('Thank you for subscribing to the Studio Journal');
        input.value = '';
      }
    });
  });
}

// ─── 16.5 Nav Scroll Background ───
function initNavScroll() {
  const nav = document.getElementById('main-nav');
  if (!nav) return;
  window.addEventListener('scroll', () => {
    if (window.scrollY > 100) {
      nav.classList.add('bg-[#DAD7CD]/90', 'backdrop-blur-xl');
      nav.classList.remove('bg-transparent');
    } else {
      nav.classList.remove('bg-[#DAD7CD]/90', 'backdrop-blur-xl');
      nav.classList.add('bg-transparent');
    }
  }, { passive: true });
}

// ─── 17. Main Init ───
function initMainAnimations() {
  initScrollHint();
  initFadeSections();
  initMagneticCursor();
  initMicroInteractions();
  initFooterDotsInteraction();

  // Reveal wraps
  document.querySelectorAll('.reveal-wrap').forEach(maskReveal);

  // Parallax sections
  document.querySelectorAll('[data-parallax]').forEach(parallaxLayers);

  // Hero
  revealHero('.hero-headline');

  // Release the visibility gate so content is free to animate
  document.body.classList.add('loaded');
}

// ─── 18. Boot Sequence ───
document.addEventListener('DOMContentLoaded', () => {
  initNavScroll();

  if (prefersReducedMotion) {
    const loader = document.querySelector('.page-loader');
    if (loader) {
      loader.classList.add('hidden');
      loader.style.display = 'none';
    }
    document.body.classList.add('loaded');
    initMobileNav();
    initCart();
    initNewsletterForms();
    initPageTransitions();
    initFooterDotsInteraction();
    updateCartBadge();
    return;
  }

  initLenis();
  initLoader(); // calls initMainAnimations() on complete
  initMobileNav();
  initCart();
  initNewsletterForms();
  initPageTransitions();
  updateCartBadge();
});
