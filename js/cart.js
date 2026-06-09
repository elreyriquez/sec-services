(function () {
  const KEY = "sec_cart_v1";
  const DISCOUNT_KEY = "sec_cart_discount_v1";

  const PROMO_COORDINATION_ID = "mkt-promo-coordination";
  const PROMO_MISC_ID = "mkt-promo-misc";
  const BILLABLE_PROMO_IDS = new Set([
    "mkt-promo-vehicle",
    "mkt-promo-speakers",
    "mkt-promo-capture",
    "mkt-promo-host",
    "mkt-promo-edit-video",
    "mkt-promo-models",
  ]);

  /** One recurring companion line per parent setup item (once per quote). */
  const RECURRING_COMPANIONS = {
    "sec-embed": { productId: "sec-booking-maint", metaKey: "recurring-for-sec-embed" },
    "sec-payment-setup": { productId: "sec-payment-maint", metaKey: "recurring-for-sec-payment-setup" },
  };

  function itemEventDate(item) {
    if (item && item.eventDate) return String(item.eventDate);
    const m = String(item && item.lineId ? item.lineId : "").match(/(\d{4}-\d{2}-\d{2})/);
    return m ? m[1] : "";
  }

  function formatEventDateLabel(isoDate) {
    if (!isoDate || !/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) return isoDate || "";
    const p = isoDate.split("-");
    return `${p[2]}.${p[1]}.${p[0]}`;
  }

  const NOTE_STRIP_PATTERNS = [
    /^Rate tier:/i,
    /^Event date:/i,
    /5-hour block/i,
    /overtime applies on 6-hour promotions/i,
    /Per hour for scheduled promotion duration/i,
    /^Per 5-hour block/i,
    /^Tiered by parish;/i,
    /^Included on every promotion quote\.?$/i,
  ];

  function displayNotes(notes) {
    if (!notes) return "";
    return String(notes)
      .split("; ")
      .map((part) => part.trim())
      .filter((part) => part && !NOTE_STRIP_PATTERNS.some((re) => re.test(part)))
      .join("; ");
  }

  function groupOneTimeByEventDate(items) {
    const dated = new Map();
    const undated = [];
    items.forEach((i) => {
      if (isRecurringItem(i)) return;
      const d = itemEventDate(i);
      if (!d) {
        undated.push(i);
        return;
      }
      if (!dated.has(d)) dated.set(d, []);
      dated.get(d).push(i);
    });
    const sorted = Array.from(dated.entries()).sort((a, b) => a[0].localeCompare(b[0]));
    return { dated: sorted, undated };
  }

  function lineTotalJmd(item) {
    if (!item || item.inquire) return 0;
    const p = Number(item.price);
    const q = Number(item.qty);
    const qty = Number.isFinite(q) && q > 0 ? q : 1;
    if (!Number.isFinite(p)) return 0;
    return p * qty;
  }

  function activePromoEventDates(items) {
    const dates = new Set();
    items.forEach((i) => {
      if (!BILLABLE_PROMO_IDS.has(i.id)) return;
      const d = itemEventDate(i);
      if (d) dates.add(d);
    });
    return dates;
  }

  function syncPromoConditionalLines() {
    const items = load();
    const hasBillable = items.some((i) => BILLABLE_PROMO_IDS.has(i.id));
    if (!hasBillable) {
      const next = items.filter((i) => i.id !== PROMO_COORDINATION_ID && i.id !== PROMO_MISC_ID);
      if (next.length !== items.length) save(next);
      return;
    }
    const dates = activePromoEventDates(items);
    const hasDated = dates.size > 0;
    const next = items.filter((i) => {
      if (i.id !== PROMO_COORDINATION_ID && i.id !== PROMO_MISC_ID) return true;
      const suffix = String(i.lineId).slice(i.id.length);
      if (suffix === "promo-quote-once" && hasDated) return false;
      if (suffix.startsWith("promo-once-")) {
        return dates.has(suffix.slice("promo-once-".length));
      }
      return true;
    });
    if (next.length !== items.length) save(next);
  }

  /** Drop legacy promo lines added without planner metaKey (duplicate of priced line). */
  function dedupePromoPlannerLines(items) {
    const promoIds = new Set([...BILLABLE_PROMO_IDS, PROMO_COORDINATION_ID, PROMO_MISC_ID, "mkt-promo-edit-photo"]);
    const hasContextLine = new Set();
    items.forEach((i) => {
      if (promoIds.has(i.id) && i.lineId && i.lineId.length > i.id.length) {
        hasContextLine.add(i.id);
      }
    });
    return items.filter((i) => {
      if (!promoIds.has(i.id)) return true;
      if (i.lineId === i.id) return !hasContextLine.has(i.id);
      return true;
    });
  }

  function syncRecurringCompanions() {
    let items = load();
    let changed = false;

    Object.keys(RECURRING_COMPANIONS).forEach(function (parentId) {
      const spec = RECURRING_COMPANIONS[parentId];
      const hasParent = items.some(function (i) {
        return i.id === parentId;
      });
      const lineKey = spec.productId + spec.metaKey;
      const idx = items.findIndex(function (i) {
        return i.lineId === lineKey;
      });

      if (hasParent && idx < 0) {
        const p = window.SEC_findProduct && window.SEC_findProduct(spec.productId);
        if (!p) return;
        items.push({
          lineId: lineKey,
          id: p.id,
          name: p.name,
          price: p.price,
          qty: 1,
          inquire: false,
          notes: p.note || "",
          recurring: true,
        });
        changed = true;
      } else if (!hasParent && idx >= 0) {
        items.splice(idx, 1);
        changed = true;
      }
    });

  /** Remove legacy duplicate recurring lines keyed by old meta patterns. */
    const allowedKeys = new Set(
      Object.keys(RECURRING_COMPANIONS).map(function (parentId) {
        return RECURRING_COMPANIONS[parentId].productId + RECURRING_COMPANIONS[parentId].metaKey;
      })
    );
    const cleaned = items.filter(function (i) {
      if (i.id !== "sec-booking-maint" && i.id !== "sec-payment-maint") return true;
      return allowedKeys.has(i.lineId);
    });
    if (cleaned.length !== items.length) {
      items = cleaned;
      changed = true;
    }

    if (changed) save(items);
  }

  function load() {
    try {
      return JSON.parse(localStorage.getItem(KEY) || "[]");
    } catch {
      return [];
    }
  }

  function save(items) {
    localStorage.setItem(KEY, JSON.stringify(dedupePromoPlannerLines(items)));
    window.dispatchEvent(new CustomEvent("sec-cart-updated"));
  }

  function add(item) {
    const items = load();
    const mergeKey = item.id + (item.metaKey || "");
    const lineId = item.inquire ? `${item.id}-${Date.now()}` : mergeKey;
    const idx = items.findIndex((i) => i.lineId === mergeKey);
    if (idx >= 0 && !item.inquire && !item.noMerge) {
      items[idx].qty = (items[idx].qty || 1) + (item.qty || 1);
      if (item.notes) items[idx].notes = (items[idx].notes || "") + (items[idx].notes ? "; " : "") + item.notes;
      if (item.recurring) items[idx].recurring = true;
      if (item.eventDate) items[idx].eventDate = item.eventDate;
      if (item.promoState) items[idx].promoState = item.promoState;
    } else {
      items.push({
        lineId,
        id: item.id,
        name: item.name,
        price: item.price,
        qty: item.qty || 1,
        inquire: item.inquire,
        notes: item.notes || "",
        recurring: Boolean(item.recurring),
        eventDate: item.eventDate || "",
        promoState: item.promoState || null,
      });
    }
    save(items);
    syncRecurringCompanions();
  }

  function remove(lineId) {
    save(load().filter((i) => i.lineId !== lineId));
    syncRecurringCompanions();
    syncPromoConditionalLines();
    if (typeof window.SEC_marketingSyncPromoLines === "function") {
      window.SEC_marketingSyncPromoLines();
    }
  }

  function oneTimeSubtotal() {
    return load().reduce((s, i) => {
      if (isRecurringItem(i)) return s;
      return s + lineTotalJmd(i);
    }, 0);
  }

  function recurringSubtotal() {
    return load().reduce((s, i) => {
      if (!isRecurringItem(i)) return s;
      return s + lineTotalJmd(i);
    }, 0);
  }

  function subtotal() {
    return oneTimeSubtotal();
  }

  function getDiscount() {
    try {
      const o = JSON.parse(localStorage.getItem(DISCOUNT_KEY) || "null");
      if (o && typeof o.code === "string" && typeof o.percent === "number") return o;
    } catch (_) {}
    return null;
  }

  function setDiscount(code, percent) {
    localStorage.setItem(DISCOUNT_KEY, JSON.stringify({ code, percent }));
    window.dispatchEvent(new CustomEvent("sec-cart-updated"));
  }

  function clearDiscount() {
    localStorage.removeItem(DISCOUNT_KEY);
    window.dispatchEvent(new CustomEvent("sec-cart-updated"));
  }

  function discountAmountJmd() {
    const d = getDiscount();
    if (!d) return 0;
    return Math.round((subtotal() * d.percent) / 100);
  }

  function subtotalAfterDiscount() {
    return Math.max(0, subtotal() - discountAmountJmd());
  }

  function count() {
    return load().reduce((n, i) => n + (i.qty || 1), 0);
  }

  function clear() {
    save([]);
    clearDiscount();
  }

  window.SECCart = {
    load,
    save,
    add,
    remove,
    clear,
    subtotal,
    oneTimeSubtotal,
    recurringSubtotal,
    isRecurringItem,
    lineTotalJmd,
    count,
    getDiscount,
    setDiscount,
    clearDiscount,
    discountAmountJmd,
    subtotalAfterDiscount,
    syncRecurringCompanions,
    syncPromoConditionalLines,
    itemEventDate,
    formatEventDateLabel,
    displayNotes,
    groupOneTimeByEventDate,
  };
})();
