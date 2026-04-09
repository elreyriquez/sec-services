(function () {
  const KEY = "sec_cart_v1";

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

  function clear() {
    save([]);
  }

  function subtotal() {
    return load().reduce((s, i) => s + (i.inquire ? 0 : (i.price || 0) * (i.qty || 1)), 0);
  }

  function count() {
    return load().reduce((n, i) => n + (i.qty || 1), 0);
  }

  window.SECCart = { load, save, add, remove, clear, subtotal, count };
})();
