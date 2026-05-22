/**
 * Marketing promotion planner — parish-tiered rates, duration 4–6h.
 */
(function () {
  var PARISH_TIER = {
    kingston: "kingston",
    "st-andrew": "kingston",
    portmore: "middle",
    "spanish-town": "middle",
    "st-catherine": "middle",
    clarendon: "middle",
    other: "outside",
  };

  var PARISH_LABELS = {
    kingston: "Kingston",
    "st-andrew": "St Andrew",
    portmore: "Portmore",
    "spanish-town": "Spanish Town",
    "st-catherine": "St Catherine",
    clarendon: "Clarendon",
    other: "Other parish",
  };

  window.SEC_MARKETING_RATES = {
    kingston: {
      label: "Around Town",
      vehicle: 50000,
      speakersBlock: 10000,
      speakersOvertime: 0.5,
      capturePerHour: 7500,
      captureOvertime: 0.5,
      hostPerHour: 5000,
      miscBlock: 10000,
      models: 9000,
    },
    middle: {
      label: "Neighbouring Towns",
      vehicle: 55000,
      speakersBlock: 15000,
      speakersOvertime: 0.5,
      capturePerHour: 8000,
      captureOvertime: 0.5,
      hostPerHour: 7500,
      miscBlock: 20000,
      models: 10000,
    },
    outside: {
      label: "Outside listed parishes",
      vehicle: 60000,
      speakersBlock: 18000,
      speakersOvertime: 0.5,
      capturePerHour: 8200,
      captureOvertime: 0.5,
      hostPerHour: 7800,
      miscBlock: 25000,
      models: 10000,
    },
  };

  var EDIT_PHOTO = 1250;
  var EDIT_VIDEO = 10000;

  function tierForParish(parishId) {
    return PARISH_TIER[parishId] || "outside";
  }

  function parseDuration(val) {
    var h = parseInt(val, 10);
    return h >= 4 && h <= 6 ? h : 0;
  }

  function computeVehicle(tier) {
    return window.SEC_MARKETING_RATES[tier].vehicle;
  }

  function computeSpeakers(tier, hours) {
    var r = window.SEC_MARKETING_RATES[tier];
    var base = r.speakersBlock;
    if (hours >= 6) return Math.round(base * (1 + r.speakersOvertime));
    return base;
  }

  function computeCapture(tier, hours) {
    var r = window.SEC_MARKETING_RATES[tier];
    var rate = r.capturePerHour;
    if (hours <= 5) return rate * hours;
    return Math.round(rate * 5 + rate * (1 + r.captureOvertime));
  }

  function computeHost(tier, hours) {
    return window.SEC_MARKETING_RATES[tier].hostPerHour * hours;
  }

  function computeMisc(tier) {
    return window.SEC_MARKETING_RATES[tier].miscBlock;
  }

  function getPhotoEstQty() {
    var el = document.getElementById("promo-edit-photo-est-qty");
    if (!el) return 0;
    var n = parseInt(el.value, 10);
    return Number.isFinite(n) && n > 0 ? n : 0;
  }

  function formatPrice(jmd) {
    if (window.SEC_Currency && window.SEC_Currency.formatFromJmd) {
      return window.SEC_Currency.formatFromJmd(jmd);
    }
    return "$" + Math.round(jmd).toLocaleString();
  }

  var DEFAULT_PREVIEW_HOURS = 5;

  function getParishContext() {
    var parishEl = document.getElementById("promo-parish");
    var dateEl = document.getElementById("promo-date");
    var otherEl = document.getElementById("promo-parish-other");
    if (!parishEl) return null;
    var parishId = parishEl.value;
    if (!parishId) return null;
    var parishLabel = PARISH_LABELS[parishId] || parishId;
    if (parishId === "other" && otherEl && otherEl.value.trim()) {
      parishLabel = otherEl.value.trim();
    }
    var tier = tierForParish(parishId);
    return {
      parishId: parishId,
      parishLabel: parishLabel,
      tier: tier,
      tierLabel: window.SEC_MARKETING_RATES[tier].label,
      date: dateEl && dateEl.value ? dateEl.value : "",
    };
  }

  function getPlannerState() {
    var durationEl = document.getElementById("promo-duration");
    var ctx = getParishContext();
    if (!ctx || !durationEl) return null;
    var hours = parseDuration(durationEl.value);
    if (!hours) return null;
    return {
      parishId: ctx.parishId,
      parishLabel: ctx.parishLabel,
      tier: ctx.tier,
      tierLabel: ctx.tierLabel,
      hours: hours,
      date: ctx.date,
    };
  }

  function getDisplayHours() {
    var durationEl = document.getElementById("promo-duration");
    if (!durationEl) return DEFAULT_PREVIEW_HOURS;
    return parseDuration(durationEl.value) || DEFAULT_PREVIEW_HOURS;
  }

  function contextNotes(state, extra) {
    var parts = [
      "Parish: " + state.parishLabel,
      "Duration: " + state.hours + "h",
      "Rate tier: " + state.tierLabel,
    ];
    if (state.date) parts.push("Event date: " + state.date);
    if (extra) parts.push(extra);
    return parts.join("; ");
  }

  function metaKey(state, productId, suffix) {
    var key =
      productId + "-" + state.parishId + "-" + state.hours + (state.date ? "-" + state.date : "");
    return suffix ? key + "-" + suffix : key;
  }

  window.SEC_marketingCompute = {
    tierForParish: tierForParish,
    computeVehicle: computeVehicle,
    computeSpeakers: computeSpeakers,
    computeCapture: computeCapture,
    computeHost: computeHost,
    computeMisc: computeMisc,
    editPhoto: function () {
      return EDIT_PHOTO;
    },
    editVideo: function () {
      return EDIT_VIDEO;
    },
    models: function (tier) {
      return window.SEC_MARKETING_RATES[tier].models;
    },
  };

  function updatePriceEl(el, jmd) {
    if (!el) return;
    el.setAttribute("data-jmd-amount", String(jmd));
    el.textContent = formatPrice(jmd);
    el.classList.remove("inquire");
  }

  function refreshPrices() {
    var ctx = getParishContext();
    var panel = document.getElementById("promotion-rates-panel");
    var locked = document.getElementById("promotion-planner");
    var msg = document.getElementById("promo-planner-msg");
    if (!panel) return;

    if (!ctx) {
      panel.hidden = true;
      if (locked) locked.classList.add("promotion-planner--locked");
      panel.querySelectorAll(".pick-add[data-promo-line]").forEach(function (btn) {
        btn.disabled = true;
      });
      if (msg) msg.hidden = true;
      return;
    }

    panel.hidden = false;
    panel.removeAttribute("hidden");
    if (locked) locked.classList.remove("promotion-planner--locked");

    var tier = ctx.tier;
    var h = getDisplayHours();
    var ready = Boolean(getPlannerState());

    updatePriceEl(document.querySelector('[data-promo-price="vehicle"]'), computeVehicle(tier));
    updatePriceEl(document.querySelector('[data-promo-price="speakers"]'), computeSpeakers(tier, h));
    updatePriceEl(document.querySelector('[data-promo-price="capture"]'), computeCapture(tier, h));
    updatePriceEl(document.querySelector('[data-promo-price="host"]'), computeHost(tier, h));
    updatePriceEl(document.querySelector('[data-promo-price="misc"]'), computeMisc(tier));
    var photoPriceEl = document.querySelector('[data-promo-price="edit-photo"]');
    if (photoPriceEl) {
      updatePriceEl(photoPriceEl, EDIT_PHOTO);
      var suffix = photoPriceEl.getAttribute("data-price-suffix") || "";
      photoPriceEl.textContent = formatPrice(EDIT_PHOTO) + suffix;
    }
    updatePriceEl(document.querySelector('[data-promo-price="edit-video"]'), EDIT_VIDEO);
    updatePriceEl(document.querySelector('[data-promo-price="models"]'), window.SEC_MARKETING_RATES[tier].models);

    panel.querySelectorAll(".pick-add[data-promo-line]").forEach(function (btn) {
      btn.disabled = !ready;
    });

    if (msg) {
      if (!ready) {
        msg.textContent = "Select promotional duration to add lines to your cart.";
        msg.hidden = false;
      } else {
        msg.hidden = true;
      }
    }
  }

  function requireState() {
    var state = getPlannerState();
    if (state) return state;
    var msg = document.getElementById("promo-planner-msg");
    if (msg) {
      msg.textContent = "Select promotional duration to add lines to your cart.";
      msg.hidden = false;
    }
    return null;
  }

  function cartHasLineForState(state, productId, suffix) {
    var key = productId + metaKey(state, productId, suffix);
    return window.SECCart.load().some(function (i) {
      return i.id === productId && i.lineId === key;
    });
  }

  function ensureMiscInCart(state) {
    if (cartHasLineForState(state, "mkt-promo-misc")) return;
    var p = window.SEC_findProduct("mkt-promo-misc");
    if (!p) return;
    window.SECCart.add({
      id: p.id,
      name: p.name,
      price: computeMisc(state.tier),
      qty: 1,
      inquire: false,
      notes: contextNotes(state, p.note),
      metaKey: metaKey(state, "mkt-promo-misc"),
      noMerge: false,
    });
  }

  function ensurePhotoEditInCart(state) {
    var estQty = getPhotoEstQty();
    var suffix = "est" + estQty;
    if (estQty < 1) return;
    if (cartHasLineForState(state, "mkt-promo-edit-photo", suffix)) return;
    var p = window.SEC_findProduct("mkt-promo-edit-photo");
    if (!p) return;
    window.SECCart.add({
      id: p.id,
      name: p.name,
      price: EDIT_PHOTO,
      qty: estQty,
      inquire: false,
      notes: contextNotes(state, [p.note, "Estimated qty: " + estQty].join("; ")),
      metaKey: metaKey(state, "mkt-promo-edit-photo", suffix),
      noMerge: false,
    });
  }

  function addPromoLine(productId, priceJmd, qty, extraNote) {
    var state = requireState();
    if (!state) return;
    var p = window.SEC_findProduct(productId);
    if (!p) return;
    var q = qty != null ? qty : 1;
    var notes = contextNotes(state, [p.note, extraNote].filter(Boolean).join(" "));
    window.SECCart.add({
      id: p.id,
      name: p.name,
      price: priceJmd,
      qty: q,
      inquire: false,
      notes: notes,
      metaKey: metaKey(state, productId),
      noMerge: false,
    });
    ensureMiscInCart(state);
    ensurePhotoEditInCart(state);
    var msg = document.getElementById("promo-planner-msg");
    if (msg) msg.hidden = true;
  }

  function bindPlanner() {
    var parishEl = document.getElementById("promo-parish");
    var durationEl = document.getElementById("promo-duration");
    var dateEl = document.getElementById("promo-date");
    var otherWrap = document.getElementById("promo-parish-other-wrap");
    var otherEl = document.getElementById("promo-parish-other");

    function onFieldChange() {
      if (otherWrap && parishEl) {
        otherWrap.hidden = parishEl.value !== "other";
      }
      refreshPrices();
    }

    if (parishEl) parishEl.addEventListener("change", onFieldChange);
    if (durationEl) durationEl.addEventListener("change", onFieldChange);
    if (dateEl) dateEl.addEventListener("change", onFieldChange);
    if (otherEl) otherEl.addEventListener("input", onFieldChange);

    var photoEstEl = document.getElementById("promo-edit-photo-est-qty");
    if (photoEstEl) photoEstEl.addEventListener("input", onFieldChange);

    document.querySelectorAll(".pick-add[data-promo-line]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var state = requireState();
        if (!state) return;
        var line = btn.getAttribute("data-promo-line");
        var tier = state.tier;
        var h = state.hours;
        var qty = 1;
        var row = btn.closest(".pick-row");
        var qtyInput = row && row.querySelector("[data-qty-for]");
        if (qtyInput) {
          qty = parseInt(qtyInput.value, 10) || 1;
          if (qty < 1) qty = 1;
        }

        var price = 0;
        var productId = btn.getAttribute("data-add-product");

        switch (line) {
          case "vehicle":
            price = computeVehicle(tier);
            break;
          case "speakers":
            price = computeSpeakers(tier, h);
            break;
          case "capture":
            price = computeCapture(tier, h);
            break;
          case "host":
            price = computeHost(tier, h);
            break;
          case "edit-video":
            price = EDIT_VIDEO;
            break;
          case "models":
            price = window.SEC_MARKETING_RATES[tier].models;
            break;
          default:
            return;
        }

        addPromoLine(productId, price, qty);
        btn.classList.add("added-flash");
        setTimeout(function () {
          btn.classList.remove("added-flash");
        }, 600);
      });
    });

    refreshPrices();
  }

  document.addEventListener("DOMContentLoaded", bindPlanner);
  window.addEventListener("sec-currency-changed", refreshPrices);
  window.SEC_marketingRefreshPrices = refreshPrices;
})();
