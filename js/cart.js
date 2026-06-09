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

  function isRecurringItem(item) {
    return Boolean(item && item.recurring);
  }

  function lineTotalJmd(item) {
    if (!item || item.inquire) return 0;
    const p = Number(item.price);
    const q = Number(item.qty);
    const qty = Number.isFinite(q) && q > 0 ? q : 1;
    if (!Number.isFinite(p)) return 0;
    return p * qty;
  }

  function syncPromoConditionalLines() {
    const items = load();
    if (items.some((i) => BILLABLE_PROMO_IDS.has(i.id))) return;
    const next = items.filter((i) => i.id !== PROMO_COORDINATION_ID && i.id !== PROMO_MISC_ID);
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
      });
    }
    save(items);
    syncRecurringCompanions();
  }

  function remove(lineId) {
    save(load().filter((i) => i.lineId !== lineId));
    syncRecurringCompanions();
    syncPromoConditionalLines();
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
  };
})();
