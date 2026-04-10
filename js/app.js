(function () {
  const NAV_MQ = window.matchMedia("(max-width: 900px)");

  function syncSiteHeaderHeight() {
    const header = document.querySelector(".site-header");
    if (!header) return;
    document.documentElement.style.setProperty("--site-header-h", header.offsetHeight + "px");
  }

  function initNavDrawer() {
    const header = document.querySelector(".site-header");
    const toggle = document.getElementById("nav-toggle");
    const nav = document.getElementById("site-main-nav");
    if (!header || !toggle || !nav) return;

    const overlay = document.createElement("div");
    overlay.className = "nav-overlay no-print";
    overlay.setAttribute("aria-hidden", "true");
    header.parentNode.insertBefore(overlay, header.nextSibling);

    function setOpen(open) {
      const isOpen = Boolean(open);
      header.classList.toggle("is-menu-open", isOpen);
      toggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
      toggle.setAttribute("aria-label", isOpen ? "Close menu" : "Open menu");
      overlay.classList.toggle("nav-overlay--open", isOpen);
      overlay.setAttribute("aria-hidden", isOpen ? "false" : "true");
      document.body.classList.toggle("nav-drawer-open", isOpen);
      if (NAV_MQ.matches) {
        nav.setAttribute("aria-hidden", isOpen ? "false" : "true");
      } else {
        nav.removeAttribute("aria-hidden");
      }
      syncSiteHeaderHeight();
    }

    function closeIfDesktop() {
      if (!NAV_MQ.matches) setOpen(false);
    }

    toggle.addEventListener("click", function () {
      setOpen(!header.classList.contains("is-menu-open"));
    });
    overlay.addEventListener("click", function () {
      setOpen(false);
    });
    nav.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        setOpen(false);
      });
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && header.classList.contains("is-menu-open")) {
        setOpen(false);
        toggle.focus();
      }
    });
    window.addEventListener("resize", function () {
      syncSiteHeaderHeight();
      closeIfDesktop();
    });
    if (typeof NAV_MQ.addEventListener === "function") {
      NAV_MQ.addEventListener("change", closeIfDesktop);
    } else if (typeof NAV_MQ.addListener === "function") {
      NAV_MQ.addListener(closeIfDesktop);
    }

    if (NAV_MQ.matches) {
      nav.setAttribute("aria-hidden", "true");
    }

    syncSiteHeaderHeight();
  }

  function refreshBadge() {
    const el = document.getElementById("cart-badge");
    if (!el) return;
    const n = window.SECCart.count();
    el.textContent = n ? String(n) : "";
    el.hidden = !n;
  }

  /** Wix brand-journey SKUs (wix-*) vs Custom SEC build SKUs (sec-*) — mixing is usually one project / one path. */
  function cartWouldMixWixAndSecWebBuild(newId) {
    if (!newId || typeof newId !== "string") return false;
    const isWix = newId.startsWith("wix-");
    const isSec = newId.startsWith("sec-");
    if (!isWix && !isSec) return false;
    const items = window.SECCart.load();
    for (let i = 0; i < items.length; i++) {
      const oid = String(items[i].id || "");
      if (isWix && oid.startsWith("sec-")) return true;
      if (isSec && oid.startsWith("wix-")) return true;
    }
    return false;
  }

  function addProductById(id, qty, extraNotes) {
    const p = window.SEC_findProduct(id);
    if (!p) {
      console.warn("Unknown product", id);
      return;
    }
    if (cartWouldMixWixAndSecWebBuild(id)) {
      const ok = window.confirm(
        "Your cart already has items from the other website path (Wix vs Custom SEC). " +
          "Those are different delivery approaches — one project is usually one path. " +
          "Add this line anyway?"
      );
      if (!ok) return;
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
    initNavDrawer();
  });
})();
