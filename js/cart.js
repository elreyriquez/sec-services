(function () {
  const KEY = "sec_cart_v1";
  const DISCOUNT_KEY = "sec_cart_discount_v1";

  function load() {
    try {
      return JSON.parse(localStorage.getItem(KEY) || "[]");
    } catch {
      return [];
    }
  }

  function save(items) {
    localStorage.setItem(KEY, JSON.stringify(items));
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
    } else {
      items.push({
        lineId,
        id: item.id,
        name: item.name,
        price: item.price,
        qty: item.qty || 1,
        inquire: item.inquire,
        notes: item.notes || "",
      });
    }
    save(items);
  }

  function remove(lineId) {
    save(load().filter((i) => i.lineId !== lineId));
  }

  function subtotal() {
    return load().reduce((s, i) => {
      if (i.inquire) return s;
      const p = Number(i.price);
      const q = Number(i.qty);
      const qty = Number.isFinite(q) && q > 0 ? q : 1;
      if (!Number.isFinite(p)) return s;
      return s + p * qty;
    }, 0);
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
    count,
    getDiscount,
    setDiscount,
    clearDiscount,
    discountAmountJmd,
    subtotalAfterDiscount,
  };
})();
