/**
 * Cart discount validation — codes come from window.__SEC_DISCOUNT_MAP__ (see
 * discount-codes.secret.example.js). Do not commit real codes to git.
 */
(function () {
  var MAP = {};

  function mergeFrom(src) {
    if (!src || typeof src !== "object") return;
    Object.keys(src).forEach(function (k) {
      var pct = Number(src[k]);
      if (!isNaN(pct) && pct > 0) {
        var key = String(k)
          .trim()
          .toUpperCase()
          .replace(/\s+/g, "");
        if (key) MAP[key] = pct;
      }
    });
  }

  mergeFrom(window.__SEC_DISCOUNT_MAP__);

  function normalize(code) {
    return String(code || "")
      .trim()
      .toUpperCase()
      .replace(/\s+/g, "");
  }

  window.SEC_validateDiscountCode = function validateDiscountCode(code) {
    var c = normalize(code);
    var pct = MAP[c];
    if (pct == null) return null;
    return { code: c, percent: pct };
  };
})();
