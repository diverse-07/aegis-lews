/* ==========================================================================
   ARABIAN DROPS — site behaviour
   No framework, no build step, no backend. The catalogue below is the real
   product data read from the store's own API (names, both bottle sizes, prices,
   categories and scent notes are the brand's, not invented).
   ========================================================================== */

(function () {
  "use strict";

  var CONTACT = {
    phone: "917982561255",
    phoneDisplay: "+91 79825 61255",
    email: "info@thearabiandrops.com",
    address: "63 UB Jawahar Nagar, Kamla Nagar, Delhi 110007",
    hours: "Monday – Sunday · 10:00 AM – 9:00 PM",
    maps: "https://www.google.com/maps/search/?api=1&query=63+UB+Jawahar+Nagar+Kamla+Nagar+Delhi+110007"
  };

  /* Real catalogue. `notes` are the brand's own scent-profile words.
     Prices are per bottle size, in rupees.
     NOTE: "Wrapped in You" is categorised Men by the store but its own copy
     describes it for women — surfaced to the store rather than silently changed. */
  var PRODUCTS = [
    { id: "bad-girl-attar",      name: "Bad Girl Attar",       category: "Women",  price: { "6ml": 300, "12ml": 500 }, notes: ["Oudh", "Sweet", "Fresh", "Woody", "Citrus"], blurb: "Forbidden, sweet and irresistible." },
    { id: "diamond-touch-attar", name: "Diamond Touch Attar",  category: "Unisex", price: { "6ml": 330, "12ml": 550 }, notes: ["Sweet", "Smokey", "Musky"], blurb: "Unforgettable luxury." },
    { id: "emir-attar",          name: "Emir Attar",           category: "Men",    price: { "6ml": 300, "12ml": 550 }, notes: ["Oudh", "Spices", "Fresh", "Woody", "Citrus"], blurb: "The scent of sovereignty." },
    { id: "grace-noir-attar",    name: "Grace Noir Attar",     category: "Unisex", price: { "6ml": 300, "12ml": 550 }, notes: ["Oudh", "Kashmiri Qahwa", "Fresh", "Woody"], blurb: "Dark elegance, universal command." },
    { id: "roasted-cherry-attar",name: "Roasted Cherry Attar", category: "Unisex", price: { "6ml": 300, "12ml": 550 }, notes: ["Cherry", "Fruity", "Fresh", "Woody"], blurb: "The depth of desire." },
    { id: "s-x-with-ex-attar",   name: "S_X with Ex Attar",    category: "Unisex", price: { "6ml": 300, "12ml": 500 }, notes: ["Sweet", "Creamy", "Fresh", "Citrus"], blurb: "The addictive flashback." },
    { id: "wrapped-in-you-attar",name: "Wrapped in You Attar", category: "Men",    price: { "6ml": 300, "12ml": 500 }, notes: ["Sweet", "Fresh", "Seductive"], blurb: "The scent of seduction." },
    { id: "zoraiz-attar",        name: "Zoraiz Attar",         category: "Unisex", price: { "6ml": 300, "12ml": 550 }, notes: ["Oudh", "Aqua", "Fresh", "Woody"], blurb: "Where dawn meets depth." },
    { id: "secret-affair",       name: "Secret Affair",        category: "Unisex", price: { "6ml": 300, "12ml": 550 }, notes: ["Citrus", "Fresh", "Aqua"], blurb: "Your fresh escape." }
  ];

  var SIZES = ["6ml", "12ml"];
  var CATEGORIES = ["Unisex", "Men", "Women"];
  var FREE_DELIVERY_OVER = 999;
  var DELIVERY_FEE = 60;
  var CART_KEY = "ad:cart";
  var INTRO_KEY = "ad:intro-seen";

  /* ------------------------------------------------------------- helpers --- */

  var $  = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };

  function money(n) { return "\u20B9" + Number(n).toLocaleString("en-IN"); }

  function byId(id) {
    for (var i = 0; i < PRODUCTS.length; i++) if (PRODUCTS[i].id === id) return PRODUCTS[i];
    return null;
  }

  function img(product, n) { return "img/products/" + product.id + "-" + (n || 1) + ".webp"; }

  function fromPrice(product) { return Math.min(product.price["6ml"], product.price["12ml"]); }

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function toast(message) {
    var el = $("#toast");
    if (!el) {
      el = document.createElement("div");
      el.id = "toast";
      el.className = "toast";
      el.setAttribute("role", "status");
      el.setAttribute("aria-live", "polite");
      document.body.appendChild(el);
    }
    el.textContent = message;
    el.setAttribute("data-show", "true");
    clearTimeout(el._t);
    el._t = setTimeout(function () { el.setAttribute("data-show", "false"); }, 2600);
  }

  function waLink(message) {
    return "https://wa.me/" + CONTACT.phone + "?text=" + encodeURIComponent(message);
  }

  /* ----------------------------------------------------------------- cart ---
     Persisted in localStorage so a refresh does not lose the basket. There is
     no payment gateway here: checkout composes the order and hands it to
     WhatsApp, which is how a shop this size actually takes orders.
  ------------------------------------------------------------------------ */

  var cart = [];

  function loadCart() {
    try {
      var raw = localStorage.getItem(CART_KEY);
      cart = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(cart)) cart = [];
    } catch (e) { cart = []; }
    cart = cart.filter(function (l) { return l && byId(l.id) && SIZES.indexOf(l.size) > -1 && l.qty > 0; });
  }

  function saveCart() {
    try { localStorage.setItem(CART_KEY, JSON.stringify(cart)); } catch (e) {}
  }

  function cartCount() {
    return cart.reduce(function (n, l) { return n + l.qty; }, 0);
  }

  function cartSubtotal() {
    return cart.reduce(function (n, l) {
      var p = byId(l.id);
      return n + (p ? p.price[l.size] * l.qty : 0);
    }, 0);
  }

  function addToCart(id, size, qty) {
    var line = null;
    for (var i = 0; i < cart.length; i++) if (cart[i].id === id && cart[i].size === size) line = cart[i];
    if (line) line.qty += (qty || 1);
    else cart.push({ id: id, size: size, qty: qty || 1 });
    saveCart();
    renderCart();
    var p = byId(id);
    toast(p.name + " · " + size + " added");
  }

  function setQty(index, qty) {
    if (index < 0 || index >= cart.length) return;
    if (qty <= 0) cart.splice(index, 1);
    else cart[index].qty = qty;
    saveCart();
    renderCart();
  }

  function renderCart() {
    var body = $("#cartBody");
    var count = $("#cartCount");
    var n = cartCount();
    if (count) { count.textContent = n; count.hidden = n === 0; }

    if (!body) return;

    if (!cart.length) {
      body.innerHTML = '<p class="cart__empty">Your cart is empty. Every attar is poured by hand in Kamla Nagar — start with a 6ml and see how it wears.</p>';
    } else {
      body.innerHTML = cart.map(function (l, i) {
        var p = byId(l.id);
        return '<div class="line">' +
          '<img class="line__img" src="' + img(p) + '" alt="' + esc(p.name) + '" width="72" height="90" loading="lazy" />' +
          '<div>' +
            '<div class="line__name">' + esc(p.name) + '</div>' +
            '<div class="line__meta">' + esc(l.size) + ' &middot; non-alcoholic</div>' +
            '<div class="qty">' +
              '<button type="button" data-qty="' + i + '" data-delta="-1" aria-label="Decrease quantity of ' + esc(p.name) + '">&minus;</button>' +
              '<span>' + l.qty + '</span>' +
              '<button type="button" data-qty="' + i + '" data-delta="1" aria-label="Increase quantity of ' + esc(p.name) + '">+</button>' +
            '</div>' +
            '<button type="button" class="line__remove" data-remove="' + i + '">Remove</button>' +
          '</div>' +
          '<div class="line__price">' + money(p.price[l.size] * l.qty) + '</div>' +
        '</div>';
      }).join("");
    }

    var sub = cartSubtotal();
    var delivery = (sub === 0 || sub >= FREE_DELIVERY_OVER) ? 0 : DELIVERY_FEE;
    var set = function (sel, val) { var e = $(sel); if (e) e.textContent = val; };
    set("#cartSubtotal", money(sub));
    set("#cartDelivery", delivery === 0 ? (sub === 0 ? "—" : "Free") : money(delivery));
    set("#cartTotal", money(sub + delivery));

    var checkout = $("#cartCheckout");
    if (checkout) checkout.disabled = cart.length === 0;
    var note = $("#cartNote");
    if (note) {
      note.textContent = (sub > 0 && sub < FREE_DELIVERY_OVER)
        ? "Add " + money(FREE_DELIVERY_OVER - sub) + " for free delivery."
        : "Free delivery on orders above " + money(FREE_DELIVERY_OVER) + ".";
    }
  }

  function openPanel(which, open) {
    var panel = which === "cart" ? $("#cart") : $("#drawer");
    var scrim = $("#scrim");
    if (panel) panel.setAttribute("data-open", open ? "true" : "false");
    if (scrim) scrim.setAttribute("data-open", open ? "true" : "false");
    document.body.classList.toggle("ad-no-scroll", open);
    if (open) {
      var close = panel && panel.querySelector("[data-close]");
      if (close) close.focus();
    }
  }

  function closeAllPanels() {
    openPanel("cart", false);
    openPanel("drawer", false);
  }

  /* -------------------------------------------------------------- panels ---
     The cart and checkout drawer are injected rather than repeated in all five
     pages. They are pure UI with no SEO value, so keeping one source of truth
     beats duplicating markup that can silently drift out of sync.
  ------------------------------------------------------------------------ */

  function renderPanels() {
    var host = document.getElementById("panels");
    if (!host || host.getAttribute("data-ready") === "true") return;
    host.setAttribute("data-ready", "true");
    host.innerHTML =
      '<aside class="cart" id="cart" data-open="false" aria-label="Cart">' +
        '<div class="cart__head">' +
          '<span class="label">Your cart</span>' +
          '<button class="util" type="button" data-close>Close</button>' +
        '</div>' +
        '<div class="cart__body" id="cartBody"></div>' +
        '<div class="cart__foot">' +
          '<div class="totals"><span>Subtotal</span><span id="cartSubtotal">&#8377;0</span></div>' +
          '<div class="totals"><span>Delivery</span><span id="cartDelivery">&mdash;</span></div>' +
          '<div class="totals totals--grand"><span>Total</span><span id="cartTotal">&#8377;0</span></div>' +
          '<p style="font-size:12px;color:var(--ink-muted);margin:10px 0 14px" id="cartNote"></p>' +
          '<button class="btn btn--block" type="button" id="cartCheckout" data-checkout disabled>Checkout</button>' +
          '<p style="font-size:12px;color:var(--ink-faint);margin-top:12px">Orders are confirmed on WhatsApp &middot; Cash on delivery or UPI on confirmation</p>' +
        '</div>' +
      '</aside>' +
      '<div class="modal" id="checkout" data-open="false" role="dialog" aria-modal="true" aria-label="Checkout">' +
        '<div class="modal__panel">' +
          '<h2>Confirm your order</h2>' +
          '<p class="lede" style="font-size:14px">We confirm every order on WhatsApp before dispatching &mdash; cash on delivery, or UPI once we message you.</p>' +
          '<form id="checkoutForm" class="form-grid form-grid--2" style="margin-top:24px" onsubmit="return false">' +
            '<label class="field"><span>Full name</span><input name="name" type="text" autocomplete="name" placeholder="Your name" required /></label>' +
            '<label class="field"><span>Phone</span><input name="phone" type="tel" autocomplete="tel" placeholder="10-digit mobile" required /></label>' +
            '<label class="field span-2"><span>Delivery address</span><textarea name="address" rows="3" placeholder="House / street / area, city, pincode" required></textarea></label>' +
            '<label class="field span-2"><span>Payment</span><select name="payment"><option>Cash on delivery</option><option>UPI on WhatsApp confirmation</option></select></label>' +
          '</form>' +
          '<div id="checkoutSummary" style="margin-top:22px"></div>' +
          '<div style="display:flex;gap:12px;margin-top:22px;flex-wrap:wrap">' +
            '<button class="btn" type="button" data-place-order>Send order on WhatsApp</button>' +
            '<button class="btn btn--ghost" type="button" data-close-modal>Keep shopping</button>' +
          '</div>' +
        '</div>' +
      '</div>';
  }

  /* ------------------------------------------------------- checkout modal --- */

  function openCheckout() {
    if (!cart.length) return;
    var modal = $("#checkout");
    if (!modal) return;
    var summary = $("#checkoutSummary");
    var sub = cartSubtotal();
    var delivery = sub >= FREE_DELIVERY_OVER ? 0 : DELIVERY_FEE;
    if (summary) {
      summary.innerHTML = cart.map(function (l) {
        var p = byId(l.id);
        return '<div class="totals"><span>' + esc(p.name) + ' · ' + esc(l.size) + ' × ' + l.qty + '</span><span>' + money(p.price[l.size] * l.qty) + '</span></div>';
      }).join("") +
      '<div class="totals"><span>Delivery</span><span>' + (delivery === 0 ? "Free" : money(delivery)) + '</span></div>' +
      '<div class="totals totals--grand"><span>Total</span><span>' + money(sub + delivery) + '</span></div>';
    }
    closeAllPanels();
    modal.setAttribute("data-open", "true");
    document.body.classList.add("ad-no-scroll");
    var first = modal.querySelector("input");
    if (first) first.focus();
  }

  function placeOrder() {
    var form = $("#checkoutForm");
    if (!form) return;
    var data = new FormData(form);
    var name = (data.get("name") || "").toString().trim();
    var phone = (data.get("phone") || "").toString().trim();
    var address = (data.get("address") || "").toString().trim();
    var pay = (data.get("payment") || "Cash on delivery").toString();

    if (name.length < 2) return fieldError(form, "name", "Please enter your name.");
    if (!/^[0-9+\-\s]{10,15}$/.test(phone)) return fieldError(form, "phone", "Please enter a valid phone number.");
    if (address.length < 10) return fieldError(form, "address", "Please enter a delivery address.");

    var sub = cartSubtotal();
    var delivery = sub >= FREE_DELIVERY_OVER ? 0 : DELIVERY_FEE;
    var lines = cart.map(function (l) {
      var p = byId(l.id);
      return "• " + p.name + " — " + l.size + " × " + l.qty + " = " + money(p.price[l.size] * l.qty);
    }).join("\n");

    var message =
      "New order — Arabian Drops\n\n" + lines +
      "\n\nSubtotal: " + money(sub) +
      "\nDelivery: " + (delivery === 0 ? "Free" : money(delivery)) +
      "\nTotal: " + money(sub + delivery) +
      "\n\nName: " + name +
      "\nPhone: " + phone +
      "\nAddress: " + address +
      "\nPayment: " + pay;

    window.open(waLink(message), "_blank", "noopener");
    $("#checkout").setAttribute("data-open", "false");
    document.body.classList.remove("ad-no-scroll");
    toast("Opening WhatsApp to confirm your order");
  }

  function fieldError(form, name, message) {
    var input = form.querySelector('[name="' + name + '"]');
    if (input) {
      input.focus();
      input.style.borderColor = "#8C2F2F";
      setTimeout(function () { input.style.borderColor = ""; }, 2200);
    }
    toast(message);
  }

  /* ---------------------------------------------------------------- intro ---
     Timings are Yashel's. Three deliberate departures, each fixing a real
     problem in that build: sound is off unless opted into (browsers block audio
     before a gesture anyway), it plays once per session rather than on every
     navigation, and prefers-reduced-motion skips it entirely.
  ------------------------------------------------------------------------ */

  function initIntro() {
    var overlay = $("#intro");
    if (!overlay) return;

    var mist = $("#mist");
    var skipBtn = $("#introSkip");
    var soundBtn = $("#introSound");
    var soundLabel = $("#introSoundLabel");
    var soundGlyph = $("#introSoundGlyph");

    var AUTO_DISMISS = 3300;
    var FADE_MS = 850;
    var PARTICLE_COUNT = 32;

    var reduceMotion = false;
    try { reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (e) {}

    var soundOn = false;

    /* The synth is Yashel's, unchanged: white noise -> highpass 3kHz ->
       bandpass 6kHz (Q 0.7), gain to 0.6 in 30ms then a 1.2s exponential decay,
       with a 200Hz -> 55Hz sine pump underneath. Only ever built inside a click. */
    function playSpray() {
      try {
        var AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return;
        var ctx = new AC();
        var sr = ctx.sampleRate;
        var dur = 1.2;

        var buf = ctx.createBuffer(1, Math.floor(sr * dur), sr);
        var chan = buf.getChannelData(0);
        for (var i = 0; i < chan.length; i++) chan[i] = Math.random() * 2 - 1;

        var src = ctx.createBufferSource(); src.buffer = buf;
        var hp = ctx.createBiquadFilter(); hp.type = "highpass"; hp.frequency.value = 3000;
        var bp = ctx.createBiquadFilter(); bp.type = "bandpass"; bp.frequency.value = 6000; bp.Q.value = 0.7;
        var gain = ctx.createGain();
        gain.gain.setValueAtTime(0, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.6, ctx.currentTime + 0.03);
        gain.gain.setValueAtTime(0.6, ctx.currentTime + 0.07);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);

        var osc = ctx.createOscillator(); osc.type = "sine";
        osc.frequency.setValueAtTime(200, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(55, ctx.currentTime + 0.18);
        var og = ctx.createGain();
        og.gain.setValueAtTime(0.35, ctx.currentTime);
        og.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.22);

        src.connect(hp); hp.connect(bp); bp.connect(gain); gain.connect(ctx.destination);
        osc.connect(og); og.connect(ctx.destination);
        src.start(ctx.currentTime); osc.start(ctx.currentTime);
        src.stop(ctx.currentTime + dur); osc.stop(ctx.currentTime + 0.22);
      } catch (e) {}
    }

    if (soundBtn) {
      soundBtn.addEventListener("click", function (e) {
        e.stopPropagation();
        soundOn = !soundOn;
        soundBtn.setAttribute("aria-pressed", soundOn ? "true" : "false");
        if (soundLabel) soundLabel.textContent = soundOn ? "Sound on" : "Sound off";
        if (soundGlyph) soundGlyph.textContent = soundOn ? "\u25CF" : "\u25CB";
        if (soundOn) playSpray();
      });
    }

    function emitMist() {
      if (!mist) return;
      var frag = document.createDocumentFragment();
      for (var i = 0; i < PARTICLE_COUNT; i++) {
        var p = document.createElement("div");
        p.className = "mist__p";
        var size = 18 + Math.random() * 46;
        var angle = -90 + (Math.random() - 0.5) * 130;
        var dist = 35 + Math.random() * 130;
        var rad = angle * Math.PI / 180;
        var tx = Math.cos(rad) * dist;
        var ty = Math.sin(rad) * dist;
        var delay = 0.82 + Math.random() * 0.45;
        var dur = 0.55 + Math.random() * 0.65;
        p.style.cssText =
          "width:" + size + "px;height:" + size + "px;" +
          "left:calc(50% - " + (size / 2) + "px);top:calc(50% - " + (size / 2) + "px);" +
          "--tx:" + tx.toFixed(1) + "px;--ty:" + ty.toFixed(1) + "px;" +
          "--delay:" + delay.toFixed(2) + "s;--d:" + dur.toFixed(2) + "s;";
        frag.appendChild(p);
      }
      mist.appendChild(frag);
    }

    var autoTimer = null;
    var dismissing = false;

    function unlock() { document.body.classList.remove("ad-no-scroll"); }

    function dismiss() {
      if (dismissing) return;
      dismissing = true;
      if (autoTimer) clearTimeout(autoTimer);
      if (reduceMotion) overlay.hidden = true;
      else {
        overlay.classList.add("is-fading");
        setTimeout(function () { overlay.hidden = true; }, FADE_MS);
      }
      unlock();
      document.removeEventListener("keydown", onKeydown);
      try { sessionStorage.setItem(INTRO_KEY, "1"); } catch (e) {}
    }

    function onKeydown(e) {
      if (e.key === "Escape" || e.key === "Enter" || e.key === " ") {
        if ((e.key === " " || e.key === "Enter") && e.target !== document.body) return;
        e.preventDefault();
        dismiss();
      }
    }

    if (skipBtn) skipBtn.addEventListener("click", function (e) { e.stopPropagation(); dismiss(); });
    overlay.addEventListener("click", dismiss);

    var params = new URLSearchParams(location.search);
    var force = params.get("intro");
    var seen = false;
    try { seen = sessionStorage.getItem(INTRO_KEY) === "1"; } catch (e) {}

    var shouldShow = force === "1" ? true : force === "0" ? false : (!seen && !reduceMotion);

    if (!shouldShow) {
      overlay.hidden = true;
      unlock();
      try { sessionStorage.setItem(INTRO_KEY, "1"); } catch (e) {}
    } else {
      document.body.classList.add("ad-no-scroll");
      emitMist();
      document.addEventListener("keydown", onKeydown);
      autoTimer = setTimeout(dismiss, AUTO_DISMISS);
      if (skipBtn) skipBtn.focus({ preventScroll: true });
    }
  }

  /* --------------------------------------------------------------- render --- */

  /* The second (hover) image ships as data-hover, not src. Loading both on load
     doubled the grid's payload for an image most visitors never see — the exact
     waste this rebuild set out to remove. It is attached on first hover/focus,
     and only for devices with a real pointer. */
  function cardHTML(p, opts) {
    opts = opts || {};
    var out = p.price["6ml"] === 0;
    return '<a class="card" href="product.html?id=' + encodeURIComponent(p.id) + '" data-reveal>' +
      '<div class="card__media">' +
        (out ? '<span class="card__tag card__tag--out">Sold out</span>' : "") +
        '<img src="' + img(p, 1) + '" alt="' + esc(p.name) + '" width="640" height="800" decoding="async" loading="' + (opts.eager ? "eager" : "lazy") + '" />' +
        '<img data-hover="' + img(p, 2) + '" alt="" aria-hidden="true" width="640" height="800" decoding="async" />' +
      '</div>' +
      '<div class="card__body">' +
        '<div>' +
          '<div class="card__name">' + esc(p.name) + '</div>' +
          '<div class="card__blurb">' + esc(p.blurb) + '</div>' +
        '</div>' +
        '<div class="card__price">' + money(fromPrice(p)) + '<small>from · 6ml</small></div>' +
      '</div>' +
    '</a>';
  }

  function renderPage() {
    var page = document.body.getAttribute("data-page");

    /* ---- home: featured grid ---- */
    var featured = $("#featuredGrid");
    if (featured) {
      var picks = PRODUCTS.slice(0, 8);
      featured.innerHTML = picks.map(function (p, i) { return cardHTML(p, { eager: i < 4 }); }).join("");
    }

    /* ---- home + about: category tiles from real catalogue imagery ---- */
    var cats = $("#categoryTiles");
    if (cats) {
      cats.innerHTML = CATEGORIES.map(function (c) {
        var p = null;
        for (var i = 0; i < PRODUCTS.length; i++) if (PRODUCTS[i].category === c) { p = PRODUCTS[i]; break; }
        var count = PRODUCTS.filter(function (x) { return x.category === c; }).length;
        return '<a class="cat" href="collection.html?category=' + encodeURIComponent(c) + '">' +
          '<img src="' + img(p, 1) + '" alt="' + esc(c) + ' attars" loading="lazy" width="720" height="900" />' +
          '<div class="cat__overlay"><strong>' + esc(c) + '</strong><span>' + count + ' attar' + (count === 1 ? "" : "s") + '</span></div>' +
        '</a>';
      }).join("");
    }

    /* ---- collection: filters + grid ---- */
    var grid = $("#collectionGrid");
    if (grid) {
      var params = new URLSearchParams(location.search);
      var active = params.get("cat") || params.get("category") || "All";
      if (active !== "All" && CATEGORIES.indexOf(active) < 0) active = "All";

      var chips = $("#filterChips");
      var render = function () {
        var list = active === "All" ? PRODUCTS.slice() : PRODUCTS.filter(function (p) { return p.category === active; });
        grid.innerHTML = list.map(function (p, i) { return cardHTML(p, { eager: i < 4 }); }).join("");
        var count = $("#filterCount");
        if (count) count.textContent = list.length + (list.length === 1 ? " attar" : " attars");
        if (chips) {
          $$("button", chips).forEach(function (b) {
            b.setAttribute("aria-pressed", b.getAttribute("data-cat") === active ? "true" : "false");
          });
        }
        observeReveals(grid);
      };

      if (chips) {
        chips.innerHTML = ["All"].concat(CATEGORIES).map(function (c) {
          return '<button type="button" class="chip" data-cat="' + esc(c) + '" aria-pressed="' + (c === active ? "true" : "false") + '">' + esc(c) + "</button>";
        }).join("");
        chips.addEventListener("click", function (e) {
          var b = e.target.closest("button[data-cat]");
          if (!b) return;
          active = b.getAttribute("data-cat");
          render();
        });
      }
      render();

      var sort = $("#sortSelect");
      if (sort) {
        sort.addEventListener("change", function () {
          var v = sort.value;
          var list = active === "All" ? PRODUCTS.slice() : PRODUCTS.filter(function (p) { return p.category === active; });
          if (v === "low") list.sort(function (a, b) { return fromPrice(a) - fromPrice(b); });
          if (v === "high") list.sort(function (a, b) { return fromPrice(b) - fromPrice(a); });
          grid.innerHTML = list.map(function (p) { return cardHTML(p); }).join("");
          observeReveals(grid);
        });
      }
    }

    /* ---- product detail ---- */
    var detail = $("#productDetail");
    if (detail) {
      // Accept both /product.html?id=slug and /product/<slug>. The second form is
      // rewritten to this page by _redirects, which keeps links that pointed at
      // the old React app's /product/<mongo-id> routes from dead-ending.
      var id = new URLSearchParams(location.search).get("id");
      if (!id) {
        var segs = location.pathname.split("/").filter(Boolean);
        if (segs.length && segs[segs.length - 1].indexOf(".html") === -1) id = segs[segs.length - 1];
      }
      var p = byId(id) || PRODUCTS[0];
      document.title = p.name + " | Arabian Drops";

      var size = "6ml";
      var chosen = p.price[size];

      detail.innerHTML =
        '<div class="split">' +
          '<div class="split__media">' +
            '<img src="' + img(p, 1) + '" alt="' + esc(p.name) + '" width="720" height="900" />' +
            '<img src="' + img(p, 2) + '" alt="" aria-hidden="true" width="720" height="900" style="margin-top:12px" loading="lazy" />' +
          '</div>' +
          '<div>' +
            '<p class="label label--gold">' + esc(p.category) + ' &middot; Pure attar &middot; Non-alcoholic</p>' +
            '<h1 class="display display--sm" style="margin-top:14px">' + esc(p.name) + '</h1>' +
            '<p class="lede" style="margin-top:16px">' + esc(p.blurb) + ' A high-concentration oil, blended by hand in Kamla Nagar and poured in small batches.</p>' +
            '<div class="facts">' +
              '<div><span class="k">Notes</span><span>' + p.notes.map(esc).join(" &middot; ") + '</span></div>' +
              '<div><span class="k">Base</span><span>100% oil-based, alcohol-free</span></div>' +
              '<div><span class="k">Sizes</span><span>6ml roll-on &middot; 12ml roll-on</span></div>' +
            '</div>' +
            '<div style="margin-top:26px">' +
              '<span class="label">Bottle</span>' +
              '<div class="filters" id="sizePicker" style="margin-top:10px">' +
                SIZES.map(function (s) {
                  return '<button type="button" class="chip" data-size="' + s + '" aria-pressed="' + (s === size ? "true" : "false") + '">' +
                    s + ' &mdash; ' + money(p.price[s]) + '</button>';
                }).join("") +
              '</div>' +
            '</div>' +
            '<div style="margin-top:20px;display:flex;gap:14px;align-items:center;flex-wrap:wrap">' +
              '<div class="qty" id="pdpQty"><button type="button" data-step="-1" aria-label="Decrease quantity">&minus;</button><span>1</span><button type="button" data-step="1" aria-label="Increase quantity">+</button></div>' +
              '<button class="btn" id="pdpAdd" type="button">Add to cart &middot; <span id="pdpPrice">' + money(chosen) + '</span></button>' +
            '</div>' +
            '<p style="margin-top:16px;font-size:13px;color:var(--ink-faint)">Free delivery above ' + money(FREE_DELIVERY_OVER) + ' &middot; Cash on delivery available &middot; 7-day exchange on unopened bottles</p>' +
          '</div>' +
        '</div>';

      var qty = 1;
      var qtyEl = $("#pdpQty");

      $("#sizePicker").addEventListener("click", function (e) {
        var b = e.target.closest("button[data-size]");
        if (!b) return;
        size = b.getAttribute("data-size");
        $$("#sizePicker button").forEach(function (x) {
          x.setAttribute("aria-pressed", x.getAttribute("data-size") === size ? "true" : "false");
        });
        $("#pdpPrice").textContent = money(p.price[size]);
      });

      if (qtyEl) qtyEl.addEventListener("click", function (e) {
        var b = e.target.closest("button[data-step]");
        if (!b) return;
        qty = Math.max(1, Math.min(20, qty + Number(b.getAttribute("data-step"))));
        qtyEl.querySelector("span").textContent = qty;
      });

      $("#pdpAdd").addEventListener("click", function () { addToCart(p.id, size, qty); });

      var related = $("#relatedGrid");
      if (related) {
        related.innerHTML = PRODUCTS.filter(function (x) { return x.id !== p.id; }).slice(0, 4)
          .map(function (x) { return cardHTML(x); }).join("");
      }
    }
  }

  /* -------------------------------------------------- lazy hover gallery --- */

  function initHoverImages() {
    var canHover = false;
    try { canHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches; } catch (e) {}
    if (!canHover) return;

    function hydrate(card) {
      var alt = card.querySelector("img[data-hover]");
      if (alt) { alt.src = alt.getAttribute("data-hover"); alt.removeAttribute("data-hover"); }
    }
    // Delegated, so it keeps working after filters re-render the grid.
    document.addEventListener("mouseover", function (e) {
      var card = e.target.closest && e.target.closest(".card");
      if (card) hydrate(card);
    });
    document.addEventListener("focusin", function (e) {
      var card = e.target.closest && e.target.closest(".card");
      if (card) hydrate(card);
    });
  }

  /* --------------------------------------------------------------- reveal --- */

  var observer = null;

  function observeReveals(root) {
    var els = $$("[data-reveal]", root || document);
    if (!("IntersectionObserver" in window)) {
      els.forEach(function (el) { el.classList.add("is-visible"); });
      return;
    }
    if (!observer) {
      observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      }, { threshold: 0.1, rootMargin: "0px 0px -40px 0px" });
    }
    els.forEach(function (el) { if (!el.classList.contains("is-visible")) observer.observe(el); });
  }

  /* ----------------------------------------------------------- wire it up --- */

  function init() {
    renderPanels();
    loadCart();
    initIntro();
    renderPage();
    initHoverImages();
    renderCart();
    observeReveals();

    var header = $("#header");
    if (header) {
      window.addEventListener("scroll", function () {
        header.classList.toggle("is-stuck", window.scrollY > 20);
      }, { passive: true });
    }

    document.addEventListener("click", function (e) {
      var t = e.target;

      if (t.closest("[data-open-cart]")) { e.preventDefault(); openPanel("cart", true); return; }
      if (t.closest("[data-open-drawer]")) { e.preventDefault(); openPanel("drawer", true); return; }
      if (t.closest("[data-close]") || t.closest("#scrim")) { e.preventDefault(); closeAllPanels(); return; }
      if (t.closest("[data-checkout]")) { e.preventDefault(); openCheckout(); return; }
      if (t.closest("[data-place-order]")) { e.preventDefault(); placeOrder(); return; }
      if (t.closest("[data-close-modal]")) {
        e.preventDefault();
        var modal = $("#checkout");
        if (modal) modal.setAttribute("data-open", "false");
        document.body.classList.remove("ad-no-scroll");
        return;
      }

      var qtyBtn = t.closest("button[data-qty]");
      if (qtyBtn) {
        var i = Number(qtyBtn.getAttribute("data-qty"));
        setQty(i, (cart[i] ? cart[i].qty : 0) + Number(qtyBtn.getAttribute("data-delta")));
        return;
      }
      var rm = t.closest("button[data-remove]");
      if (rm) { setQty(Number(rm.getAttribute("data-remove")), 0); return; }
    });

    document.addEventListener("keydown", function (e) {
      if (e.key !== "Escape") return;
      closeAllPanels();
      var modal = $("#checkout");
      if (modal && modal.getAttribute("data-open") === "true") {
        modal.setAttribute("data-open", "false");
        document.body.classList.remove("ad-no-scroll");
      }
    });

    var checkoutModal = $("#checkout");
    if (checkoutModal) {
      checkoutModal.addEventListener("click", function (e) {
        if (e.target === checkoutModal) {
          checkoutModal.setAttribute("data-open", "false");
          document.body.classList.remove("ad-no-scroll");
        }
      });
    }

    /* Enquiry + subscribe forms have no server here, so they compose a
       WhatsApp message rather than pretending to post somewhere. */
    var enquiry = $("#enquiryForm");
    if (enquiry) {
      enquiry.addEventListener("submit", function (e) {
        e.preventDefault();
        var d = new FormData(enquiry);
        var name = (d.get("name") || "").toString().trim();
        var phone = (d.get("phone") || "").toString().trim();
        var message = (d.get("message") || "").toString().trim();
        if (name.length < 2) return toast("Please enter your name.");
        if (phone.length < 10) return toast("Please enter a valid phone number.");
        window.open(waLink("Enquiry from the website\n\nName: " + name + "\nPhone: " + phone + (message ? "\n\n" + message : "")), "_blank", "noopener");
        enquiry.reset();
        var msg = $("#enquiryMsg");
        if (msg) { msg.textContent = "Opening WhatsApp to send your enquiry."; msg.setAttribute("data-state", "ok"); }
      });
    }

    var subscribe = $("#subscribeForm");
    if (subscribe) {
      subscribe.addEventListener("submit", function (e) {
        e.preventDefault();
        var number = (new FormData(subscribe).get("phone") || "").toString().trim();
        var msg = $("#subscribeMsg");
        if (!/^[0-9+\-\s]{10,15}$/.test(number)) {
          if (msg) { msg.textContent = "Please enter a valid WhatsApp number."; msg.setAttribute("data-state", "err"); }
          return;
        }
        window.open(waLink("Please add me to Arabian Drops updates. My WhatsApp number: " + number), "_blank", "noopener");
        subscribe.reset();
        if (msg) { msg.textContent = "Opening WhatsApp — we'll confirm your 20% code there."; msg.setAttribute("data-state", "ok"); }
      });
    }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();

  /* Exposed for the test harness. */
  window.AD = {
    PRODUCTS: PRODUCTS,
    cart: function () { return cart.slice(); },
    addToCart: addToCart,
    clearCart: function () { cart = []; saveCart(); renderCart(); },
    money: money,
    contact: CONTACT,
    freeDeliveryOver: FREE_DELIVERY_OVER,
    deliveryFee: DELIVERY_FEE
  };
})();
