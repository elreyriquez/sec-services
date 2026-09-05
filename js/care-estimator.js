/**
 * Maps client self-report to Light / Standard update tickets, or flags custom quotation.
 * Light: replace image and/or text in existing areas.
 * Standard: add section or blog post, or several related content changes (including swap + add).
 * Custom: redesign, new page, ecommerce, third-party takeover, or similar out-of-ticket scope.
 */
function secEstimateCareTier({ swapImage, swapText, addSection, addBlogPost, description }) {
  const desc = (description || "").toLowerCase();
  const customKw = [
    "new page",
    "new url",
    "whole page",
    "entire page",
    "redesign",
    "multiple page",
    "e-commerce",
    "ecommerce",
    "online store",
    "new site",
    "mini project",
    "third-party",
    "third party",
    "takeover",
    "rebuild",
    "restructure",
    "custom functionality",
    "complex integration",
  ];
  if (customKw.some((k) => desc.includes(k))) {
    return {
      tier: "custom",
      reason:
        "Your description suggests scope beyond a fixed-price update ticket (e.g. redesign, new page, or complex work). This needs a **custom quotation** rather than a Light or Standard Update.",
    };
  }

  const hasSwap = swapImage || swapText;
  const hasAdd = addSection || addBlogPost;

  if (hasSwap && hasAdd) {
    return {
      tier: "standard",
      reason:
        "You selected both **content/image changes** and **new sections/content**. That usually qualifies as a **Standard Update** (several related content changes within the existing design).",
    };
  }
  if (hasAdd && !hasSwap) {
    const blogOnly = addBlogPost && !addSection;
    const sectionOnly = addSection && !addBlogPost;
    return {
      tier: "standard",
      reason: blogOnly
        ? "**Add blog post** (with no in-place image/text swaps selected) usually maps to a **Standard Update**."
        : sectionOnly
          ? "Adding a new section (without also changing existing images/text in place) usually maps to a **Standard Update**."
          : "Adding a section or blog post usually maps to a **Standard Update**.",
    };
  }
  if (hasSwap && !hasAdd) {
    return {
      tier: "light",
      reason: "Replacing pictures and/or paragraph text in existing areas usually maps to a **Light Update**.",
    };
  }
  return {
    tier: null,
    reason: "Select what applies above or describe the work. We'll classify on intake.",
  };
}

function careTicketJmd(usd) {
  var r =
    window.SEC_CONFIG && Number(window.SEC_CONFIG.JMD_PER_USD) > 0
      ? Number(window.SEC_CONFIG.JMD_PER_USD)
      : 156;
  return Math.round(usd * r);
}

function tierPrice(tier, _platform) {
  if (!tier || tier === "custom") return null;
  /* Single à la carte JMD per tier (aligned with site guide); platform only picks product id for intake. */
  const map = { light: careTicketJmd(60), standard: careTicketJmd(90) };
  return map[tier];
}

function tierProductId(tier, platform) {
  if (!tier || tier === "custom") return null;
  const pref = platform === "sec" ? "tick-sec" : "tick-wix";
  const suf = tier === "light" ? "L" : "M";
  return `${pref}-${suf}`;
}

window.secEstimateCareTier = secEstimateCareTier;
window.secCareTierPrice = tierPrice;
window.secCareTierProductId = tierProductId;
