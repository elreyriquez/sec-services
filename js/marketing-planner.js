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
    other: "outside",
  };

  var PARISH_LABELS = {
    kingston: "Kingston",
    "st-andrew": "St Andrew",
    portmore: "Portmore",
    "spanish-town": "Spanish Town",
    "st-catherine": "St Catherine",
    other: "Other parish",
  };

  var BASE_PROMO_HOURS = 4;
  var EXTRA_HOUR_FLAT_JMD = 5000;

  window.SEC_MARKETING_RATES = {
    kingston: {
      label: "Around Town",
      vehicle: 40000,
      speakersBase4h: 10000,
      captureBase4h: 30000,
      hostBase4h: 20000,
      miscBlock: 10000,
      coordination: 10000,
      models: 9000,
    },
    middle: {
      label: "Neighbouring Towns",
      vehicle: 45000,
      speakersBase4h: 12000,
      captureBase4h: 30000,
      hostBase4h: 25000,
      miscBlock: 20000,
      coordination: 15000,
      models: 10000,
    },
    outside: {
      label: "Outside listed parishes",
      vehicle: 50000,
      speakersBase4h: 15000,
      captureBase4h: 35000,
      hostBase4h: 30000,
      miscBlock: 25000,
      coordination: 18000,
      models: 10000,
    },
  };

  var EDIT_PHOTO = 1250;
  var EDIT_VIDEO = 10000;
  var FREE_PHOTOS_WITH_CAPTURE = 5;

  function computeCoordination(tier) {
    return window.SEC_MARKETING_RATES[tier].coordination;
  }

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

  /** 4h base; each additional hour +$5,000 (JMD). */
  function applyDurationToBase4h(base4h, hours) {
    var h = hours >= 4 && hours <= 6 ? hours : BASE_PROMO_HOURS;
    if (h <= BASE_PROMO_HOURS) return base4h;
    var total = base4h;
    if (h >= 5) total += EXTRA_HOUR_FLAT_JMD;
    if (h >= 6) total += EXTRA_HOUR_FLAT_JMD;
    return total;
  }

  function computeSpeakers(tier, hours) {
    return applyDurationToBase4h(window.SEC_MARKETING_RATES[tier].speakersBase4h, hours);
  }

  function computeCapture(tier, hours) {
    return applyDurationToBase4h(window.SEC_MARKETING_RATES[tier].captureBase4h, hours);
  }

  function computeHost(tier, hours) {
    return applyDurationToBase4h(window.SEC_MARKETING_RATES[tier].hostBase4h, hours);
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

  var DEFAULT_PREVIEW_HOURS = 4;

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
    var coordEl = document.querySelector('[data-promo-price="coordination"]');
    if (coordEl) {
      var fullState = getPlannerState();
      var coordPrice = computeCoordination(tier);
      var coordStatus = document.getElementById("promo-coordination-status");
      if (fullState) {
        ensureCoordinationInCart(fullState);
        if (coordinationIsWaived(fullState)) {
          coordPrice = 0;
          if (coordStatus) coordStatus.textContent = "Waived on your quote.";
        } else if (coordStatus) {
          coordStatus.textContent = "Included on every promotion quote.";
        }
      } else if (coordStatus) {
        coordStatus.textContent = "Included on every promotion quote.";
      }
      updatePriceEl(coordEl, coordPrice);
      if (coordPrice === 0) coordEl.textContent = "Free";
    }
    var photoPriceEl = document.querySelector('[data-promo-price="edit-photo"]');
    if (photoPriceEl) {
      updatePriceEl(photoPriceEl, EDIT_PHOTO);
      var suffix = photoPriceEl.getAttribute("data-price-suffix") || "";
      photoPriceEl.textContent = formatPrice(EDIT_PHOTO) + suffix;
      var photoMeta = document.getElementById("promo-edit-photo-meta");
      if (photoMeta) {
        photoMeta.textContent =
          "First " +
          FREE_PHOTOS_WITH_CAPTURE +
          " photos free when capturing content is on your quote; then " +
          formatPrice(EDIT_PHOTO) +
          " per photo.";
      }
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

  function cartHasCaptureForState(state) {
    return cartHasLineForState(state, "mkt-promo-capture");
  }

  function cartHasVehicleForState(state) {
    return cartHasLineForState(state, "mkt-promo-vehicle");
  }

  /** Waived only when both vehicle and capturing content are on the quote. */
  function coordinationIsWaived(state) {
    return cartHasVehicleForState(state) && cartHasCaptureForState(state);
  }

  function coordinationPriceForState(state) {
    if (coordinationIsWaived(state)) return 0;
    return computeCoordination(state.tier);
  }

  function removeCartLinesForState(state, productId) {
    var prefix = productId + metaKey(state, productId);
    window.SECCart.load().forEach(function (i) {
      if (i.id === productId && String(i.lineId).indexOf(prefix) === 0) {
        window.SECCart.remove(i.lineId);
      }
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

  function ensureCoordinationInCart(state) {
    var productId = "mkt-promo-coordination";
    var price = coordinationPriceForState(state);
    var lineKey = productId + metaKey(state, productId);
    var existing = window.SECCart.load().find(function (i) {
      return i.lineId === lineKey;
    });
    if (existing && existing.price === price) return;
    if (existing) window.SECCart.remove(lineKey);
    var p = window.SEC_findProduct(productId);
    if (!p) return;
    var extra =
      price === 0
        ? "Waived — promotional vehicle and capturing content on this quote."
        : p.note;
    window.SECCart.add({
      id: p.id,
      name: p.name,
      price: price,
      qty: 1,
      inquire: false,
      notes: contextNotes(state, extra),
      metaKey: metaKey(state, productId),
      noMerge: false,
    });
  }

  function ensurePhotoEditInCart(state) {
    var estQty = getPhotoEstQty();
    var productId = "mkt-promo-edit-photo";
    removeCartLinesForState(state, productId);
    if (estQty < 1) return;
    var p = window.SEC_findProduct(productId);
    if (!p) return;
    var hasCapture = cartHasCaptureForState(state);
    var freeQty = hasCapture ? Math.min(estQty, FREE_PHOTOS_WITH_CAPTURE) : 0;
    var paidQty = hasCapture ? Math.max(0, estQty - FREE_PHOTOS_WITH_CAPTURE) : estQty;

    if (freeQty > 0) {
      window.SECCart.add({
        id: p.id,
        name: p.name + " (included)",
        price: 0,
        qty: freeQty,
        inquire: false,
        notes: contextNotes(
          state,
          "Estimated qty: " +
            estQty +
            "; first " +
            freeQty +
            " photo edit(s) free with capturing content."
        ),
        metaKey: metaKey(state, productId, "free"),
        noMerge: false,
      });
    }
    if (paidQty > 0) {
      window.SECCart.add({
        id: p.id,
        name: p.name,
        price: EDIT_PHOTO,
        qty: paidQty,
        inquire: false,
        notes: contextNotes(
          state,
          [
            "Estimated qty: " + estQty,
            hasCapture
              ? "Billable after " + FREE_PHOTOS_WITH_CAPTURE + " free photos with capture."
              : p.note,
          ].join("; ")
        ),
        metaKey: metaKey(state, productId, "paid"),
        noMerge: false,
      });
    }
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
    ensureCoordinationInCart(state);
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
            addPromoLine(
              productId,
              price,
              qty,
              "First " + FREE_PHOTOS_WITH_CAPTURE + " photo edits included free on this quote."
            );
            btn.classList.add("added-flash");
            setTimeout(function () {
              btn.classList.remove("added-flash");
            }, 600);
            return;
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
