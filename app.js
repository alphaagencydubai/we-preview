/* WE — build by Alpha Agency. Motion + interaction tuned for this brand. */
/* ============================================================
   ALPHA STOREFRONT KIT — shared app logic
   Reads BRAND + PRODUCTS from data.js
   ============================================================ */
(function () {
  'use strict';

  /* ---------- storage with in-memory fallback ---------- */
  var mem = {};
  var store = {
    get: function (k, d) {
      try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : (k in mem ? mem[k] : d); }
      catch (e) { return (k in mem) ? mem[k] : d; }
    },
    set: function (k, v) {
      mem[k] = v;
      try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {}
    }
  };
  var NS = BRAND.slug + ':';

  /* ---------- state ---------- */
  var state = {
    cart: store.get(NS + 'cart', []),
    favs: store.get(NS + 'favs', []),
    orders: store.get(NS + 'orders', BRAND.seedOrders || []),
    points: store.get(NS + 'points', BRAND.seedPoints || 0),
    filter: 'All',
    promo: null,
    current: null,
    size: null
  };
  function save() {
    store.set(NS + 'cart', state.cart);
    store.set(NS + 'favs', state.favs);
    store.set(NS + 'orders', state.orders);
    store.set(NS + 'points', state.points);
  }

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var money = function (n) { return n.toLocaleString('en-US') + ' ' + BRAND.currency; };
  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]; }); };
  var byId = function (id) { for (var i = 0; i < PRODUCTS.length; i++) if (PRODUCTS[i].id === id) return PRODUCTS[i]; return null; };

  /* ---------- icons ---------- */
  var I = {
    home: '<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.6V20a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V9.6"/>',
    shop: '<path d="M4 8h16l-1 12a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1L4 8Z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/>',
    bag:  '<path d="M6 7h12l1.2 13a1 1 0 0 1-1 1.1H5.8a1 1 0 0 1-1-1.1L6 7Z"/><path d="M9 7V5.6A3 3 0 0 1 15 5.6V7"/>',
    user: '<circle cx="12" cy="8.2" r="3.6"/><path d="M4.6 20.4a7.6 7.6 0 0 1 14.8 0"/>',
    heart:'<path d="M12 20s-7.2-4.5-7.2-9.3A4.2 4.2 0 0 1 12 8.1a4.2 4.2 0 0 1 7.2 2.6C19.2 15.5 12 20 12 20Z"/>',
    close:'<path d="M6 6l12 12M18 6 6 18"/>',
    check:'<path d="m4 12 5.5 5.5L20 7"/>',
    box:  '<path d="M3 8.2 12 3l9 5.2v7.6L12 21l-9-5.2V8.2Z"/><path d="M3 8.2 12 13.4l9-5.2M12 13.4V21"/>',
    pin:  '<path d="M12 21s7-5.6 7-11a7 7 0 1 0-14 0c0 5.4 7 11 7 11Z"/><circle cx="12" cy="10" r="2.6"/>',
    ruler:'<path d="M3 8h18v8H3z"/><path d="M7 8v3M11 8v4M15 8v3M19 8v4"/>',
    bell: '<path d="M6.5 9.5a5.5 5.5 0 0 1 11 0c0 4 1.5 5.5 1.5 5.5H5s1.5-1.5 1.5-5.5Z"/><path d="M10.2 18.6a2 2 0 0 0 3.6 0"/>',
    ig:   '<rect x="3.5" y="3.5" width="17" height="17" rx="5"/><circle cx="12" cy="12" r="3.8"/><circle cx="17" cy="7" r="1.1" fill="currentColor" stroke="none"/>'
  };
  var svg = function (k, cls) { return '<svg viewBox="0 0 24 24" ' + (cls ? 'class="' + cls + '"' : '') + '>' + I[k] + '</svg>'; };

  /* ---------- toast ---------- */
  var toastT;
  function toast(msg) {
    var t = $('#toast');
    t.innerHTML = svg('check') + '<span>' + esc(msg) + '</span>';
    t.classList.add('on');
    clearTimeout(toastT);
    toastT = setTimeout(function () { t.classList.remove('on'); }, 2600);
  }

  /* ---------- cards ---------- */
  function cardHTML(p) {
    var fav = state.favs.indexOf(p.id) > -1;
    return '<button class="card" data-open="' + p.id + '">' +
      '<div class="ph">' +
        (p.tag ? '<span class="tag">' + esc(p.tag) + '</span>' : '') +
        '<span class="fav' + (fav ? ' on' : '') + '" data-fav="' + p.id + '" role="button" aria-label="Save">' + svg('heart') + '</span>' +
        '<img src="' + p.img[0] + '" alt="' + esc(p.name) + '" loading="lazy" width="1000" height="1250">' +
      '</div>' +
      '<div class="meta"><div class="nm">' + esc(p.name) + '</div>' +
        '<div class="sub">' + esc(p.cat) + '</div>' +
        '<div class="pr">' + money(p.price) + (p.was ? '<s>' + money(p.was) + '</s>' : '') + '</div>' +
      '</div></button>';
  }

  /* ---------- shop ---------- */
  function renderShop() {
    var cats = ['All'].concat(BRAND.cats);
    $('#shopChips').innerHTML = cats.map(function (c) {
      return '<button class="chip' + (c === state.filter ? ' on' : '') + '" data-cat="' + esc(c) + '">' + esc(c) + '</button>';
    }).join('');
    var list = state.filter === 'All' ? PRODUCTS : PRODUCTS.filter(function (p) { return p.cat === state.filter; });
    $('#shopCount').textContent = list.length + ' item' + (list.length === 1 ? '' : 's');
    $('#shopGrid').innerHTML = list.map(cardHTML).join('');
  }

  /* ---------- product sheet ---------- */
  function openSheet(id) {
    var p = byId(id); if (!p) return;
    state.current = p; state.size = null;
    $('#shGal').innerHTML = p.img.map(function (s) { return '<img src="' + s + '" alt="' + esc(p.name) + '">'; }).join('');
    $('#shName').textContent = p.name;
    $('#shCat').textContent = p.cat;
    $('#shPrice').innerHTML = money(p.price) + (p.was ? ' <s style="color:var(--dim);font-size:.8em">' + money(p.was) + '</s>' : '');
    $('#shDesc').textContent = p.desc;
    $('#shSizes').innerHTML = p.sizes.map(function (s) {
      var out = (p.out || []).indexOf(s) > -1;
      return '<button class="size' + (out ? ' out' : '') + '"' + (out ? ' disabled' : '') + ' data-size="' + esc(s) + '">' + esc(s) + '</button>';
    }).join('');
    var btn = $('#shAdd');
    btn.disabled = true; btn.textContent = 'Select a size';
    $('#scrim').classList.add('on');
    $('#sheet').classList.add('on');
    document.body.style.overflow = 'hidden';
  }
  function closeSheet() {
    $('#scrim').classList.remove('on');
    $('#sheet').classList.remove('on');
    document.body.style.overflow = '';
  }

  /* ---------- cart ---------- */
  function addToCart(p, size) {
    var key = p.id + '|' + size;
    var found = null;
    for (var i = 0; i < state.cart.length; i++) if (state.cart[i].key === key) found = state.cart[i];
    if (found) found.q++;
    else state.cart.push({ key: key, id: p.id, size: size, q: 1 });
    save(); renderBag(); updateBadges();
  }
  function cartTotals() {
    var sub = 0, n = 0;
    state.cart.forEach(function (l) { var p = byId(l.id); if (p) { sub += p.price * l.q; n += l.q; } });
    var ship = n === 0 ? 0 : (sub >= BRAND.freeShipOver ? 0 : BRAND.shipping);
    var disc = state.promo ? Math.round(sub * state.promo.pct / 100) : 0;
    return { sub: sub, ship: ship, disc: disc, n: n, total: Math.max(0, sub - disc + ship) };
  }
  function renderBag() {
    var t = cartTotals();
    if (!state.cart.length) {
      $('#bagBody').innerHTML =
        '<div class="empty">' + svg('bag') +
        '<h3>Your bag is empty</h3><p>Nothing here yet. Have a look at what just landed.</p>' +
        '<button class="btn btn-primary" data-go="shop">Browse the shop</button></div>';
      return;
    }
    var lines = state.cart.map(function (l) {
      var p = byId(l.id); if (!p) return '';
      return '<div class="line">' +
        '<img src="' + p.img[0] + '" alt="' + esc(p.name) + '">' +
        '<div><div class="nm">' + esc(p.name) + '</div>' +
          '<div class="sub">Size ' + esc(l.size) + ' · ' + esc(p.cat) + '</div>' +
          '<div class="qty"><button data-dec="' + l.key + '" aria-label="Less">−</button><span>' + l.q + '</span><button data-inc="' + l.key + '" aria-label="More">+</button></div>' +
        '</div>' +
        '<div style="text-align:right"><div class="pr">' + money(p.price * l.q) + '</div>' +
          '<button class="rm" data-rm="' + l.key + '">Remove</button></div>' +
      '</div>';
    }).join('');
    $('#bagBody').innerHTML = lines +
      '<div class="promo"><input id="promoIn" placeholder="Promo code" autocomplete="off" spellcheck="false">' +
      '<button class="btn btn-ghost btn-sm" id="promoGo" style="height:46px">Apply</button></div>' +
      '<div class="note" id="promoNote">Try <b>' + esc(BRAND.promoCode) + '</b> for ' + BRAND.promoPct + '% off.</div>' +
      '<div class="totals">' +
        '<div class="row"><span>Subtotal</span><span>' + money(t.sub) + '</span></div>' +
        (t.disc ? '<div class="row ok"><span>Discount (' + esc(state.promo.code) + ')</span><span>−' + money(t.disc) + '</span></div>' : '') +
        '<div class="row"><span>Delivery</span><span>' + (t.ship ? money(t.ship) : 'Free') + '</span></div>' +
        '<div class="row big"><span>Total</span><span>' + money(t.total) + '</span></div>' +
      '</div>' +
      '<button class="btn btn-primary btn-block" id="checkout" style="margin-top:20px">Checkout · ' + money(t.total) + '</button>' +
      '<p class="note" style="text-align:center">You will earn <b>' + Math.floor(t.total / BRAND.pointsPer) + '</b> points on this order.</p>';
  }
  function checkout() {
    var t = cartTotals();
    var items = state.cart.map(function (l) { var p = byId(l.id); return (p ? p.name : '') + ' (' + l.size + ') ×' + l.q; });
    var earned = Math.floor(t.total / BRAND.pointsPer);
    state.orders.unshift({
      id: BRAND.orderPrefix + '-' + String(1000 + Math.floor(Math.random() * 8999)),
      date: new Date().toISOString().slice(0, 10),
      items: items, total: t.total, status: 'Preparing', pts: earned
    });
    state.points += earned;
    state.cart = []; state.promo = null;
    save(); renderBag(); renderProfile(); updateBadges();
    go('profile');
    toast('Order placed · +' + earned + ' points');
  }

  /* ---------- profile / CRM ---------- */
  function renderProfile() {
    var tier = BRAND.tiers.filter(function (x) { return state.points >= x.at; }).pop() || BRAND.tiers[0];
    var next = BRAND.tiers.filter(function (x) { return x.at > state.points; })[0];
    var pct = next ? Math.round(((state.points - tier.at) / (next.at - tier.at)) * 100) : 100;
    $('#loyalPts').textContent = state.points.toLocaleString('en-US');
    $('#loyalTier').textContent = tier.name + ' member';
    $('#loyalNext').textContent = next
      ? (next.at - state.points).toLocaleString('en-US') + ' points to ' + next.name
      : 'Top tier reached — ' + tier.perk;
    $('#loyalBar').style.width = pct + '%';
    $('#tOrders').textContent = state.orders.length;
    $('#tPts').textContent = state.points.toLocaleString('en-US');
    $('#tFavs').textContent = state.favs.length;
    $('#orders').innerHTML = state.orders.length ? state.orders.map(function (o) {
      return '<div class="order"><div class="top"><span class="id">' + esc(o.id) + '</span>' +
        '<span class="st' + (o.status === 'Delivered' ? '' : ' pend') + '">' + esc(o.status) + '</span></div>' +
        '<div class="it">' + esc(o.items.join(' · ')) + '</div>' +
        '<div class="tt">' + money(o.total) + ' · ' + esc(o.date) + ' · +' + o.pts + ' pts</div></div>';
    }).join('') : '<div class="order"><div class="it">No orders yet.</div></div>';
  }

  /* ---------- badges + router ---------- */
  function updateBadges() {
    var n = cartTotals().n;
    $$('.badge').forEach(function (b) {
      b.textContent = n; b.classList.toggle('on', n > 0);
    });
  }
  var VIEWS = ['home', 'shop', 'bag', 'profile'];
  function moveInd() {
    var on = $('.tab.on'); var ind = $('#ind'); if (!on || !ind) return;
    ind.style.width = on.offsetWidth + 'px';
    ind.style.transform = 'translateX(' + on.offsetLeft + 'px)';
  }
  function go(v) {
    if (VIEWS.indexOf(v) < 0) v = 'home';
    $$('.view').forEach(function (s) { s.classList.toggle('on', s.id === 'v-' + v); });
    $$('.tab').forEach(function (t) {
      var on = t.dataset.tab === v;
      t.classList.toggle('on', on);
      t.setAttribute('aria-current', on ? 'page' : 'false');
    });
    if (location.hash !== '#/' + v) history.replaceState(null, '', '#/' + v);
    window.scrollTo(0, 0);
    document.body.classList.toggle('at-home', v === 'home');
    onScroll();
    requestAnimationFrame(moveInd);
    if (v === 'shop') { renderShop(); revealCards(); }
    if (v === 'bag') renderBag();
    if (v === 'profile') renderProfile();
  }

  /* ---------- topbar over hero ---------- */
  function onScroll() {
    var tb = $('#topbar'); if (!tb) return;
    var home = document.body.classList.contains('at-home');
    var past = window.scrollY > (window.innerHeight * 0.62);
    tb.classList.toggle('clear', home && !past);
    tb.classList.toggle('solid', window.scrollY > 8);
  }

  /* ---------- events ---------- */
  document.addEventListener('click', function (e) {
    var t = e.target.closest('[data-tab]'); if (t) { go(t.dataset.tab); return; }
    var g = e.target.closest('[data-go]'); if (g) { go(g.dataset.go); return; }
    var f = e.target.closest('[data-fav]');
    if (f) {
      e.stopPropagation(); e.preventDefault();
      var id = f.dataset.fav, i = state.favs.indexOf(id);
      if (i > -1) { state.favs.splice(i, 1); f.classList.remove('on'); }
      else { state.favs.push(id); f.classList.add('on'); toast('Saved to favourites'); }
      save(); renderProfile(); return;
    }
    var o = e.target.closest('[data-open]'); if (o) { openSheet(o.dataset.open); return; }
    var c = e.target.closest('[data-cat]'); if (c) { state.filter = c.dataset.cat; renderShop(); return; }
    var s = e.target.closest('[data-size]');
    if (s && !s.disabled) {
      $$('#shSizes .size').forEach(function (x) { x.classList.remove('on'); });
      s.classList.add('on'); state.size = s.dataset.size;
      var b = $('#shAdd'); b.disabled = false; b.textContent = 'Add to bag · ' + money(state.current.price);
      return;
    }
    if (e.target.closest('#shAdd') && state.size) {
      addToCart(state.current, state.size); closeSheet();
      toast(state.current.name + ' added to bag'); return;
    }
    if (e.target.closest('#scrim') || e.target.closest('[data-close]')) { closeSheet(); return; }
    var inc = e.target.closest('[data-inc]'), dec = e.target.closest('[data-dec]'), rm = e.target.closest('[data-rm]');
    if (inc || dec || rm) {
      var key = (inc || dec || rm).dataset.inc || (inc || dec || rm).dataset.dec || (inc || dec || rm).dataset.rm;
      for (var i = 0; i < state.cart.length; i++) {
        if (state.cart[i].key === key) {
          if (inc) state.cart[i].q++;
          else if (dec) { state.cart[i].q--; if (state.cart[i].q < 1) state.cart.splice(i, 1); }
          else state.cart.splice(i, 1);
          break;
        }
      }
      save(); renderBag(); updateBadges(); return;
    }
    if (e.target.closest('#promoGo')) {
      var v = ($('#promoIn').value || '').trim().toUpperCase();
      if (v === BRAND.promoCode) { state.promo = { code: v, pct: BRAND.promoPct }; renderBag(); toast(BRAND.promoPct + '% applied'); }
      else { $('#promoNote').innerHTML = '<span style="color:var(--warn)">That code is not valid.</span>'; }
      return;
    }
    if (e.target.closest('#checkout')) { checkout(); return; }
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeSheet(); });
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', moveInd);
  window.addEventListener('hashchange', function () { go((location.hash || '').replace('#/', '')); });

  /* ---------- install ---------- */
  var deferred = null;
  window.addEventListener('beforeinstallprompt', function (e) {
    e.preventDefault(); deferred = e;
    if (!store.get(NS + 'noinstall', false)) setTimeout(function () { $('#install').classList.add('on'); }, 3800);
  });
  document.addEventListener('click', function (e) {
    if (e.target.closest('#instGo')) {
      $('#install').classList.remove('on');
      if (deferred) { deferred.prompt(); deferred = null; }
      return;
    }
    if (e.target.closest('#instNo')) {
      $('#install').classList.remove('on'); store.set(NS + 'noinstall', true);
    }
  });
  var isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
  var standalone = window.matchMedia('(display-mode: standalone)').matches || navigator.standalone;
  if (isIOS && !standalone && !store.get(NS + 'noinstall', false)) {
    setTimeout(function () {
      var el = $('#install');
      $('#instText').innerHTML = '<b>Add ' + esc(BRAND.name) + ' to your Home Screen</b><span>Share → Add to Home Screen</span>';
      $('#instGo').textContent = 'Got it';
      el.classList.add('on');
    }, 3600);
  }


  /* ---------- card reveal (WE signature) ---------- */
  var revealIO = null, revealFail = null;
  function revealCards() {
    if (!('IntersectionObserver' in window)) return;
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (!revealIO) {
      revealIO = new IntersectionObserver(function (entries) {
        var i = 0;
        entries.forEach(function (en) {
          if (!en.isIntersecting) return;
          var el = en.target;
          revealIO.unobserve(el);
          setTimeout(function () { el.style.opacity = '1'; el.style.transform = 'none'; }, (i++) * 64);
        });
      }, { rootMargin: '0px 600px -8% 600px', threshold: 0.02 });
    }
    [].forEach.call(document.querySelectorAll('.card:not([data-rv])'), function (el) {
      el.setAttribute('data-rv', '1');
      el.style.opacity = '0';
      el.style.transform = 'translateY(0px) scale(1)';
      el.style.transition = 'opacity 520ms cubic-bezier(.45,.06,.18,1), transform 520ms cubic-bezier(.45,.06,.18,1)';
      revealIO.observe(el);
    });
    clearTimeout(revealFail);
    revealFail = setTimeout(function () {
      [].forEach.call(document.querySelectorAll('.card[data-rv]'), function (el) {
        if (getComputedStyle(el).opacity < 0.9) { el.style.opacity = '1'; el.style.transform = 'none'; }
      });
    }, 4000);
  }

  /* ---------- service worker ---------- */
  if ('serviceWorker' in navigator && location.protocol === 'https:') {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('sw.js').catch(function () {});
    });
  }

  /* ---------- boot ---------- */
  function boot() {
    $('#homeRail').innerHTML = PRODUCTS.filter(function (p) { return p.featured; }).map(cardHTML).join('');
    $('#homeGrid').innerHTML = PRODUCTS.slice(0, 4).map(cardHTML).join('');
    $('#homeChips').innerHTML = BRAND.cats.map(function (c) {
      return '<button class="chip" data-cat="' + esc(c) + '" data-go="shop">' + esc(c) + '</button>';
    }).join('');
    renderShop(); renderBag(); renderProfile(); updateBadges();
    revealCards();
    go((location.hash || '#/home').replace('#/', ''));
    setTimeout(moveInd, 60);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();

  window.__kit = { svg: svg, go: go };
})();
