/**
 * SEC services catalog (keep in sync with shaquille-freelance-rate-card.md; web care = weighted units)
 */
window.SEC_CATALOG = {
  production: [
    { id: "gfx-static", name: "Static graphic design (each)", price: 10000, note: "First 2 revision rounds included; extra rounds $2,000 each (JMD)." },
    { id: "gfx-motion-15", name: "Motion graphic (15 seconds)", price: 15000, note: "Includes 2 revision rounds; extra $3,000 each (JMD)." },
    { id: "gfx-motion-30", name: "Motion graphic (30 seconds)", price: 20000, note: "Includes 2 revision rounds; extra $3,000 each (JMD)." },
    { id: "vid-30", name: "Video editing — finished 0:30 (social, max 3:00 policy)", price: 18000, note: "Social use; longer lengths available below." },
    { id: "vid-60", name: "Video editing — finished 1:00", price: 34000 },
    { id: "vid-90", name: "Video editing — finished 1:30", price: 50000 },
    { id: "vid-120", name: "Video editing — finished 2:00", price: 66000 },
    { id: "vid-150", name: "Video editing — finished 2:30", price: 82000 },
    { id: "vid-180", name: "Video editing — finished 3:00", price: 98000 },
    { id: "vid-shoot-hr", name: "Videography — per hour (on location)", price: 15000, unit: "hour", maxQty: 4, note: "Half-day max 4 hrs ($60,000 cap, JMD). Outside Kingston & St Andrew, Portmore, Spanish Town: +30% on shoot fees only." },
  ],
  webBrandWix: [
    { id: "wix-foundation", name: "Wix — Site foundation (new site)", price: 28000 },
    { id: "wix-home", name: "Wix — Home page", price: 38000 },
    { id: "wix-inner-std", name: "Wix — Additional Pages", price: 25000 },
    { id: "wix-land-spot", name: "Wix — Premium Landing and Hero Section Upgrade", price: 20000 },
    { id: "wix-blog", name: "Wix — Custom blog post layout (mid anchor)", price: 12500 },
    { id: "wix-embed", name: "Wix — Bookings Schedule System", price: 5000 },
  ],
  webBrandSec: [
    { id: "sec-foundation", name: "Custom SEC — Site foundation (new site)", price: 36000 },
    { id: "sec-home", name: "Custom SEC — Home page", price: 46000 },
    { id: "sec-inner-std", name: "Custom SEC — Additional Pages", price: 30000 },
    { id: "sec-land-spot", name: "Custom SEC — Premium Landing and Hero Section Upgrade", price: 20000 },
    { id: "sec-blog", name: "Custom SEC — Custom blog post layout (coded)", price: 12500, note: "Mid anchor; scope confirmed on quote." },
    { id: "sec-embed", name: "Custom SEC — Bookings Schedule System", price: 5000, note: "Scheduling / bookings integrated in build." },
  ],
  webCarePlans: [
    { id: "care-seo", name: "Website care — Search Engine Optimization", price: 12000, note: "Technical and on-page basics; scope confirmed after review." },
  ],
  retainerWeb: [
    {
      id: "care-ess",
      name: "Website care retainer — Essential (4 web edits per month)",
      price: 28000,
      note: "Monthly in advance. Each update spends units: Light 1, Standard 2, Heavy 3 (see Care tier guide). Builder overage $7,000/extra unit; Custom SEC $8,000/extra unit (JMD).",
    },
    {
      id: "care-grow",
      name: "Website care retainer — Growth (8 web edits per month)",
      price: 52000,
      note: "Monthly in advance. Units: Light 1, Standard 2, Heavy 3. Overage same as Essential.",
    },
  ],
  retainerCreative: [
    {
      id: "ret-gfx-ess",
      name: "Graphic / motion / video retainer — Essential (2 static graphics, 1 motion graphic 15s, 1 social edit / mo)",
      price: 32000,
      note: "No web care units. Monthly counts: static graphics, 15s motion, social video edits; not shoot blocks. Monthly in advance; scope on agreement.",
    },
    {
      id: "ret-gfx-grow",
      name: "Graphic / motion / video retainer — Growth (4 static graphics, 2 motion graphics 15s, 2 social edits / mo)",
      price: 60000,
    },
  ],
  retainerFullDigital: [
    {
      id: "ret-full-ess",
      name: "Full Digital retainer — Essential (4 web edits per month + 2 static graphics + 1 motion graphic 15s + 1 social edit / mo)",
      price: 48000,
      note: "Web: monthly edit budget in units (Light 1, Standard 2, Heavy 3). Creative: fixed counts/mo. Not pooled across types. Monthly in advance.",
    },
    {
      id: "ret-full-grow",
      name: "Full Digital retainer — Growth (8 web edits per month + 4 static graphics + 2 motion graphics 15s + 2 social edits / mo)",
      price: 82000,
    },
  ],
  webCareTickets: {
    wix: [
      { id: "tick-wix-L", tier: "Light", name: "Care ticket — Light (Wix / builder)", price: 8000 },
      { id: "tick-wix-M", tier: "Standard", name: "Care ticket — Standard (Wix / builder)", price: 12000 },
      { id: "tick-wix-H", tier: "Heavy", name: "Care ticket — Heavy (Wix / builder)", price: 20000 },
    ],
    sec: [
      { id: "tick-sec-L", tier: "Light", name: "Care ticket — Light (Custom SEC)", price: 9000 },
      { id: "tick-sec-M", tier: "Standard", name: "Care ticket — Standard (Custom SEC)", price: 14000 },
      { id: "tick-sec-H", tier: "Heavy", name: "Care ticket — Heavy (Custom SEC)", price: 23000 },
    ],
  },
  marketing: [
    { id: "mkt-advocacy", name: "Brand advocacy (event / presence)", price: 0, inquire: true, note: "Scoped quote after brief." },
    { id: "mkt-tee", name: "T-shirt printing (coordination / run)", price: 0, inquire: true },
    { id: "mkt-brochure", name: "Brochure printing (coordination / specs)", price: 0, inquire: true },
    { id: "mkt-runner", name: "Runner / road distribution", price: 0, inquire: true },
    { id: "mkt-ads-pilot", name: "Paid ads management", price: 0, inquire: true, note: "Scoped after brief; pilot or ongoing — final scope in writing." },
  ],
  strategy: [
    { id: "strat-call", name: "Digital marketing strategy / planning call", price: 5000, note: "Typically up to 60 minutes — confirm on quote." },
  ],
};

window.SEC_findProduct = function findProduct(id) {
  const c = window.SEC_CATALOG;
  const lists = [
    c.production,
    c.webBrandWix,
    c.webBrandSec,
    c.webCarePlans,
    ...(c.retainerWeb ? [c.retainerWeb] : []),
    ...(c.retainerCreative ? [c.retainerCreative] : []),
    ...(c.retainerFullDigital ? [c.retainerFullDigital] : []),
    c.marketing,
    c.strategy,
    ...(c.webCareTickets ? [c.webCareTickets.wix, c.webCareTickets.sec] : []),
  ];
  for (const list of lists) {
    const hit = list.find((p) => p.id === id);
    if (hit) return hit;
  }
  return null;
};
