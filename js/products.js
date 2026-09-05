/**
 * SEC services catalog (keep in sync with shaquille-freelance-rate-card.md; web care = weighted units)
 */
function SEC_usdToJmd(usd) {
  var r =
    window.SEC_CONFIG && Number(window.SEC_CONFIG.JMD_PER_USD) > 0
      ? Number(window.SEC_CONFIG.JMD_PER_USD)
      : 156;
  return Math.round(usd * r);
}

window.SEC_CATALOG = {
  production: [
    { id: "gfx-static", name: "Static graphic design (each)", price: 15000, note: "First 2 revision rounds included; extra rounds $2,000 each (JMD)." },
    { id: "gfx-motion-10", name: "Motion graphic (10 seconds)", price: 20000, note: "Includes 2 revision rounds; extra $3,000 each (JMD)." },
    { id: "gfx-motion-15", name: "Motion graphic (15 seconds)", price: 25000, note: "Includes 2 revision rounds; extra $3,000 each (JMD)." },
    { id: "gfx-motion-30", name: "Motion graphic (30 seconds)", price: 30000, note: "Includes 2 revision rounds; extra $3,000 each (JMD)." },
    { id: "vid-30", name: "Social video edit — Basic (finished 0:30)", price: 28000, note: "Basic tier: cuts, music sync, basic transitions, simple text. Two revision rounds included; extra $3,000 each (JMD)." },
    { id: "vid-60", name: "Social video edit — Basic (finished 1:00)", price: 40000, note: "Basic tier: cuts, music sync, basic transitions, simple text. Two revision rounds included; extra $3,000 each (JMD)." },
    { id: "vid-90", name: "Social video edit — Basic (finished 1:30)", price: 52000, note: "Basic tier: cuts, music sync, basic transitions, simple text. Two revision rounds included; extra $3,000 each (JMD)." },
    { id: "vid-120", name: "Social video edit — Basic (finished 2:00)", price: 70000, note: "Basic tier: cuts, music sync, basic transitions, simple text. Two revision rounds included; extra $3,000 each (JMD)." },
    { id: "vid-150", name: "Social video edit — Basic (finished 2:30)", price: 85000, note: "Basic tier: cuts, music sync, basic transitions, simple text. Two revision rounds included; extra $3,000 each (JMD)." },
    { id: "vid-180", name: "Social video edit — Basic (finished 3:00)", price: 100000, note: "Basic tier: cuts, music sync, basic transitions, simple text. Two revision rounds included; extra $3,000 each (JMD)." },
    {
      id: "vid-enhanced",
      name: "Social video edit — Enhanced",
      price: 35000,
      note: "Basic scope plus captions/subtitles, sound design, b-roll integration, branded lower thirds, simple motion inserts. Typical finished length up to 1:00; longer scoped on brief. Two revision rounds included; extra $3,000 each (JMD).",
    },
    {
      id: "vid-premium",
      name: "Social video edit — Premium",
      price: 50000,
      note: "Enhanced scope plus advanced motion/VFX, ad-style pacing, multiple export ratios or versions. Typical finished length up to 1:00; longer or campaign packages scoped on brief. Two revision rounds included; extra $3,000 each (JMD).",
    },
    { id: "vid-shoot-hr", name: "Videography — per hour (on location)", price: 15000, unit: "hour", maxQty: 4, note: "Half-day max 4 hrs ($60,000 cap, JMD). Outside Kingston & St Andrew, Portmore, Spanish Town: +15% on shoot fees only." },
  ],
  webBrandSec: [
    {
      id: "sec-foundation-home",
      name: "Custom SEC: Site Foundation + Home Page",
      price: SEC_usdToJmd(350),
      fromPrice: true,
      note: "From US$350. Website foundation and homepage for new or substantially rebuilt sites: repo/hosting connection, global styles, header, footer, navigation, responsive framework, homepage design and development, hero, sections, CTAs, mobile optimization and deployment.",
    },
    {
      id: "sec-inner-std",
      name: "Custom SEC: Additional Standard Page",
      price: SEC_usdToJmd(150),
      note: "A new responsive page within the website's established design system. Includes page layout, content sections, CTAs and mobile optimization. Complex or custom pages may require a separate quotation.",
    },
    {
      id: "sec-land-spot",
      name: "Custom SEC: Premium Hero / Landing Section",
      price: SEC_usdToJmd(130),
      note: "High-impact redesign of an existing page's hero or above-the-fold experience, including visual treatment, layout, CTA hierarchy and responsive implementation. For a section/hero enhancement, not a complete homepage redesign.",
    },
    {
      id: "sec-blog",
      name: "Custom SEC: Custom Blog Post Template",
      price: SEC_usdToJmd(120),
      note: "Design and development of a reusable blog post template within the website's existing design system. Custom functionality or advanced content structures may require a separate quotation.",
    },
    {
      id: "sec-embed",
      name: "Custom SEC: Booking System Integration",
      price: SEC_usdToJmd(150),
      note: "Integration and configuration of a scheduling or booking system within your website. Includes setup of the booking flow and implementation within the existing website design. Mandatory subscription maintenance while bookings are live; added to your quote automatically.",
    },
    {
      id: "sec-domain-setup",
      name: "Custom SEC: Domain Purchase & Setup",
      price: SEC_usdToJmd(75),
      priceSuffix: " + domain cost",
      note: "SEC procurement of the requested domain and configuration of DNS and hosting connections. Domain registration fees are billed separately based on the registrar and domain extension.",
    },
    {
      id: "sec-payment-setup",
      name: "Custom SEC: Payment System Integration",
      price: SEC_usdToJmd(150),
      note: "One-time setup and integration of a payment solution within your website. Includes implementation of the payment flow and configuration within the existing website. Payment processor fees are separate. Mandatory subscription maintenance while payments are live; added to your quote automatically.",
    },
    {
      id: "sec-booking-maint",
      name: "Booking System Maintenance",
      price: SEC_usdToJmd(20),
      recurring: true,
      note: "Required while SEC maintains the booking integration. Covers monitoring, configuration updates and minor maintenance required to keep the booking flow operational.",
    },
    {
      id: "sec-payment-maint",
      name: "Payment Integration Maintenance",
      price: SEC_usdToJmd(30),
      recurring: true,
      note: "Required while SEC maintains the payment integration. Covers monitoring, configuration updates and minor maintenance related to the website's payment functionality.",
    },
  ],
  webCarePlans: [],
  /** À la carte care work: not Light / Standard tickets (see web-services care tab). */
  webCareFixed: [
    {
      id: "care-website-eval",
      name: "Website care: Website Evaluation",
      price: SEC_usdToJmd(50),
      note: "Review of your existing website covering structure, content, usability, technical health and recommended next steps. Delivered as a written evaluation summary.",
    },
    {
      id: "care-scoped-page",
      name: "Website care: Additional Standard Page",
      price: SEC_usdToJmd(150),
      note: "A new responsive page built within the website's established design system. Includes page layout, content sections, CTAs and mobile optimization. Complex or custom pages may require a separate quotation.",
    },
    {
      id: "care-scoped-hero",
      name: "Website care: Premium Hero / Landing Section",
      price: SEC_usdToJmd(130),
      note: "High-impact redesign of an existing page's hero or above-the-fold experience. For a section/hero enhancement, not a complete homepage redesign.",
    },
  ],
  retainerWeb: [
    {
      id: "care-ess",
      name: "Website care retainer: Essential (4 web edit points + 1 developmental update / month)",
      price: SEC_usdToJmd(180),
      note: "Monthly in advance. Edit points: Light = 1, Standard = 2. One developmental update per month (see Website care on Web Services). Overage $50 per extra edit point.",
    },
    {
      id: "care-grow",
      name: "Website care retainer: Growth (8 web edit points + 2 developmental updates / month)",
      price: SEC_usdToJmd(350),
      note: "Monthly in advance. Same edit-point weights. Includes 2 developmental updates/mo. Overage same as Essential ($50 per extra edit point).",
    },
  ],
  retainerCreative: [
    {
      id: "ret-gfx-ess",
      name: "Graphic / motion / video retainer: Essential (2 static graphics, 1 motion graphic 15s, 1 social edit / mo)",
      price: 32000,
      note: "No web care points. Monthly counts: static graphics, 15s motion, social video edits; not shoot blocks. Monthly in advance; scope on agreement.",
    },
    {
      id: "ret-gfx-grow",
      name: "Graphic / motion / video retainer: Growth (4 static graphics, 2 motion graphics 15s, 2 social edits / mo)",
      price: 60000,
    },
  ],
  retainerSocialContent: [
    {
      id: "ret-soc-ess",
      name: "Social content creation retainer: Essential (2 × 1.5 hr shoots, 2 × 0:30 social edits, 1 static graphic / mo)",
      price: 50000,
      note: "Monthly in advance. On-location videography: two sessions × 1.5 hrs each (max 4 hrs/session per menu). Two finished social edits (0:30). One static graphic. +15% on shoot fees only outside Kingston & St Andrew, Portmore, Spanish Town.",
    },
    {
      id: "ret-soc-grow",
      name: "Social content creation retainer: Growth (2 × 2 hr shoots, 3 × 0:30 social edits, 1 static graphic, 1 motion 15s / mo)",
      price: 72000,
      note: "Monthly in advance. Two shoot sessions × 2 hrs each. Three social edits (0:30). One static graphic, one motion graphic (15s). Same out-of-area shoot surcharge as à la carte videography.",
    },
  ],
  retainerFullDigital: [
    {
      id: "ret-full-ess",
      name: "Full Digital retainer: Essential (4 web edit points + 1 developmental web update per month + creative bundle)",
      price: SEC_usdToJmd(310),
      note: "Monthly in advance. Web: 4 edit points per month (Light = 1, Standard = 2) + 1 developmental web update per month. Creative: 2 static graphics, 1 motion 15s, 1 social video edit per month; not pooled with web. Same developmental list as Website care Essential.",
    },
    {
      id: "ret-full-grow",
      name: "Full Digital retainer: Growth (8 web edit points + 2 developmental web updates per month + creative bundle)",
      price: SEC_usdToJmd(590),
      note: "Monthly in advance. Web: 8 edit points + 2 developmental web updates per month. Creative: 4 static graphics, 2 motion 15s, 2 social video edits per month.",
    },
  ],
  webCareTickets: {
    wix: [
      {
        id: "tick-wix-L",
        tier: "Light",
        name: "Care ticket: Light Update (builder platform)",
        price: SEC_usdToJmd(60),
        note: "Minor changes to existing website content: text, images, links, contact information, or small adjustments within existing sections.",
      },
      {
        id: "tick-wix-M",
        tier: "Standard",
        name: "Care ticket: Standard Update (builder platform)",
        price: SEC_usdToJmd(90),
        note: "Moderate updates: adding a section, creating a standard content block, adding a blog post, or several related content changes within the existing design.",
      },
    ],
    sec: [
      {
        id: "tick-sec-L",
        tier: "Light",
        name: "Care ticket: Light Update (Custom SEC)",
        price: SEC_usdToJmd(60),
        note: "Minor changes to existing website content: text, images, links, contact information, or small adjustments within existing sections.",
      },
      {
        id: "tick-sec-M",
        tier: "Standard",
        name: "Care ticket: Standard Update (Custom SEC)",
        price: SEC_usdToJmd(90),
        note: "Moderate updates: adding a section, creating a standard content block, adding a blog post, or several related content changes within the existing design.",
      },
    ],
  },
  marketingPromotion: [
    {
      id: "mkt-promo-vehicle",
      name: "Promotional vehicle and grip",
      price: 0,
    },
    {
      id: "mkt-promo-town-cryer",
      name: "Town Cryer Service",
      price: 0,
      note: "Includes the promotional vehicle, driver/grip, and a town cryer to announce along the route.",
    },
    {
      id: "mkt-promo-speakers",
      name: "Speakers",
      price: 0,
    },
    {
      id: "mkt-promo-capture",
      name: "Capturing content",
      price: 0,
      note: "Videography on promotion; first 5 photo edits included free when on quote.",
    },
    {
      id: "mkt-promo-coordination",
      name: "Promotion coordination fee",
      price: 0,
    },
    {
      id: "mkt-promo-edit-photo",
      name: "Editing content per photo",
      price: 1250,
      note: "Per photo edit; qty from estimated count on planner.",
    },
    {
      id: "mkt-promo-edit-video",
      name: "Editing content per 15s video",
      price: 10000,
      note: "Video concept must be agreed before the promotion activity.",
    },
    { id: "mkt-promo-host", name: "Host/DJ", price: 0 },
    {
      id: "mkt-promo-cooler-rect",
      name: "Medium rectangular cooler (day rental)",
      price: 0,
      note: "Day rental; one available.",
    },
    {
      id: "mkt-promo-cooler-round",
      name: "Medium round cooler (day rental)",
      price: 0,
      note: "Day rental; one available.",
    },
    {
      id: "mkt-promo-ice",
      name: "Bag of ice",
      price: 0,
      note: "Per bag. Bulk: 5% off per 5 bags, max 30%.",
    },
    {
      id: "mkt-promo-misc",
      name: "Miscellaneous (promotion support)",
      price: 0,
    },
    { id: "mkt-promo-models", name: "Promotion Ambassadors", price: 0, note: "Per promotion ambassador." },
  ],
  marketing: [
    { id: "mkt-advocacy", name: "Brand advocacy (event / presence)", price: 0, inquire: true, note: "Scoped quote after brief." },
    { id: "mkt-tee", name: "T-shirt printing (coordination / run)", price: 0, inquire: true },
    { id: "mkt-brochure", name: "Brochure printing (coordination / specs)", price: 0, inquire: true },
    { id: "mkt-runner", name: "Runner / road distribution", price: 0, inquire: true },
    { id: "mkt-ads-pilot", name: "Paid ads management", price: 0, inquire: true, note: "Scoped after brief; pilot or ongoing — final scope in writing." },
  ],
  strategy: [
    {
      id: "strat-call",
      name: "Digital marketing consultation",
      price: 5000,
      unit: "hour",
      note: "Per hour; duration confirmed on quote.",
    },
  ],
};

window.SEC_findProduct = function findProduct(id) {
  const c = window.SEC_CATALOG;
  const lists = [
    c.production,
    c.webBrandSec,
    c.webCarePlans,
    ...(c.webCareFixed ? [c.webCareFixed] : []),
    ...(c.retainerWeb ? [c.retainerWeb] : []),
    ...(c.retainerCreative ? [c.retainerCreative] : []),
    ...(c.retainerSocialContent ? [c.retainerSocialContent] : []),
    ...(c.retainerFullDigital ? [c.retainerFullDigital] : []),
    ...(c.marketingPromotion ? [c.marketingPromotion] : []),
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
