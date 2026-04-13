/**
 * Formspree: job requests POST from cart.html (vanilla fetch + FormData).
 * Dashboard: https://formspree.io/forms/mpqoevoy
 */
window.SEC_CONFIG = {
  FORMSPREE_ACTION: "https://formspree.io/f/mpqoevoy",
  WHATSAPP_E164: "18763236158",
  BUSINESS_NAME: "Shaquille Comrie — SEC Freelance Services",
  CONTACT_EMAIL: "shaqcomrie@gmail.com",
  /** Shown on quotation layout (human-readable). */
  CONTACT_PHONE_DISPLAY: "876-323-6158",
  /** Shown under Payment info on quotation preview / print. */
  BANK_NAME: "Scotiabank",
  BANK_ACCOUNT_NUMBER: "831701",
  BANK_ACCOUNT_NAME: "Shaquille Comrie",
  BANK_BRANCH: "Oxford Road (81505)",
  /** For USD quote view: how many JMD equal 1 USD (update to your rate). */
  JMD_PER_USD: 156,
  /**
   * SEC Billing (Next.js app). Public site root URL, no trailing slash.
   * Used on software.html for Sign in, Pricing, and Create account.
   * Local testing: keep http://127.0.0.1:3000 while billing-invoice-system runs (npm run dev).
   * Before you deploy sec-services to the public web, set this to your live billing host
   * (for example https://your-app.up.railway.app) so visitors are not sent to localhost.
   */
  BILLING_APP_BASE: "http://127.0.0.1:3000",
};
