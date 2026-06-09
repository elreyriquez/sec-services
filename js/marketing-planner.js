/**
 * Marketing promotion planner — parish-tiered rates, duration 4–6h.
 */
(function () {
  var PARISH_TIER = {
    kingston: "kingston",
    "st-andrew": "kingston",
    portmore: "middle",
    "spanish-town": "middle",
    linstead: "middle",
    other: "outside",
  };

  var PARISH_LABELS = {
    kingston: "Kingston",
    "st-andrew": "St Andrew",
    portmore: "Portmore",
    "spanish-town": "Spanish Town",
    linstead: "Linstead",
    other: "Other parish",
  };

  var BASE_PROMO_HOURS = 4;
  var EXTRA_HOUR_FLAT_JMD = 5000;
  var SPEAKERS_EXTRA_HOUR_JMD = 1500;

  window.SEC_MARKETING_RATES = {
    kingston: {
      label: "Around Town",
      vehicle: 40000,
      speakersBase4h: 10000,
      captureBase4h: 30000,
      hostBase4h: 20000,
      miscBlock: 10000,
      coordination: 8000,
      models: 9000,
    },
    middle: {
      label: "Neighbouring Towns",
      vehicle: 40000,
      speakersBase4h: 12000,
      captureBase4h: 30000,
      hostBase4h: 25000,
      miscBlock: 12000,
      coordination: 10000,
      models: 10000,
    },
    outside: {
      label: "Outside listed parishes",
      vehicle: 45000,
      speakersBase4h: 12000,
      captureBase4h: 35000,
      hostBase4h: 25000,
      miscBlock: 15000,
      coordination: 12000,
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

  function maxStopsForHours(hours) {
    if (hours === 4) return 2;
    if (hours === 5 || hours === 6) return 3;
    return 0;
  }

  function getStopsCount() {
    var el = document.getElementById("promo-stops");
    if (!el || !el.value) return 0;
    var n = parseInt(el.value, 10);
    return Number.isFinite(n) && n > 0 ? n : 0;
  }

  function getStopLocationsText() {
    var el = document.getElementById("promo-stop-locations");
    return el && el.value.trim() ? el.value.trim() : "";
  }

  function syncStopsField(hours) {
    var wrap = document.getElementById("promo-stops-wrap");
    var locWrap = document.getElementById("promo-stop-locations-wrap");
    var stopsEl = document.getElementById("promo-stops");
    var hint = document.getElementById("promo-stops-hint");
    if (!stopsEl) return;

    var max = maxStopsForHours(hours);
    if (!max) {
      if (wrap) wrap.hidden = true;
      if (locWrap) locWrap.hidden = true;
      stopsEl.value = "";
      return;
    }

    if (wrap) wrap.hidden = false;
    if (locWrap) locWrap.hidden = false;

    var prev = stopsEl.value;
    stopsEl.innerHTML = '<option value="">Select stops…</option>';
    for (var n = 1; n <= max; n++) {
      var opt = document.createElement("option");
      opt.value = String(n);
      opt.textContent = n === 1 ? "1 stop" : n + " stops";
      stopsEl.appendChild(opt);
    }
    if (prev && parseInt(prev, 10) <= max) stopsEl.value = prev;
    else stopsEl.value = "";

    if (hint) {
      hint.textContent =
        hours === 4
          ? "Up to 2 stops for a 4-hour promotion."
          : "Up to 3 stops for a " + hours + "-hour promotion.";
    }
  }

  function computeVehicle(tier) {
    return window.SEC_MARKETING_RATES[tier].vehicle;
  }

  /** 4h base; each additional hour adds extraPerHour (default $5,000 JMD). */
  function applyDurationToBase4h(base4h, hours, extraPerHour) {
    var h = hours >= 4 && hours <= 6 ? hours : BASE_PROMO_HOURS;
    if (h <= BASE_PROMO_HOURS) return base4h;
    var extra = extraPerHour != null ? extraPerHour : EXTRA_HOUR_FLAT_JMD;
    var total = base4h;
    if (h >= 5) total += extra;
    if (h >= 6) total += extra;
    return total;
  }

  function computeSpeakers(tier, hours) {
    return applyDurationToBase4h(
      window.SEC_MARKETING_RATES[tier].speakersBase4h,
      hours,
      SPEAKERS_EXTRA_HOUR_JMD
    );
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

  function todayDateInputValue() {
    var d = new Date();
    var y = d.getFullYear();
    var m = String(d.getMonth() + 1).padStart(2, "0");
    var day = String(d.getDate()).padStart(2, "0");
    return y + "-" + m + "-" + day;
  }

  function isPastPromoDate(value) {
    return Boolean(value) && value < todayDateInputValue();
  }

  function applyPromoDateMin() {
    var dateEl = document.getElementById("promo-date");
    if (!dateEl) return;
    dateEl.min = todayDateInputValue();
  }

  function validatePromoDateInput() {
    var dateEl = document.getElementById("promo-date");
    var msg = document.getElementById("promo-planner-msg");
    if (!dateEl || !dateEl.value) return true;
    if (!isPastPromoDate(dateEl.value)) return true;
    dateEl.value = "";
    if (msg) {
      msg.textContent = "Event date must be today or in the future.";
      msg.hidden = false;
    }
    return false;
  }

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
      date: dateEl && dateEl.value && !isPastPromoDate(dateEl.value) ? dateEl.value : "",
    };
  }

  function getPlannerState() {
    var durationEl = document.getElementById("promo-duration");
    var ctx = getParishContext();
    if (!ctx || !durationEl) return null;
    var hours = parseDuration(durationEl.value);
    if (!hours) return null;
    if (!ctx.date) return null;
    return {
      parishId: ctx.parishId,
      parishLabel: ctx.parishLabel,
      tier: ctx.tier,
      tierLabel: ctx.tierLabel,
      hours: hours,
      date: ctx.date,
      stops: getStopsCount(),
      stopLocations: getStopLocationsText(),
    };
  }

  function getDisplayHours() {
    var durationEl = document.getElementById("promo-duration");
    if (!durationEl) return DEFAULT_PREVIEW_HOURS;
    return parseDuration(durationEl.value) || DEFAULT_PREVIEW_HOURS;
  }

  function contextNotes(state, extra) {
    var parts = ["Parish: " + state.parishLabel, "Duration: " + state.hours + "h"];
    if (state.stops) parts.push("Stops: " + state.stops);
    if (state.stopLocations) parts.push("Stop locations: " + state.stopLocations);
    if (extra) parts.push(extra);
    return parts.join("; ");
  }

  function promoStateSnapshot(state) {
    return {
      parishId: state.parishId,
      parishLabel: state.parishLabel,
      tier: state.tier,
      tierLabel: state.tierLabel,
      hours: state.hours,
      stops: state.stops || 0,
      stopLocations: state.stopLocations || "",
    };
  }

  function promoCartExtras(state) {
    return {
      eventDate: state.date || "",
      promoState: promoStateSnapshot(state),
    };
  }

  function promoOnceMetaKey(state) {
    return "promo-once-" + (state.date || "undated");
  }

  function stateFromCartItem(item) {
    if (!item) return null;
    var ps = item.promoState;
    if (ps && typeof ps === "object") {
      return {
        parishId: ps.parishId,
        parishLabel: ps.parishLabel,
        tier: ps.tier,
        tierLabel: ps.tierLabel,
        hours: ps.hours,
        stops: ps.stops || 0,
        stopLocations: ps.stopLocations || "",
        date: item.eventDate || "",
      };
    }
    return null;
  }

  function promoStatesByDateFromCart() {
    var map = {};
    window.SECCart.load().forEach(function (i) {
      if (BILLABLE_PROMO_PRODUCT_IDS.indexOf(i.id) < 0) return;
      var d =
        i.eventDate ||
        (window.SECCart.itemEventDate && window.SECCart.itemEventDate(i)) ||
        "";
      if (!d) return;
      if (!map[d]) {
        var st = stateFromCartItem(i);
        if (st) map[d] = st;
      }
    });
    return map;
  }

  function activePromoOnceKeys() {
    var keys = {};
    var byDate = promoStatesByDateFromCart();
    Object.keys(byDate).forEach(function (d) {
      keys[promoOnceMetaKey(byDate[d])] = true;
    });
    return keys;
  }

  function prunePromoOnceLines() {
    var allowed = activePromoOnceKeys();
    var hasDated = Object.keys(allowed).length > 0;
    window.SECCart.load().slice().forEach(function (i) {
      if (i.id !== "mkt-promo-misc" && i.id !== "mkt-promo-coordination") return;
      var suffix = String(i.lineId || "").slice(i.id.length);
      if (suffix === "promo-quote-once" && hasDated) {
        window.SECCart.remove(i.lineId);
        return;
      }
      if (suffix.indexOf("promo-once-") === 0 && !allowed[suffix]) {
        window.SECCart.remove(i.lineId);
      }
    });
  }

  function metaKey(state, productId, suffix) {
    var key =
      productId +
      "-" +
      state.parishId +
      "-" +
      state.hours +
      (state.date ? "-" + state.date : "") +
      (state.stops ? "-stops" + state.stops : "");
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
      var coordPrice = computeCoordination(tier);
      var coordStatus = document.getElementById("promo-coordination-status");
      if (coordinationIsWaived()) {
        coordPrice = 0;
        if (coordStatus) coordStatus.textContent = "Waived on your quote.";
      } else if (cartHasBillablePromoLines()) {
        if (coordStatus) coordStatus.textContent = "Included once on your quote.";
      } else if (coordStatus) {
        coordStatus.textContent = "Added once per quote when you add promotion services.";
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
        var dateEl = document.getElementById("promo-date");
        var hasDate = dateEl && dateEl.value;
        msg.textContent = hasDate
          ? "Select promotional duration to add lines to your cart."
          : "Select an event date and promotional duration to add lines to your cart.";
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
      msg.textContent = "Select an event date and promotional duration to add lines to your cart.";
      msg.hidden = false;
    }
    return null;
  }


  var BILLABLE_PROMO_PRODUCT_IDS = [
    "mkt-promo-vehicle",
    "mkt-promo-speakers",
    "mkt-promo-capture",
    "mkt-promo-host",
    "mkt-promo-edit-video",
    "mkt-promo-models",
  ];

  function cartHasLineForState(state, productId, suffix) {
    var key = productId + metaKey(state, productId, suffix);
    return window.SECCart.load().some(function (i) {
      return i.id === productId && i.lineId === key;
    });
  }

  function cartHasCaptureForState(state) {
    return cartHasLineForState(state, "mkt-promo-capture");
  }

  function cartHasBillablePromoLines() {
    return window.SECCart.load().some(function (i) {
      return BILLABLE_PROMO_PRODUCT_IDS.indexOf(i.id) >= 0;
    });
  }

  function cartHasPromoProduct(productId) {
    return window.SECCart.load().some(function (i) {
      return i.id === productId;
    });
  }

  /** Waived only when both vehicle and capturing content are on the quote. */
  function coordinationIsWaived() {
    return cartHasPromoProduct("mkt-promo-vehicle") && cartHasPromoProduct("mkt-promo-capture");
  }

  function coordinationPriceForState(state) {
    if (coordinationIsWaived()) return 0;
    return computeCoordination(state.tier);
  }

  function removeAllCoordinationLines() {
    window.SECCart.load().slice().forEach(function (i) {
      if (i.id === "mkt-promo-coordination") {
        window.SECCart.remove(i.lineId);
      }
    });
  }

  function removeCartLinesForState(state, productId) {
    var prefix = productId + metaKey(state, productId);
    window.SECCart.load().forEach(function (i) {
      if (i.id === productId && String(i.lineId).indexOf(prefix) === 0) {
        window.SECCart.remove(i.lineId);
      }
    });
  }

  function removeAllMiscLines() {
    window.SECCart.load().slice().forEach(function (i) {
      if (i.id === "mkt-promo-misc") {
        window.SECCart.remove(i.lineId);
      }
    });
  }

  function ensureMiscInCart(state) {
    if (!cartHasBillablePromoLines()) {
      removeAllMiscLines();
      return;
    }
    var productId = "mkt-promo-misc";
    var price = computeMisc(state.tier);
    var onceKey = promoOnceMetaKey(state);
    var lineKey = productId + onceKey;
    var existing = window.SECCart.load().find(function (i) {
      return i.id === productId && i.lineId === lineKey;
    });
    if (existing && existing.price === price) return;
    if (existing) window.SECCart.remove(lineKey);
    var p = window.SEC_findProduct(productId);
    if (!p) return;
    window.SECCart.add(
      Object.assign(
        {
          id: p.id,
          name: p.name,
          price: price,
          qty: 1,
          inquire: false,
          notes: contextNotes(state),
          metaKey: onceKey,
          noMerge: false,
        },
        promoCartExtras(state)
      )
    );
  }

  function ensureCoordinationInCart(state) {
    if (!cartHasBillablePromoLines()) {
      removeAllCoordinationLines();
      return;
    }
    var productId = "mkt-promo-coordination";
    var price = coordinationPriceForState(state);
    var onceKey = promoOnceMetaKey(state);
    var lineKey = productId + onceKey;
    var existing = window.SECCart.load().find(function (i) {
      return i.id === productId && i.lineId === lineKey;
    });
    if (existing && existing.price === price) return;
    if (existing) window.SECCart.remove(lineKey);
    var p = window.SEC_findProduct(productId);
    if (!p) return;
    var extra =
      price === 0 ? "Waived — promotional vehicle and capturing content on this quote." : "";
    window.SECCart.add(
      Object.assign(
        {
          id: p.id,
          name: p.name,
          price: price,
          qty: 1,
          inquire: false,
          notes: contextNotes(state, extra),
          metaKey: onceKey,
          noMerge: false,
        },
        promoCartExtras(state)
      )
    );
  }

  function syncPromoCoordinationFromCart() {
    if (!document.getElementById("promotion-planner")) return;
    if (!cartHasBillablePromoLines()) {
      removeAllCoordinationLines();
      removeAllMiscLines();
      return;
    }
    prunePromoOnceLines();
    var byDate = promoStatesByDateFromCart();
    Object.keys(byDate).forEach(function (d) {
      ensureMiscInCart(byDate[d]);
      ensureCoordinationInCart(byDate[d]);
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
      window.SECCart.add(
        Object.assign(
          {
            id: p.id,
            name: p.name + " (included)",
            price: 0,
            qty: freeQty,
            inquire: false,
            notes: contextNotes(
              state,
              "First " + freeQty + " photo edit(s) included with capturing content."
            ),
            metaKey: metaKey(state, productId, "free"),
            noMerge: false,
          },
          promoCartExtras(state)
        )
      );
    }
    if (paidQty > 0) {
      var paidNote = hasCapture
        ? "Billable after " + FREE_PHOTOS_WITH_CAPTURE + " free photos with capture."
        : "Estimated qty: " + estQty;
      window.SECCart.add(
        Object.assign(
          {
            id: p.id,
            name: p.name,
            price: EDIT_PHOTO,
            qty: paidQty,
            inquire: false,
            notes: contextNotes(state, paidNote),
            metaKey: metaKey(state, productId, "paid"),
            noMerge: false,
          },
          promoCartExtras(state)
        )
      );
    }
  }

  function addPromoLine(productId, priceJmd, qty, extraNote) {
    var state = requireState();
    if (!state) return;
    if (!state.date) {
      var msg = document.getElementById("promo-planner-msg");
      if (msg) {
        msg.textContent = "Select an event date before adding promotion services.";
        msg.hidden = false;
      }
      return;
    }
    if (!validatePromoDateInput()) return;
    var p = window.SEC_findProduct(productId);
    if (!p) return;
    var q = qty != null ? qty : 1;
    window.SECCart.add(
      Object.assign(
        {
          id: p.id,
          name: p.name,
          price: priceJmd,
          qty: q,
          inquire: false,
          notes: contextNotes(state, extraNote),
          metaKey: metaKey(state, productId),
          noMerge: false,
        },
        promoCartExtras(state)
      )
    );
    ensureMiscInCart(state);
    ensureCoordinationInCart(state);
    ensurePhotoEditInCart(state);
    prunePromoOnceLines();
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
      if (durationEl) {
        syncStopsField(parseDuration(durationEl.value));
      }
      refreshPrices();
    }

    function onDateChange() {
      if (!validatePromoDateInput()) return;
      onFieldChange();
    }

    applyPromoDateMin();
    if (parishEl) parishEl.addEventListener("change", onFieldChange);
    if (durationEl) durationEl.addEventListener("change", onFieldChange);
    if (dateEl) {
      dateEl.addEventListener("change", onDateChange);
      dateEl.addEventListener("input", onDateChange);
    }
    if (otherEl) otherEl.addEventListener("input", onFieldChange);

    var stopsEl = document.getElementById("promo-stops");
    var stopLocationsEl = document.getElementById("promo-stop-locations");
    if (stopsEl) stopsEl.addEventListener("change", onFieldChange);
    if (stopLocationsEl) stopLocationsEl.addEventListener("input", onFieldChange);

    var photoEstEl = document.getElementById("promo-edit-photo-est-qty");
    if (photoEstEl) photoEstEl.addEventListener("input", onFieldChange);

    document.querySelectorAll(".pick-add[data-promo-line]").forEach(function (btn) {
      btn.addEventListener("click", function (e) {
        e.stopPropagation();
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
  window.addEventListener("sec-cart-updated", function () {
    syncPromoCoordinationFromCart();
    if (document.getElementById("promotion-planner")) refreshPrices();
  });
  window.SEC_marketingRefreshPrices = refreshPrices;
  window.SEC_marketingSyncPromoLines = syncPromoCoordinationFromCart;
})();
