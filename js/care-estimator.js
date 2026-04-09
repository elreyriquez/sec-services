/**
 * Maps client self-report to Light / Standard / Heavy (guidance only — final classification on intake).
 * Light: replace image and/or text in existing areas.
 * Standard: add section or add content (no swap, or swaps only — user spec).
 * Heavy: combination of changes (swap) AND additions, or strong signals in description.
 */
function secEstimateCareTier({ swapImage, swapText, addSection, addContent, description }) {
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
  const hasAdd = addSection || addContent;

  if (hasSwap && hasAdd) {
    return {
      tier: "heavy",
      reason: "You selected both **content/image changes** and **new sections/content** — that usually qualifies as **Heavy** (combo of changes and additions).",
    };
  }
  if (hasAdd && !hasSwap) {
    return { tier: "standard", reason: "Adding sections or new content (without also changing existing images/text in place) usually maps to **Standard**." };
  }
  if (hasSwap && !hasAdd) {
    return { tier: "light", reason: "Replacing pictures and/or paragraph text in existing areas usually maps to **Light**." };
  }
  return {
    tier: null,
    reason: "Select what applies above or describe the work — we’ll classify on intake.",
  };
}

function tierPrice(tier, platform) {
  if (!tier) return null;
  const map =
    platform === "sec"
      ? { light: 9000, standard: 14000, heavy: 23000 }
      : { light: 8000, standard: 12000, heavy: 20000 };
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
