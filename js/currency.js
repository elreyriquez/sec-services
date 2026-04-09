/**
 * JMD ↔ USD display toggle (cart line items stay stored in JMD).
 * Set JMD_PER_USD in js/config.js (how many JMD equal 1 USD).
 */
(function () {
  var STORAGE_KEY = "sec_currency";

  function cfg() {
    return window.SEC_CONFIG || {};
  }

  function jmdPerUsd() {
    var v = Number(cfg().JMD_PER_USD);
    return v > 0 ? v : 156;
  }

  function get() {
    return localStorage.getItem(STORAGE_KEY) === "usd" ? "usd" : "jmd";
  }

  function set(mode) {
    var next = mode === "usd" ? "usd" : "jmd";
    if (get() === next) return;
    localStorage.setItem(STORAGE_KEY, next);
    window.dispatchEvent(new CustomEvent("sec-currency-changed"));
  }

  function formatFromJmd(amountJmd, mode) {
    var m = mode != null ? mode : get();
    var n = Number(amountJmd);
    if (isNaN(n)) return "$0";
    if (m === "usd") {
      var usd = n / jmdPerUsd();
      return (
        "$" +
        usd.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })
      );
    }
    return "$" + Math.round(n).toLocaleString();
  }

  function syncToggleUI() {
    var cur = get();
    document.querySelectorAll(".currency-toggle__btn").forEach(function (b) {
      var on = b.getAttribute("data-currency") === cur;
      b.setAttribute("aria-pressed", on ? "true" : "false");
      b.classList.toggle("is-active", on);
    });
  }

  function bindToggles() {
    document.querySelectorAll(".currency-toggle__btn").forEach(function (b) {
      b.addEventListener("click", function () {
        set(b.getAttribute("data-currency"));
      });
    });
  }

  function applyPickRows() {
    if (!window.SEC_findProduct) return;
    document.querySelectorAll(".pick-row").forEach(function (row) {
      var priceEl = row.querySelector(".pick-row__price");
      if (!priceEl || priceEl.classList.contains("inquire")) return;
      var addBtn = row.querySelector(".pick-add[data-add-product]");
      if (!addBtn) return;
      var id = addBtn.getAttribute("data-add-product");
      var p = window.SEC_findProduct(id);
      if (!p || p.inquire) return;
      var suffix = priceEl.getAttribute("data-price-suffix") || "";
      priceEl.textContent = formatFromJmd(p.price) + suffix;
    });
  }

  function applyVidEditPrice() {
    var el = document.getElementById("vid-edit-price");
    var btn = document.getElementById("vid-edit-add");
    if (!el || !btn || !window.SEC_findProduct) return;
    var id = btn.getAttribute("data-add-product");
    var p = window.SEC_findProduct(id);
    if (!p) return;
    if (p.inquire) {
      el.textContent = "Inquire";
      el.classList.add("inquire");
    } else {
      el.textContent = formatFromJmd(p.price);
      el.classList.remove("inquire");
    }
  }

  function applyFootnoteAmounts() {
    document.querySelectorAll("[data-jmd-amount]").forEach(function (el) {
      var whole = parseInt(el.getAttribute("data-jmd-amount"), 10);
      if (!isNaN(whole)) el.textContent = formatFromJmd(whole);
    });
  }

  function refreshCarePanel() {
    var box = document.getElementById("care-result");
    var priceEl = document.getElementById("care-tier-price");
    if (!box || !priceEl || box.hidden) return;
    var raw = box.getAttribute("data-estimated-jmd");
    if (raw == null || raw === "") return;
    priceEl.textContent =
      "Indicative price: " + formatFromJmd(Number(raw)) + " (care ticket)";
  }

  function applyAll() {
    applyPickRows();
    applyVidEditPrice();
    applyFootnoteAmounts();
    refreshCarePanel();
    if (typeof window.SECCart_refreshDisplay === "function") {
      window.SECCart_refreshDisplay();
    }
  }

  document.addEventListener("DOMContentLoaded", function () {
    bindToggles();
    syncToggleUI();
    applyAll();
  });

  window.addEventListener("sec-currency-changed", function () {
    syncToggleUI();
    applyAll();
  });

  window.SEC_Currency = {
    get: get,
    set: set,
    formatFromJmd: formatFromJmd,
    applyAll: applyAll,
    applyPickRows: applyPickRows,
    applyVidEditPrice: applyVidEditPrice,
    jmdPerUsd: jmdPerUsd,
    syncToggleUI: syncToggleUI,
  };
})();
