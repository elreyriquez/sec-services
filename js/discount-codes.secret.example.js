/**
 * Real codes must NOT live on GitHub.
 *
 * 1. Copy this file to: js/discount-codes.secret.js
 * 2. Replace the example entries with your real codes and percentages.
 * 3. Keep discount-codes.secret.js out of version control (.gitignore).
 *
 * cart.html loads discount-codes.secret.js before discount-codes.js.
 * If the file is missing (e.g. fresh clone), discount codes are simply disabled.
 */
window.__SEC_DISCOUNT_MAP__ = window.__SEC_DISCOUNT_MAP__ || {};
Object.assign(window.__SEC_DISCOUNT_MAP__, {
  "EXAMPLE-10": 10,
  "EXAMPLE-20": 20,
});
