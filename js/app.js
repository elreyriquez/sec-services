(function () {
  function refreshBadge() {
    const el = document.getElementById("cart-badge");
    if (!el) return;
    const n = window.SECCart.count();
    el.textContent = n ? String(n) : "";
    el.hidden = !n;
  }

  function addProductById(id, qty, extraNotes) {
    const p = window.SEC_findProduct(id);
    if (!p) {
      console.warn("Unknown product", id);
      return;
    }
    let q = qty != null ? qty : 1;
    if (p.maxQty && q > p.maxQty) q = p.maxQty;
    window.SECCart.add({
      id: p.id,
      name: p.name,
      price: p.price,
      qty: q,
      inquire: p.inquire,
      notes: [p.note, extraNotes].filter(Boolean).join(" "),
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll("[data-add-product]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-add-product");
        const qtyInput = btn.closest(".pick-row, .product-card, .product-row, li")?.querySelector("[data-qty-for]");
        let qty = 1;
        if (qtyInput) {
          qty = parseInt(qtyInput.value, 10) || 1;
        } else if (btn.dataset.qty) {
          qty = parseInt(btn.dataset.qty, 10) || 1;
        }
        const p = window.SEC_findProduct(id);
        if (p && p.maxQty && qty > p.maxQty) {
          alert("Half-day maximum is " + p.maxQty + " hours for videography.");
          qty = p.maxQty;
        }
        addProductById(id, qty);
        btn.classList.add("added-flash");
        setTimeout(() => btn.classList.remove("added-flash"), 600);
      });
    });
    refreshBadge();
    window.addEventListener("sec-cart-updated", refreshBadge);
    window.SEC_addProductById = addProductById;
  });
})();
