/**
 * Maps client self-report to Light / Standard / Heavy (guidance only — final classification on intake).
 * Light: replace image and/or text in existing areas.
 * Standard: add section or blog post (no swap, or swaps only — user spec).
 * Heavy: combination of changes (swap) AND additions, or strong signals in description.
 */
function secEstimateCareTier({ swapImage, swapText, addSection, addBlogPost, description }) {
  const desc = (description || "").toLowerCase();
  const heavyKw = [
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
  ];
  if (heavyKw.some((k) => desc.includes(k))) {
    return { tier: "heavy", reason: "Your description suggests scope beyond a typical single-page update (e.g. new page or major rebuild). This is quoted as **Heavy** or a **new build**." };
  }

  const hasSwap = swapImage || swapText;
  const hasAdd = addSection || addBlogPost;

  if (hasSwap && hasAdd) {
    return {
      tier: "heavy",
      reason: "You selected both **content/image changes** and **new sections/content** — that usually qualifies as **Heavy** (combo of changes and additions).",
    };
  }
  if (hasAdd && !hasSwap) {
    const blogOnly = addBlogPost && !addSection;
    const sectionOnly = addSection && !addBlogPost;
    return {
      tier: "standard",
      reason: blogOnly
        ? "**Add blog post** (with no in-place image/text swaps selected) usually maps to **Standard**."
        : sectionOnly
          ? "Adding a new section (without also changing existing images/text in place) usually maps to **Standard**."
          : "Adding a section or blog post (without also changing existing images/text in place) usually maps to **Standard**.",
    };
  }
  if (hasSwap && !hasAdd) {
    return { tier: "light", reason: "Replacing pictures and/or paragraph text in existing areas usually maps to **Light**." };
  }
  return {
    tier: null,
    reason: "Select what applies above or describe the work — we’ll classify on intake.",
  };
}

function tierPrice(tier, _platform) {
  if (!tier) return null;
  /* Single à la carte JMD per tier (aligned with site guide); platform only picks product id for intake. */
  const map = { light: 9000, standard: 14000, heavy: 23000 };
  return map[tier];
}

function tierProductId(tier, platform) {
  if (!tier) return null;
  const pref = platform === "sec" ? "tick-sec" : "tick-wix";
  const suf = tier === "light" ? "L" : tier === "standard" ? "M" : "H";
  return `${pref}-${suf}`;
}

window.secEstimateCareTier = secEstimateCareTier;
window.secCareTierPrice = tierPrice;
window.secCareTierProductId = tierProductId;
