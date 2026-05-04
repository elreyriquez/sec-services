/**
 * Formspree: job requests POST from cart.html (vanilla fetch + FormData).
 * Dashboard: https://formspree.io/forms/mpqoevoy
 */
window.SEC_CONFIG = {
  FORMSPREE_ACTION: "https://formspree.io/f/mpqoevoy",
  /**
   * Software requests (software.html). If empty, uses FORMSPREE_ACTION.
   * Set a separate Formspree URL if you want these isolated from cart job requests.
   */
  FORMSPREE_SOFTWARE_ACTION: "",

  /**
   * Quote-PDF API (Express on Railway). Must match POST path in quote-pdf-service/server.js.
   * Production: dedicated API host so services.secfreelance.com can point at GitHub Pages.
   * Fallback if api subdomain not ready: https://sec-services-production.up.railway.app/api/quote-pdf
   */
  QUOTE_PDF_WEBHOOK_URL: "https://api.secfreelance.com/api/quote-pdf",
  QUOTE_PDF_WEBHOOK_SECRET:
    "d4cd8e497adb4da20548a236c319bc52946e73bf277bc72d826779471e6f7cdb",
  WHATSAPP_E164: "18763236148",
  BUSINESS_NAME: "Shaquille Comrie — SEC Freelance Services",
  CONTACT_EMAIL: "1secfreelance@gmail.com",
  /** Shown on quotation layout (human-readable). */
  CONTACT_PHONE_DISPLAY: "876-323-6148",
  /** Shown under Payment info on quotation preview / print. */
  BANK_NAME: "Scotiabank",
  BANK_ACCOUNT_NUMBER: "831701",
  BANK_ACCOUNT_NAME: "Shaquille Comrie",
  BANK_BRANCH: "Oxford Road (81505)",
  /** For USD quote view: how many JMD equal 1 USD (update to your rate). */
  JMD_PER_USD: 156,
  /**
   * SEC Billing (Next.js on Railway). No trailing slash. software.html builds Sign in as base + /login.
   * Fallback: https://billing-invoice-system-production-c173.up.railway.app
   */
  BILLING_APP_BASE: "https://billing.secfreelance.com",
  /**
   * Sign up link on software.html — SEC Billing marketing / plans (GitHub Pages on sec domain).
   */
  BILLING_SIGNUP_URL: "https://billingdetails.secfreelance.com/",
};
