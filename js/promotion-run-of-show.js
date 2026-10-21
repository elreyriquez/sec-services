/**
 * Promotion run-of-show planner: turns a promotion quote plus a few operational
 * answers into a schedule, route, roles, safety notes and an editable checklist.
 */
(function () {
  var STATE_KEY = "sec_promo_run_of_show_v1";
  var SOURCE_KEY = "sec_promo_plan_source_v1";
  var CONTACT_KEY = "sec_cart_contact_v1";

  var PLANNABLE_IDS = [
    "mkt-promo-vehicle",
    "mkt-promo-town-cryer",
    "mkt-promo-speakers",
    "mkt-promo-capture",
    "mkt-promo-host",
    "mkt-promo-models",
    "mkt-promo-cooler-rect",
    "mkt-promo-cooler-round",
    "mkt-promo-ice",
  ];

  var PACK_DOWN_MIN = 15;
  var LOAD_OUT_MIN = 45;
  var MAX_STOPS = 6;

  var STEPS = [
    { id: "quote", title: "Confirm the quote" },
    { id: "format", title: "Format and handouts" },
    { id: "stops", title: "Stops, order and travel" },
    { id: "clock", title: "Clock and constraints" },
    { id: "gear", title: "Gear checklist" },
    { id: "review", title: "Review and download" },
  ];

  var FORMAT_OPTIONS = [
    { value: "traffic-sampling", label: "In-traffic sampling" },
    { value: "traffic-flyers", label: "In-traffic flyers only" },
    { value: "stationary", label: "Stationary activation" },
    { value: "mix", label: "Mix of in-traffic and stationary" },
  ];

  var HANDOUT_OPTIONS = [
    { value: "samples", label: "Product samples" },
    { value: "flyers", label: "Flyers / promotional material" },
    { value: "both", label: "Samples and flyers" },
    { value: "other", label: "Other" },
  ];

  var GROUP_LABELS = {
    requested: "Requested / on the quote",
    suggested: "Suggested additions",
    edit: "Content capture and edits",
  };

  /* ─── helpers ─────────────────────────────────────────── */

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function readJson(key, fallback) {
    try {
      var raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
      return fallback;
    }
  }

  function writeJson(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      /* storage full or unavailable */
    }
  }

  function clampInt(v, min, max, fallback) {
    var n = parseInt(v, 10);
    if (!Number.isFinite(n)) return fallback;
    return Math.min(max, Math.max(min, n));
  }

  function parseTime(t) {
    var m = /^(\d{1,2}):(\d{2})$/.exec(String(t || "").trim());
    if (!m) return null;
    var h = Number(m[1]);
    var min = Number(m[2]);
    if (h > 23 || min > 59) return null;
    return h * 60 + min;
  }

  function fmtTime(mins) {
    var total = ((Math.round(mins) % 1440) + 1440) % 1440;
    var h = Math.floor(total / 60);
    var m = total % 60;
    var suffix = h < 12 ? " am" : "";
    var hh = h % 12 === 0 ? 12 : h % 12;
    return hh + ":" + String(m).padStart(2, "0") + suffix;
  }

  function fmtDuration(mins) {
    var h = Math.floor(mins / 60);
    var m = mins % 60;
    if (!h) return m + " min";
    return h + " h" + (m ? " " + m + " min" : "");
  }

  function longDate(iso) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(iso || "")) return iso || "Date to be confirmed";
    var p = iso.split("-").map(Number);
    return new Date(p[0], p[1] - 1, p[2]).toLocaleDateString("en-GB", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }

  function itemDate(item) {
    if (window.SECCart && SECCart.itemEventDate) return SECCart.itemEventDate(item);
    return (item && item.eventDate) || "";
  }

  function maxStopsForHours(hours) {
    if (hours <= 4) return 2;
    if (hours <= 6) return 3;
    return MAX_STOPS;
  }

  /* ─── quote source ────────────────────────────────────── */

  function hasPlannable(items) {
    return (items || []).some(function (i) {
      return PLANNABLE_IDS.indexOf(i.id) !== -1;
    });
  }

  function loadSource() {
    var live = window.SECCart ? SECCart.load() : [];
    var contact = readJson(CONTACT_KEY, {}) || {};
    if (hasPlannable(live)) return { items: live, contact: contact };
    var snap = readJson(SOURCE_KEY, null);
    if (snap && hasPlannable(snap.items)) {
      return { items: snap.items, contact: snap.contact || contact };
    }
    return null;
  }

  function promoDates(items) {
    var seen = {};
    var dates = [];
    items.forEach(function (i) {
      if (PLANNABLE_IDS.indexOf(i.id) === -1) return;
      var d = itemDate(i);
      if (seen[d]) return;
      seen[d] = true;
      dates.push(d);
    });
    return dates.sort();
  }

  function factsForDate(source, date) {
    var items = source.items.filter(function (i) {
      return String(i.id || "").indexOf("mkt-promo-") === 0 && itemDate(i) === date;
    });
    function find(id) {
      return items.filter(function (i) {
        return i.id === id;
      });
    }
    function qty(id) {
      return find(id).reduce(function (n, i) {
        return n + (Number(i.qty) || 1);
      }, 0);
    }
    var withState = items.filter(function (i) {
      return i.promoState;
    })[0];
    var ps = (withState && withState.promoState) || {};
    var hours = Number(ps.hours) || 0;
    if (!hours) {
      items.some(function (i) {
        var m = /Duration:\s*(\d+)h/i.exec(i.notes || "");
        if (m) hours = Number(m[1]);
        return Boolean(m);
      });
    }
    var stopNames = String(ps.stopLocations || "")
      .split(/\n|,|;/)
      .map(function (s) {
        return s.trim();
      })
      .filter(Boolean);
    var c = source.contact || {};
    return {
      date: date,
      client: c.company || c.name || "",
      contactName: c.name || "",
      address: c.address || "",
      location: ps.parishLabel || "",
      parishId: ps.parishId || "",
      hours: hours,
      stopsCount: Number(ps.stops) || stopNames.length || 0,
      stopNames: stopNames,
      townCryer: qty("mkt-promo-town-cryer") > 0,
      vehicle: qty("mkt-promo-vehicle") > 0,
      speakers: qty("mkt-promo-speakers") > 0,
      host: qty("mkt-promo-host") > 0,
      ambassadors: qty("mkt-promo-models"),
      capture: qty("mkt-promo-capture") > 0,
      coolers: qty("mkt-promo-cooler-rect") + qty("mkt-promo-cooler-round"),
      ice: qty("mkt-promo-ice"),
      editPhotos: qty("mkt-promo-edit-photo"),
      editVideos: qty("mkt-promo-edit-video"),
    };
  }

  function bookedCrewList(f) {
    var out = [];
    if (f.townCryer) out.push("Town Cryer Service (vehicle, driver/grip, speakers, town cryer)");
    if (f.vehicle) out.push("Promotional vehicle and grip");
    if (f.speakers) out.push("Speakers");
    if (f.host) out.push("Host/DJ");
    if (f.ambassadors) out.push(f.ambassadors + " promotion ambassador" + (f.ambassadors === 1 ? "" : "s"));
    if (f.capture) out.push("Capturing content");
    if (f.coolers) out.push(f.coolers + " cooler" + (f.coolers === 1 ? "" : "s"));
    if (f.ice) out.push(f.ice + " bag" + (f.ice === 1 ? "" : "s") + " of ice");
    return out;
  }

  /* ─── answers ─────────────────────────────────────────── */

  function isKingstonArea(f) {
    return f.parishId === "kingston" || f.parishId === "st-andrew";
  }

  function defaultTravel(f, index) {
    if (isKingstonArea(f)) return index === 0 ? 30 : 15;
    return 30;
  }

  function defaultAnswers(f) {
    var hours = f.hours || 5;
    var count = Math.max(1, Math.min(maxStopsForHours(hours), f.stopsCount || f.stopNames.length || 3));
    var stops = [];
    for (var i = 0; i < count; i++) {
      stops.push({ name: f.stopNames[i] || "", travelAfter: defaultTravel(f, i) });
    }
    return {
      step: 0,
      clientOverride: "",
      locationOverride: "",
      hoursOverride: "",
      format: "traffic-sampling",
      handouts: "both",
      handoutsOther: "",
      campaign: "",
      stops: stops,
      hqStop: -1,
      clockStart: "arrival",
      travelToFirst: 30,
      startTime: "12:00",
      fixed: { enabled: true, stopIndex: count - 1, time: "16:15" },
      activationMin: 45,
      lunch: { enabled: hours >= 5, minutes: 60 },
      checklist: null,
    };
  }

  function effective(f, a) {
    return {
      client: f.client || a.clientOverride.trim(),
      location: f.location || a.locationOverride.trim(),
      hours: f.hours || clampInt(a.hoursOverride, 1, 12, 0),
    };
  }

  /* ─── schedule engine ─────────────────────────────────── */

  function stopLabel(a, i) {
    var name = (a.stops[i] && a.stops[i].name.trim()) || "Stop " + (i + 1);
    return name;
  }

  function buildSchedule(f, a) {
    var eff = effective(f, a);
    var H = (eff.hours || 0) * 60;
    var n = a.stops.length;
    var act = clampInt(a.activationMin, 10, 240, 45);
    var fixedOn = Boolean(a.fixed.enabled) && parseTime(a.fixed.time) != null;
    var k = fixedOn ? clampInt(a.fixed.stopIndex, 0, n - 1, n - 1) : n - 1;
    var lunchOn = Boolean(a.lunch.enabled);
    var L = clampInt(a.lunch.minutes, 15, 120, 60);
    var loadIn = a.clockStart === "loadout";
    var segs = [];

    if (loadIn) {
      segs.push({ kind: "buffer", label: "Load-out at base", min: LOAD_OUT_MIN, note: "Gear check, ice into the cooler, team briefing" });
      segs.push({ kind: "travel", label: "Travel to " + stopLabel(a, 0), min: clampInt(a.travelToFirst, 0, 240, 30), note: "" });
    }
    var lunchIndex = -1;
    for (var i = 0; i < n; i++) {
      if (i === k) {
        if (lunchOn && n === 1) {
          segs.push({ kind: "lunch", label: "Lunch and restock", min: L, note: lunchNote(a) });
          lunchIndex = i;
        }
        segs.push({ kind: "buffer", label: "Buffer and set up", min: 0, isBuffer: true, note: fixedOn ? "Must be live by " + fmtTime(parseTime(a.fixed.time)) : "Absorbs traffic delays" });
      }
      segs.push({
        kind: "activation",
        label: stopLabel(a, i),
        stopIndex: i,
        min: act,
        note: i === n - 1 ? "Final activation, " + act + " min" : "Activation, " + act + " min",
      });
      if (i < n - 1) {
        segs.push({ kind: "buffer", label: "Pack down", min: PACK_DOWN_MIN, note: i === 0 ? "Count remaining stock" : "" });
        if (lunchOn && ((k > 0 && i === k - 1) || (k === 0 && i === 0))) {
          segs.push({ kind: "lunch", label: "Lunch and restock", min: L, note: lunchNote(a) });
          lunchIndex = i;
        }
        segs.push({
          kind: "travel",
          label: "Travel to " + stopLabel(a, i + 1),
          min: clampInt(a.stops[i].travelAfter, 0, 240, 15),
          note: "About " + clampInt(a.stops[i].travelAfter, 0, 240, 15) + " min",
          legIndex: i,
        });
      }
    }

    var fixedTotal = segs.reduce(function (s, x) {
      return s + x.min;
    }, 0);
    var buffer = H - fixedTotal;
    var over = buffer < 0 ? -buffer : 0;
    var bufferSeg = segs.filter(function (x) {
      return x.isBuffer;
    })[0];
    bufferSeg.min = Math.max(0, buffer);

    var preK = 0;
    for (var j = 0; j < segs.length; j++) {
      if (segs[j].isBuffer) break;
      preK += segs[j].min;
    }

    var start;
    if (fixedOn) start = parseTime(a.fixed.time) - preK - bufferSeg.min;
    else start = parseTime(a.startTime) != null ? parseTime(a.startTime) : 12 * 60;

    var t = start;
    var blocks = [];
    segs.forEach(function (s) {
      if (s.min <= 0) return;
      blocks.push({
        kind: s.kind,
        label: s.label,
        note: s.note,
        start: t,
        end: t + s.min,
        stopIndex: s.stopIndex,
        legIndex: s.legIndex,
      });
      t += s.min;
    });

    var activations = n * act;
    var travel = segs
      .filter(function (s) {
        return s.kind === "travel";
      })
      .reduce(function (s, x) {
        return s + x.min;
      }, 0);
    var warnings = [];
    if (!H) warnings.push("The booked hours are missing. Add them in step 1 so the schedule can be checked.");
    if (over > 0 && H) {
      warnings.push(
        "The day is " +
          fmtDuration(over) +
          " longer than the booked " +
          eff.hours +
          " hours. Trim time from a middle stop" +
          (fixedOn ? ", never from the fixed " + fmtTime(parseTime(a.fixed.time)) + " start" : "") +
          ", shorten lunch, or expect overtime."
      );
    }
    if (fixedOn && start < 6 * 60) warnings.push("Working back from the fixed time puts the start before 6:00 am. Check the fixed time and hours.");

    return {
      blocks: blocks,
      start: start,
      bookedEnd: start + H,
      end: t,
      fixedOn: fixedOn,
      fixedStop: k,
      fixedTime: fixedOn ? parseTime(a.fixed.time) : null,
      lunchOn: lunchOn,
      lunchMin: L,
      lunchAfterStop: lunchIndex,
      activations: activations,
      travel: travel,
      buffer: bufferSeg.min,
      packDown: Math.max(0, n - 1) * PACK_DOWN_MIN,
      over: over,
      hours: eff.hours,
      loadIn: loadIn,
      preClockLoadOut: loadIn ? null : { start: start - LOAD_OUT_MIN, end: start },
      warnings: warnings,
    };
  }

  function lunchNote(a) {
    return isSampling(a) ? "Top up ice, refill sample stock" : "Team break, restock material";
  }

  function isSampling(a) {
    return a.handouts === "samples" || a.handouts === "both";
  }

  function isInTraffic(a) {
    return a.format === "traffic-sampling" || a.format === "traffic-flyers" || a.format === "mix";
  }

  function hasStationary(a) {
    return a.format === "stationary" || a.format === "mix";
  }

  function handoutText(a) {
    if (a.handouts === "samples") return "free samples";
    if (a.handouts === "flyers") return "flyers";
    if (a.handouts === "both") return "free samples and flyers";
    return a.handoutsOther.trim() || "giveaways";
  }

  function campaignName(a) {
    return a.campaign.trim() || "the promotion";
  }

  /* ─── roles, safety, contingency ──────────────────────── */

  function buildRoles(f, a) {
    var roles = [];
    var hand = handoutText(a);
    if (f.townCryer) roles.push(["Town Cryer", "Announces " + campaignName(a) + " and the " + hand + " over the speakers along the route and at each stop."]);
    if (f.host) roles.push(["Host/DJ", "Music and crowd energy at each stop." + (f.townCryer ? " Hands the mic to the Town Cryer." : "")]);
    if (f.ambassadors) {
      roles.push([
        "Ambassadors (" + f.ambassadors + ")",
        isInTraffic(a) ? "Work the traffic, handing out " + hand + "." : "Engage passers-by at the setup, handing out " + hand + ".",
      ]);
    }
    if (f.townCryer || f.vehicle) {
      roles.push([
        "Driver/grip",
        "Positions the vehicle, " + (f.townCryer || f.speakers ? "powers the speakers through the inverter, " : "") + "handles loading" + (f.coolers || isSampling(a) ? " and the cooler" : "") + ".",
      ]);
    }
    if (f.capture) roles.push(["Content capture", "Shoots photo and video at each stop for post-promotion edits."]);
    roles.push(["SEC coordinator", "Runs the timeline, watches safety, tracks handout counts, takes proof-of-execution photos for the client report."]);
    return roles;
  }

  function buildSafety(a) {
    var rules = [];
    if (isInTraffic(a)) {
      rules.push("Hand out only when vehicles are fully stopped at lights or in standstill traffic. Step back as soon as traffic moves.");
      rules.push("Ambassadors stay in pairs, never between moving lanes.");
      rules.push("Hand " + (isSampling(a) ? "samples" : "material") + " to passengers when possible rather than drivers.");
    }
    if (hasStationary(a)) {
      rules.push("Keep the walkway clear around the stationary setup and secure signs and tables against wind.");
    }
    if (isSampling(a)) {
      rules.push("Keep samples chilled in the cooler and restock from it, not from an open box in the sun.");
    }
    rules.push("Bag your litter: collect any cups or wrappers handed back so the brand isn't linked to roadside litter.");
    return rules;
  }

  function buildContingency(s, a) {
    var out = [];
    var n = a.stops.length;
    if (s.fixedOn) {
      var middle = n > 2 ? "a middle stop" : n === 2 ? "the stop before " + stopLabel(a, s.fixedStop) : "the activation";
      out.push("If the day runs late, cut time from " + middle + ", never from the " + fmtTime(s.fixedTime) + " start at " + stopLabel(a, s.fixedStop) + ".");
    } else {
      out.push("If the day runs late, cut time from a middle stop rather than the last one.");
    }
    if (s.hours) {
      out.push("Ending at " + fmtTime(s.bookedEnd) + " keeps the day at the booked " + s.hours + " hours. Running past " + fmtTime(s.bookedEnd) + " counts as overtime.");
    }
    out.push("Check live travel times on Google Maps or Waze on the day. The travel estimates are planning figures.");
    return out;
  }

  /* ─── checklist ───────────────────────────────────────── */

  function isRainySeason(iso) {
    var m = /^\d{4}-(\d{2})/.exec(iso || "");
    if (!m) return false;
    var month = Number(m[1]);
    return month === 5 || month === 6 || (month >= 9 && month <= 11);
  }

  function generateChecklist(f, a) {
    var items = [];
    function add(id, group, label) {
      items.push({ id: id, group: group, label: label, checked: true, custom: false });
    }
    var crew = [];
    if (f.ambassadors) crew.push("ambassadors");
    if (f.host) crew.push("Host/DJ");
    if (f.townCryer) crew.push("Town Cryer");
    add("gear", "requested", "Promotional gear: T-shirts, shorts and outfits" + (crew.length ? " for " + crew.join(", ") : ""));
    add("signs", "requested", "Promotional signs");
    add("material", "requested", "Promotional material (flyers and handouts)");
    if (isSampling(a)) add("samples", "requested", "Product samples" + (a.campaign.trim() ? ": " + a.campaign.trim() : ""));
    if (f.townCryer) add("speakers", "requested", "Speakers (included in Town Cryer Service)");
    else if (f.speakers) add("speakers", "requested", "Speakers");
    if (f.coolers) add("cooler", "requested", "Igloo / cooler" + (f.coolers > 1 ? " (" + f.coolers + ")" : ""));
    if (f.ice) add("ice", "requested", "Ice (" + f.ice + " bag" + (f.ice === 1 ? "" : "s") + ")");
    if (f.townCryer || f.speakers || f.host) add("inverter", "requested", "Power inverter");

    if (isSampling(a) && !f.coolers) add("cooler-extra", "suggested", "Igloo or cooler for samples (not on the quote)");
    if (f.ice || isSampling(a)) add("scoop", "suggested", "Ice scoop, plus a reserve bag of ice for the " + (a.lunch.enabled ? "lunch top-up" : "afternoon top-up"));
    if (isSampling(a)) add("cups", "suggested", "Sample cups or pre-chilled sample bottles, plus napkins and wet wipes");
    add("bags", "suggested", "Garbage bags for litter collection");
    add("power", "suggested", "Spare batteries, extension cord and power strip");
    add("ties", "suggested", "Zip ties and tape for mounting signs" + (f.townCryer || f.vehicle ? " on the vehicle" : ""));
    if (hasStationary(a) || a.fixed.enabled) {
      var tableStop = a.fixed.enabled ? stopLabel(a, clampInt(a.fixed.stopIndex, 0, a.stops.length - 1, 0)) : "the setup";
      add("table", "suggested", "Folding table for the stationary setup at " + tableStop);
    }
    add("water", "suggested", "Drinking water for the team, sunscreen and caps");
    add("rain", "suggested", isRainySeason(f.date) ? "Ponchos or umbrellas (rainy season)" : "Ponchos or umbrellas in case of rain");
    add("firstaid", "suggested", "First aid kit");
    add("charger", "suggested", "Power bank and phone chargers");
    add("tally", "suggested", "Tally sheet or clicker to count " + (isSampling(a) ? "samples" : "handouts") + " given out at each stop");
    add("contacts", "suggested", "Client contact sheet and a printed copy of this run-of-show");
    if (isInTraffic(a)) add("permit", "suggested", "Confirm with the client whether a permit or police notice is needed for in-traffic activity");

    if (f.capture || f.editPhotos || f.editVideos) {
      if (f.capture) add("cards", "edit", "Memory cards and spare camera batteries");
      if (f.editVideos) add("concept", "edit", "Agreed video concept for the " + f.editVideos + " edited video" + (f.editVideos === 1 ? "" : "s") + " (confirm before the day)");
      if (f.editPhotos || f.capture) {
        var photoNote = f.editPhotos ? "Shot list for about " + f.editPhotos + " edited photo" + (f.editPhotos === 1 ? "" : "s") : "Shot list for photo edits";
        add("photos", "edit", photoNote + (f.capture ? " (first 5 photo edits included with capture)" : ""));
      }
    }
    return items;
  }

  function ensureChecklist(f, a) {
    if (!a.checklist || !Array.isArray(a.checklist.items)) {
      a.checklist = { items: generateChecklist(f, a) };
    }
    return a.checklist.items;
  }

  function resetChecklist(f, a, dropCustom) {
    var current = ensureChecklist(f, a);
    var custom = dropCustom
      ? []
      : current.filter(function (i) {
          return i.custom;
        });
    a.checklist = { items: generateChecklist(f, a).concat(custom) };
  }

  /* ─── document rendering ──────────────────────────────── */

  var KIND_COLORS = {
    activation: { fill: "#111111", text: "#f5c518", label: "Activation" },
    travel: { fill: "#bdbdbd", text: "#1a1a1a", label: "Travel" },
    lunch: { fill: "#f5c518", text: "#111111", label: "Lunch and restock" },
    buffer: { fill: "#e3e3e3", text: "#444444", label: "Pack down / buffer" },
  };

  function routeSvg(a, s) {
    var n = a.stops.length;
    var width = 900;
    var pad = 110;
    var xs = [];
    for (var i = 0; i < n; i++) xs.push(n === 1 ? width / 2 : pad + ((width - pad * 2) * i) / (n - 1));
    var y = 45;
    var out = ['<svg viewBox="0 0 ' + width + ' 130" width="100%" role="img" aria-label="Route">'];
    for (var j = 0; j < n - 1; j++) {
      var x1 = xs[j] + 22;
      var x2 = xs[j + 1] - 22;
      var mid = (x1 + x2) / 2;
      var mins = clampInt(a.stops[j].travelAfter, 0, 240, 15);
      var top = (s.lunchOn && s.lunchAfterStop === j ? "lunch + " : "about ") + mins + " min";
      out.push('<line x1="' + x1 + '" y1="' + y + '" x2="' + x2 + '" y2="' + y + '" stroke="#999" stroke-width="2" stroke-dasharray="6 6"/>');
      out.push('<polygon points="' + x2 + "," + y + " " + (x2 - 10) + "," + (y - 6) + " " + (x2 - 10) + "," + (y + 6) + '" fill="#999"/>');
      out.push('<text x="' + mid + '" y="' + (y - 12) + '" text-anchor="middle" font-size="13" font-weight="600" fill="#1a1a1a">' + esc(top) + "</text>");
    }
    for (var k = 0; k < n; k++) {
      var isFixed = s.fixedOn && s.fixedStop === k;
      var act = s.blocks.filter(function (b) {
        return b.kind === "activation" && b.stopIndex === k;
      })[0];
      var time = act ? fmtTime(act.start) + " to " + fmtTime(act.end) : "";
      var hq = a.hqStop === k ? " (client HQ)" : "";
      out.push('<circle cx="' + xs[k] + '" cy="' + y + '" r="20" fill="' + (isFixed ? "#f5c518" : "#fff") + '" stroke="#111" stroke-width="2"/>');
      out.push('<text x="' + xs[k] + '" y="' + (y + 5) + '" text-anchor="middle" font-size="14" font-weight="700" fill="#111">' + (k + 1) + "</text>");
      out.push('<text x="' + xs[k] + '" y="' + (y + 47) + '" text-anchor="middle" font-size="13" font-weight="600" fill="#1a1a1a">' + esc(stopLabel(a, k) + hq) + "</text>");
      out.push('<text x="' + xs[k] + '" y="' + (y + 65) + '" text-anchor="middle" font-size="11" fill="' + (isFixed ? "#111" : "#555") + '"' + (isFixed ? ' font-weight="600"' : "") + ">" + esc(time) + "</text>");
    }
    out.push("</svg>");
    return out.join("");
  }

  function timelineSvg(s) {
    var width = 1000;
    var rangeStart = Math.floor(s.start / 60) * 60;
    var rangeEnd = Math.ceil(Math.max(s.end, s.bookedEnd) / 60) * 60;
    if (rangeEnd <= rangeStart) rangeEnd = rangeStart + 60;
    var total = rangeEnd - rangeStart;
    function x(m) {
      return ((m - rangeStart) / total) * width;
    }
    var out = ['<svg viewBox="0 0 ' + width + ' 92" width="100%" role="img" aria-label="Day timeline">'];
    s.blocks.forEach(function (b) {
      var c = KIND_COLORS[b.kind];
      var bx = x(b.start);
      var bw = x(b.end) - bx;
      out.push('<rect x="' + (bx + 1) + '" y="18" width="' + Math.max(1, bw - 2) + '" height="40" rx="4" fill="' + c.fill + '"/>');
      var maxChars = Math.floor(bw / 7);
      if (maxChars >= 5) {
        var label = b.label.length > maxChars ? b.label.slice(0, maxChars - 1) + "…" : b.label;
        out.push('<text x="' + (bx + bw / 2) + '" y="42" text-anchor="middle" font-size="11" font-weight="600" fill="' + c.text + '">' + esc(label) + "</text>");
      }
    });
    if (s.fixedOn) {
      var fx = x(s.fixedTime);
      out.push('<line x1="' + fx + '" y1="6" x2="' + fx + '" y2="64" stroke="#d62828" stroke-width="2"/>');
      out.push('<text x="' + (fx - 6) + '" y="13" text-anchor="end" font-size="10" font-weight="700" fill="#d62828">Live by ' + esc(fmtTime(s.fixedTime)) + "</text>");
    }
    if (s.hours && s.end > s.bookedEnd) {
      var ex = x(s.bookedEnd);
      out.push('<line x1="' + ex + '" y1="14" x2="' + ex + '" y2="64" stroke="#111" stroke-width="1.5" stroke-dasharray="3 3"/>');
    }
    for (var h = rangeStart; h <= rangeEnd; h += 60) {
      var hx = Math.min(Math.max(x(h), 18), width - 18);
      out.push('<text x="' + hx + '" y="82" text-anchor="middle" font-size="11" fill="#666">' + esc(fmtTime(h)) + "</text>");
    }
    out.push("</svg>");
    return out.join("");
  }

  function legendHtml() {
    return (
      '<div class="ros-legend">' +
      Object.keys(KIND_COLORS)
        .map(function (k) {
          return '<span class="ros-legend__item"><span class="ros-legend__swatch" style="background:' + KIND_COLORS[k].fill + '"></span>' + esc(KIND_COLORS[k].label) + "</span>";
        })
        .join("") +
      "</div>"
    );
  }

  function headerHtml(f, a, title) {
    var eff = effective(f, a);
    var crew = bookedCrewList(f);
    var fmt = FORMAT_OPTIONS.filter(function (o) {
      return o.value === a.format;
    })[0];
    return (
      '<header class="ros-doc__header">' +
      "<h1>" + esc(title) + "</h1>" +
      (eff.client ? "<p><strong>Client:</strong> " + esc(eff.client) + (f.address ? ", " + esc(f.address) : "") + "</p>" : "") +
      "<p><strong>Event date:</strong> " + esc(longDate(f.date)) + (eff.location ? " · " + esc(eff.location) : "") + "</p>" +
      "<p><strong>Booked:</strong> " + esc(crew.join(", ") || "Promotion services") + (eff.hours ? ", " + eff.hours + " hours" : "") + "</p>" +
      "<p><strong>Format:</strong> " + esc((fmt ? fmt.label : "Promotion") + ", handing out " + handoutText(a)) + "</p>" +
      "</header>"
    );
  }

  function scheduleRows(s) {
    var rows = [];
    if (s.preClockLoadOut) {
      rows.push(
        "<tr><td class=\"ros-time\">" + fmtTime(s.preClockLoadOut.start) + "</td><td>Load-out at base</td><td>Gear check against the checklist, ice into the cooler, team briefing. Before the " + (s.hours || "booked") + "-hour clock starts.</td></tr>"
      );
    }
    s.blocks.forEach(function (b) {
      var isStop = b.kind === "activation";
      rows.push(
        '<tr class="' + (isStop ? "ros-row--stop" : "") + '"><td class="ros-time">' + fmtTime(b.start) + " to " + fmtTime(b.end) + "</td><td>" + (isStop ? "Stop " + (b.stopIndex + 1) + ": " : "") + esc(b.label) + "</td><td>" + esc(b.note || "") + "</td></tr>"
      );
    });
    return rows.join("");
  }

  function timingLogicHtml(f, a, s) {
    var parts = [];
    var first = stopLabel(a, 0);
    if (s.fixedOn) {
      parts.push(
        "<p>The one fixed time is being set up and live at " + esc(stopLabel(a, s.fixedStop)) + " at <strong>" + fmtTime(s.fixedTime) + "</strong>. Working back from there, the " + (s.hours || "") + "-hour day starts " + (s.loadIn ? "with load-out" : "on arrival at " + esc(first)) + " at <strong>" + fmtTime(s.start) + "</strong>" + (s.hours ? " and wraps at <strong>" + fmtTime(s.bookedEnd) + "</strong>" : "") + ".</p>"
      );
    } else {
      parts.push("<p>The day starts " + (s.loadIn ? "with load-out" : "on arrival at " + esc(first)) + " at <strong>" + fmtTime(s.start) + "</strong>" + (s.hours ? " and the booked " + s.hours + " hours end at <strong>" + fmtTime(s.bookedEnd) + "</strong>" : "") + ".</p>");
    }
    parts.push("<p>How the time is spent:</p><ul>");
    parts.push("<li>Activations: " + a.stops.length + " stop" + (a.stops.length === 1 ? "" : "s") + " x " + clampInt(a.activationMin, 10, 240, 45) + " min = " + fmtDuration(s.activations) + "</li>");
    if (s.lunchOn) parts.push("<li>Lunch: " + fmtDuration(s.lunchMin) + "</li>");
    if (s.travel) parts.push("<li>Travel: about " + fmtDuration(s.travel) + "</li>");
    parts.push("<li>Pack-down and buffer: about " + fmtDuration(s.packDown + s.buffer + (s.loadIn ? LOAD_OUT_MIN : 0)) + (s.buffer ? ", with the buffer kept before " + esc(stopLabel(a, s.fixedStop)) : "") + "</li>");
    parts.push("</ul>");
    if (s.lunchOn && a.stops.length > 1 && s.lunchAfterStop === s.fixedStop - 1) {
      parts.push("<p>Lunch goes right before " + esc(stopLabel(a, s.fixedStop)) + " because:</p><ul>");
      parts.push("<li>The buffer sits right before " + (s.fixedOn ? "the only fixed time" : "the last stop") + ", so traffic delays get absorbed instead of pushing it late.</li>");
      parts.push("<li>Lunch doubles as the restock window" + (isSampling(a) ? ": top up ice and refill sample stock" : "") + " before the last stop.</li>");
      if (a.hqStop === s.fixedStop) parts.push("<li>The team arrives fresh at the client's HQ.</li>");
      parts.push("</ul>");
    }
    return parts.join("");
  }

  function checklistGroupsHtml(items, onlyChecked) {
    var html = [];
    ["requested", "suggested", "edit"].forEach(function (g) {
      var list = items.filter(function (i) {
        return i.group === g && (!onlyChecked || i.checked);
      });
      if (!list.length) return;
      html.push("<h3>" + esc(GROUP_LABELS[g]) + '</h3><ul class="ros-checklist">');
      list.forEach(function (i) {
        html.push("<li>" + esc(i.label) + "</li>");
      });
      html.push("</ul>");
    });
    return html.join("") || '<p class="ros-muted">No checklist items selected.</p>';
  }

  function footerHtml(kind) {
    var cfg = window.SEC_CONFIG || {};
    var bits = [cfg.BUSINESS_NAME || "SEC Freelance", kind || "Run-of-show", "Prepared " + new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })];
    return '<footer class="ros-doc__footer">' + esc(bits.join(" · ")) + "</footer>";
  }

  function docTitle(a) {
    return (a.campaign.trim() ? a.campaign.trim() + " " : "") + "promotion run-of-show";
  }

  function renderPlanDoc(f, a) {
    var s = buildSchedule(f, a);
    var items = ensureChecklist(f, a);
    var title = docTitle(a);
    title = title.charAt(0).toUpperCase() + title.slice(1);
    var warn = s.warnings.length
      ? '<div class="ros-callout ros-callout--warn"><strong>Check the timing</strong><ul>' +
        s.warnings
          .map(function (w) {
            return "<li>" + esc(w) + "</li>";
          })
          .join("") +
        "</ul></div>"
      : "";
    var roles = buildRoles(f, a)
      .map(function (r) {
        return "<tr><td><strong>" + esc(r[0]) + "</strong></td><td>" + esc(r[1]) + "</td></tr>";
      })
      .join("");
    var safety = buildSafety(a)
      .map(function (r) {
        return "<li>" + esc(r) + "</li>";
      })
      .join("");
    var cont = buildContingency(s, a)
      .map(function (r) {
        return "<li>" + esc(r) + "</li>";
      })
      .join("");

    return (
      '<div class="ros-sheet" data-ros-page="1">' +
      headerHtml(f, a, title) +
      warn +
      "<h2>Route</h2>" +
      routeSvg(a, s) +
      "<h2>Day timeline</h2>" +
      timelineSvg(s) +
      legendHtml() +
      "<h2>Route and timing logic</h2>" +
      timingLogicHtml(f, a, s) +
      "</div>" +
      '<div class="ros-sheet" data-ros-page="2">' +
      "<h2>Schedule</h2>" +
      '<table class="ros-table"><thead><tr><th>Time</th><th>Block</th><th>Notes</th></tr></thead><tbody>' +
      scheduleRows(s) +
      "</tbody></table>" +
      '<div class="ros-callout"><strong>Contingency rules</strong><ul>' +
      cont +
      "</ul></div>" +
      "<h2>Roles on the ground</h2>" +
      '<table class="ros-table"><thead><tr><th>Role</th><th>Responsibility</th></tr></thead><tbody>' +
      roles +
      "</tbody></table>" +
      "</div>" +
      '<div class="ros-sheet" data-ros-page="3">' +
      "<h2>Safety rules</h2><ul>" +
      safety +
      "</ul>" +
      "<h2>Gear checklist</h2>" +
      checklistGroupsHtml(items, true) +
      footerHtml() +
      "</div>"
    );
  }

  function renderChecklistDoc(f, a) {
    var items = ensureChecklist(f, a);
    var eff = effective(f, a);
    var title = (a.campaign.trim() ? a.campaign.trim() + " " : "") + "promotion gear checklist";
    title = title.charAt(0).toUpperCase() + title.slice(1);
    return (
      '<div class="ros-sheet" data-ros-page="1">' +
      '<header class="ros-doc__header">' +
      "<h1>" + esc(title) + "</h1>" +
      (eff.client ? "<p><strong>Client:</strong> " + esc(eff.client) + "</p>" : "") +
      "<p><strong>Event date:</strong> " + esc(longDate(f.date)) + (eff.location ? " · " + esc(eff.location) : "") + "</p>" +
      "<p><strong>Packed by:</strong> ____________________ &nbsp; <strong>Checked at load-out:</strong> ________</p>" +
      "</header>" +
      checklistGroupsHtml(items, true) +
      footerHtml("Gear checklist") +
      "</div>"
    );
  }

  /* ─── PDF ─────────────────────────────────────────────── */

  function loadScript(src) {
    return new Promise(function (resolve, reject) {
      var s = document.createElement("script");
      s.src = src;
      s.async = true;
      s.onload = resolve;
      s.onerror = function () {
        reject(new Error("Failed: " + src));
      };
      document.head.appendChild(s);
    });
  }

  function ensurePdfLibs() {
    if (typeof html2canvas === "function" && window.jspdf) return Promise.resolve();
    return loadScript("https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js").then(function () {
      return loadScript("https://cdn.jsdelivr.net/npm/jspdf@2.5.2/dist/jspdf.umd.min.js");
    });
  }

  async function buildPdf(html, filename) {
    await ensurePdfLibs();
    if (document.fonts && document.fonts.ready) await document.fonts.ready;
    var host = document.createElement("div");
    host.className = "ros-doc ros-doc--capture";
    host.innerHTML = html;
    document.body.appendChild(host);
    try {
      var JsPDF = window.jspdf.jsPDF || window.jspdf;
      var pdf = new JsPDF({ orientation: "p", unit: "mm", format: "letter" });
      var pw = pdf.internal.pageSize.getWidth();
      var ph = pdf.internal.pageSize.getHeight();
      var m = 10;
      var sheets = host.querySelectorAll(".ros-sheet");
      for (var i = 0; i < sheets.length; i++) {
        var canvas = await html2canvas(sheets[i], { scale: 2, backgroundColor: "#ffffff", logging: false, useCORS: true });
        var mw = pw - m * 2;
        var mh = ph - m * 2;
        var dw = mw;
        var dh = (canvas.height * dw) / canvas.width;
        if (dh > mh) {
          dh = mh;
          dw = (canvas.width * dh) / canvas.height;
        }
        if (i > 0) pdf.addPage();
        pdf.addImage(canvas.toDataURL("image/jpeg", 0.92), "JPEG", m + (mw - dw) / 2, m, dw, dh);
      }
      var blob = pdf.output("blob");
      var url = URL.createObjectURL(blob);
      var link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(function () {
        URL.revokeObjectURL(url);
      }, 60000);
    } finally {
      document.body.removeChild(host);
    }
  }

  function fileSlug(f, a, kind) {
    var base = (a.campaign.trim() || "promotion").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    return (base || "promotion") + "-" + kind + (f.date ? "-" + f.date : "") + ".pdf";
  }

  /* ─── wizard UI ───────────────────────────────────────── */

  var app = { source: null, dates: [], date: "", store: null, facts: null, answers: null };

  function loadStore() {
    var s = readJson(STATE_KEY, null);
    if (!s || typeof s !== "object" || !s.byDate) s = { byDate: {}, activeDate: "" };
    return s;
  }

  function saveStore() {
    app.store.byDate[app.date || "undated"] = app.answers;
    app.store.activeDate = app.date;
    writeJson(STATE_KEY, app.store);
  }

  function mergeDefaults(saved, defaults) {
    var out = Object.assign({}, defaults, saved || {});
    out.fixed = Object.assign({}, defaults.fixed, (saved && saved.fixed) || {});
    out.lunch = Object.assign({}, defaults.lunch, (saved && saved.lunch) || {});
    if (!Array.isArray(out.stops) || !out.stops.length) out.stops = defaults.stops;
    return out;
  }

  function selectDate(date) {
    app.date = date;
    app.facts = factsForDate(app.source, date);
    app.answers = mergeDefaults(app.store.byDate[date || "undated"], defaultAnswers(app.facts));
    ensureChecklist(app.facts, app.answers);
    refreshGeneratedLabels();
    saveStore();
    renderAll();
  }

  function getPath(obj, path) {
    return path.split(".").reduce(function (o, k) {
      return o == null ? undefined : o[k];
    }, obj);
  }

  function setPath(obj, path, value) {
    var keys = path.split(".");
    var last = keys.pop();
    var target = keys.reduce(function (o, k) {
      return o[k];
    }, obj);
    target[last] = value;
  }

  function opt(options, current) {
    return options
      .map(function (o) {
        return '<option value="' + esc(o.value) + '"' + (String(o.value) === String(current) ? " selected" : "") + ">" + esc(o.label) + "</option>";
      })
      .join("");
  }

  function field(label, inner, hint, full) {
    return (
      '<div class="ros-field' + (full ? " ros-field--full" : "") + '"><label>' + esc(label) + "</label>" + inner + (hint ? '<p class="meta ros-field__hint">' + hint + "</p>" : "") + "</div>"
    );
  }

  function stepQuote(f, a) {
    var eff = effective(f, a);
    var crew = bookedCrewList(f);
    var html = ['<div class="ros-grid">'];
    html.push(
      f.client
        ? field("Client", '<p class="ros-readonly">' + esc(f.client) + "</p>")
        : field("Client", '<input class="field" type="text" data-bind="clientOverride" value="' + esc(a.clientOverride) + '" placeholder="Company or client name" />', "Not on the quote contact details; add it here.")
    );
    html.push(field("Event date", '<p class="ros-readonly">' + esc(longDate(f.date)) + "</p>"));
    html.push(
      f.location
        ? field("Location", '<p class="ros-readonly">' + esc(f.location) + "</p>")
        : field("Location", '<input class="field" type="text" data-bind="locationOverride" value="' + esc(a.locationOverride) + '" placeholder="e.g. Kingston" />')
    );
    html.push(
      f.hours
        ? field("Booked hours", '<p class="ros-readonly">' + f.hours + " hours</p>")
        : field("Booked hours", '<input class="field" type="number" min="1" max="12" data-bind="hoursOverride" data-type="number" value="' + esc(a.hoursOverride) + '" />', "Not found on the quote; enter the booked duration.")
    );
    html.push(field("Booked crew and equipment", '<p class="ros-readonly">' + esc(crew.join(", ") || "None found") + "</p>", "", true));
    if (f.stopNames.length || f.stopsCount) {
      html.push(field("Stops from the quote", '<p class="ros-readonly">' + esc(f.stopNames.join(", ") || f.stopsCount + " stops") + "</p>", "You can rename and reorder them in step 3.", true));
    }
    html.push("</div>");
    if (!eff.hours) html.push('<p class="meta ros-warn">Booked hours are needed to check the schedule.</p>');
    return html.join("");
  }

  function stepFormat(f, a) {
    return (
      '<div class="ros-grid">' +
      field("Promotion format", '<select class="field" data-bind="format" data-rerender>' + opt(FORMAT_OPTIONS, a.format) + "</select>") +
      field("What is being handed out?", '<select class="field" data-bind="handouts" data-rerender>' + opt(HANDOUT_OPTIONS, a.handouts) + "</select>") +
      (a.handouts === "other" ? field("Describe the handouts", '<input class="field" type="text" data-bind="handoutsOther" value="' + esc(a.handoutsOther) + '" placeholder="e.g. branded keychains" />') : "") +
      field("Product or campaign name (optional)", '<input class="field" type="text" data-bind="campaign" value="' + esc(a.campaign) + '" placeholder="e.g. Trang Back" />') +
      "</div>"
    );
  }

  function stepStops(f, a) {
    var eff = effective(f, a);
    var max = maxStopsForHours(eff.hours || 5);
    var rows = a.stops
      .map(function (s, i) {
        var travel =
          i < a.stops.length - 1
            ? '<label class="ros-stop__travel">Travel to next stop <input class="field" type="number" min="0" max="240" step="5" data-bind="stops.' + i + '.travelAfter" data-type="number" value="' + esc(s.travelAfter) + '" /> min</label>'
            : "";
        return (
          '<div class="ros-stop">' +
          '<span class="ros-stop__num">' + (i + 1) + "</span>" +
          '<input class="field ros-stop__name" type="text" data-bind="stops.' + i + '.name" value="' + esc(s.name) + '" placeholder="Stop ' + (i + 1) + ' location" aria-label="Stop ' + (i + 1) + ' name" />' +
          '<div class="ros-stop__tools">' +
          '<button type="button" class="btn btn-ghost btn-sm" data-stop-move="' + i + '" data-dir="-1"' + (i === 0 ? " disabled" : "") + ' aria-label="Move up">Up</button>' +
          '<button type="button" class="btn btn-ghost btn-sm" data-stop-move="' + i + '" data-dir="1"' + (i === a.stops.length - 1 ? " disabled" : "") + ' aria-label="Move down">Down</button>' +
          '<button type="button" class="btn btn-ghost btn-sm" data-stop-remove="' + i + '"' + (a.stops.length === 1 ? " disabled" : "") + ">Remove</button>" +
          "</div>" +
          travel +
          "</div>"
        );
      })
      .join("");
    var hqOptions = [{ value: -1, label: "None" }].concat(
      a.stops.map(function (s, i) {
        return { value: i, label: stopLabel(a, i) };
      })
    );
    return (
      '<div class="ros-stops">' +
      rows +
      "</div>" +
      '<div class="ros-row-actions"><button type="button" class="btn btn-ghost btn-sm" id="ros-add-stop"' + (a.stops.length >= max ? " disabled" : "") + ">Add stop</button>" +
      '<span class="meta">Up to ' + max + " stops for a " + (eff.hours || 5) + "-hour promotion.</span></div>" +
      '<div class="ros-grid">' +
      field("Client HQ or must-hit stop (optional)", '<select class="field" data-bind="hqStop" data-type="number">' + opt(hqOptions, a.hqStop) + "</select>") +
      "</div>" +
      '<p class="meta">Travel defaults are midday estimates' + (isKingstonArea(f) ? " for Kingston and St Andrew" : "") + ". Adjust them if you know the route.</p>"
    );
  }

  function stepClock(f, a) {
    var stopOptions = a.stops.map(function (s, i) {
      return { value: i, label: stopLabel(a, i) };
    });
    var html = ['<div class="ros-grid">'];
    html.push(
      field(
        "When does the booked clock start?",
        '<select class="field" data-bind="clockStart" data-rerender>' +
          opt(
            [
              { value: "arrival", label: "On arrival at the first stop" },
              { value: "loadout", label: "At load-out from base" },
            ],
            a.clockStart
          ) +
          "</select>"
      )
    );
    if (a.clockStart === "loadout") {
      html.push(field("Travel from base to the first stop", '<input class="field" type="number" min="0" max="240" step="5" data-bind="travelToFirst" data-type="number" value="' + esc(a.travelToFirst) + '" />', "Minutes."));
    }
    html.push(
      field(
        "Is there a fixed live time?",
        '<label class="ros-check"><input type="checkbox" data-bind="fixed.enabled" data-type="bool" data-rerender' + (a.fixed.enabled ? " checked" : "") + " /> Yes, one stop must be live at a set time</label>"
      )
    );
    if (a.fixed.enabled) {
      html.push(field("Which stop?", '<select class="field" data-bind="fixed.stopIndex" data-type="number">' + opt(stopOptions, a.fixed.stopIndex) + "</select>"));
      html.push(field("Live by", '<input class="field" type="time" data-bind="fixed.time" value="' + esc(a.fixed.time) + '" />', "The start time is worked back from this."));
    } else {
      html.push(field("Start time", '<input class="field" type="time" data-bind="startTime" value="' + esc(a.startTime) + '" />'));
    }
    html.push(field("Minutes per activation", '<input class="field" type="number" min="10" max="240" step="5" data-bind="activationMin" data-type="number" value="' + esc(a.activationMin) + '" />'));
    html.push(
      field(
        "Lunch break",
        '<label class="ros-check"><input type="checkbox" data-bind="lunch.enabled" data-type="bool" data-rerender' + (a.lunch.enabled ? " checked" : "") + " /> Include lunch</label>"
      )
    );
    if (a.lunch.enabled) {
      html.push(field("Lunch length", '<input class="field" type="number" min="15" max="120" step="15" data-bind="lunch.minutes" data-type="number" value="' + esc(a.lunch.minutes) + '" />', "Minutes. Placed before the fixed-time or last stop."));
    }
    html.push("</div>");
    html.push('<div id="ros-clock-summary" aria-live="polite">' + clockSummaryHtml(f, a) + "</div>");
    return html.join("");
  }

  function clockSummaryHtml(f, a) {
    var s = buildSchedule(f, a);
    return (
      '<p class="ros-summary">Starts <strong>' + fmtTime(s.start) + "</strong>" + (s.hours ? ", booked wrap <strong>" + fmtTime(s.bookedEnd) + "</strong>" : "") + (s.buffer ? ", " + s.buffer + " min buffer" : "") + ".</p>" +
      s.warnings
        .map(function (w) {
          return '<p class="meta ros-warn">' + esc(w) + "</p>";
        })
        .join("")
    );
  }

  function checklistEditorHtml(f, a) {
    var items = ensureChecklist(f, a);
    var html = ['<p class="meta">Untick anything you will not bring. Edit wording, remove items, or add your own. Only ticked items appear on the PDFs.</p>'];
    ["requested", "suggested", "edit"].forEach(function (g) {
      var list = items.filter(function (i) {
        return i.group === g;
      });
      if (!list.length) return;
      html.push('<h3 class="ros-group-title">' + esc(GROUP_LABELS[g]) + '</h3><ul class="ros-edit-list">');
      list.forEach(function (i) {
        html.push(
          '<li class="ros-edit-item' + (i.checked ? "" : " ros-edit-item--off") + '">' +
            '<input type="checkbox" data-check-toggle="' + esc(i.id) + '"' + (i.checked ? " checked" : "") + ' aria-label="Bring this item" />' +
            '<textarea class="field ros-edit-item__label" rows="1" data-check-label="' + esc(i.id) + '" aria-label="Item text">' + esc(i.label) + "</textarea>" +
            '<button type="button" class="btn btn-ghost btn-sm" data-check-remove="' + esc(i.id) + '">Remove</button>' +
            "</li>"
        );
      });
      html.push("</ul>");
    });
    var groups = Object.keys(GROUP_LABELS).map(function (g) {
      return { value: g, label: GROUP_LABELS[g] };
    });
    html.push(
      '<div class="ros-add-item">' +
        '<input class="field" type="text" id="ros-new-item" placeholder="Add an item, e.g. Extra flyers" aria-label="New checklist item" />' +
        '<select class="field" id="ros-new-group" aria-label="Group">' + opt(groups, "suggested") + "</select>" +
        '<button type="button" class="btn btn-ghost btn-sm" id="ros-add-item">Add item</button>' +
        "</div>" +
        '<div class="ros-row-actions"><button type="button" class="btn btn-ghost btn-sm" id="ros-reset-checklist">Reset suggestions</button>' +
        '<span class="meta">Rebuilds the suggested list from your answers. Your own items are kept unless you choose otherwise.</span></div>'
    );
    return html.join("");
  }

  function stepReview(f, a) {
    var s = buildSchedule(f, a);
    var picked = ensureChecklist(f, a).filter(function (i) {
      return i.checked;
    }).length;
    return (
      '<p class="ros-summary">' +
      a.stops.length + " stop" + (a.stops.length === 1 ? "" : "s") + ", " +
      fmtTime(s.start) + " to " + fmtTime(s.end) +
      (s.fixedOn ? ", live at " + esc(stopLabel(a, s.fixedStop)) + " by " + fmtTime(s.fixedTime) : "") +
      ", " + picked + " checklist items.</p>" +
      (s.warnings.length ? s.warnings.map(function (w) { return '<p class="meta ros-warn">' + esc(w) + "</p>"; }).join("") : "") +
      '<p class="meta">The full plan is below. Use <strong>Download plan PDF</strong> for the run-of-show or <strong>Download checklist PDF</strong> for a one-page packing list. You can still edit the checklist here.</p>' +
      checklistEditorHtml(f, a)
    );
  }

  function renderSteps() {
    var ol = document.getElementById("ros-steps");
    ol.innerHTML = STEPS.map(function (s, i) {
      var cls = i === app.answers.step ? " ros-steps__item--active" : i < app.answers.step ? " ros-steps__item--done" : "";
      return '<li class="ros-steps__item' + cls + '"><button type="button" data-goto="' + i + '"' + (i === app.answers.step ? ' aria-current="step"' : "") + "><span>" + (i + 1) + "</span> " + esc(s.title) + "</button></li>";
    }).join("");
  }

  function renderStep() {
    var f = app.facts;
    var a = app.answers;
    var step = STEPS[a.step].id;
    document.getElementById("ros-step-title").textContent = "Step " + (a.step + 1) + " of " + STEPS.length + ": " + STEPS[a.step].title;
    var body = document.getElementById("ros-step-body");
    if (step === "quote") body.innerHTML = stepQuote(f, a);
    else if (step === "format") body.innerHTML = stepFormat(f, a);
    else if (step === "stops") body.innerHTML = stepStops(f, a);
    else if (step === "clock") body.innerHTML = stepClock(f, a);
    else if (step === "gear") body.innerHTML = checklistEditorHtml(f, a);
    else body.innerHTML = stepReview(f, a);
    document.getElementById("ros-back").disabled = a.step === 0;
    var next = document.getElementById("ros-next");
    next.hidden = a.step === STEPS.length - 1;
    next.textContent = a.step === STEPS.length - 2 ? "Review plan" : "Next";
    document.getElementById("ros-step-msg").textContent = "";
    renderSteps();
    body.querySelectorAll(".ros-edit-item__label").forEach(fitLabel);
  }

  function fitLabel(el) {
    el.style.height = "auto";
    el.style.height = el.scrollHeight + el.offsetHeight - el.clientHeight + "px";
  }

  function renderPreview() {
    document.getElementById("ros-doc").innerHTML = renderPlanDoc(app.facts, app.answers);
    var clock = document.getElementById("ros-clock-summary");
    if (clock) clock.innerHTML = clockSummaryHtml(app.facts, app.answers);
  }

  function renderAll() {
    renderStep();
    renderPreview();
  }

  function validateStep() {
    var f = app.facts;
    var a = app.answers;
    var step = STEPS[a.step].id;
    if (step === "quote" && !effective(f, a).hours) return "Enter the booked hours to continue.";
    if (step === "format" && a.handouts === "other" && !a.handoutsOther.trim()) return "Describe what is being handed out.";
    if (step === "stops") {
      var missing = a.stops.some(function (s) {
        return !s.name.trim();
      });
      if (missing) return "Name every stop so the plan reads clearly.";
    }
    if (step === "clock" && a.fixed.enabled && parseTime(a.fixed.time) == null) return "Enter the fixed live time.";
    return "";
  }

  function goTo(step) {
    app.answers.step = Math.max(0, Math.min(STEPS.length - 1, step));
    saveStore();
    renderStep();
    var wizard = document.querySelector(".ros-wizard");
    if (wizard && wizard.getBoundingClientRect().top < 0) wizard.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function onBind(el) {
    var path = el.getAttribute("data-bind");
    var type = el.getAttribute("data-type");
    var value;
    if (type === "bool") value = el.checked;
    else if (type === "number") value = el.value === "" ? "" : Number(el.value);
    else value = el.value;
    setPath(app.answers, path, value);
    if (path === "fixed.stopIndex" || path === "format" || path === "handouts" || path === "campaign" || path === "fixed.enabled" || path === "lunch.enabled") {
      refreshGeneratedLabels();
    }
    saveStore();
    renderPreview();
    if (el.hasAttribute("data-rerender")) renderStep();
  }

  /** Keep untouched generated items in step with answers without losing user edits. */
  function refreshGeneratedLabels() {
    var f = app.facts;
    var a = app.answers;
    var fresh = generateChecklist(f, a);
    var current = ensureChecklist(f, a);
    var edited = {};
    current.forEach(function (i) {
      if (!i.custom) edited[i.id] = i;
    });
    var merged = fresh.map(function (i) {
      var prev = edited[i.id];
      if (!prev) return i;
      return { id: i.id, group: i.group, label: prev.labelEdited ? prev.label : i.label, checked: prev.checked, custom: false, labelEdited: prev.labelEdited };
    });
    var removed = (a.checklist.removed || []).slice();
    merged = merged.filter(function (i) {
      return removed.indexOf(i.id) === -1;
    });
    a.checklist = {
      items: merged.concat(
        current.filter(function (i) {
          return i.custom;
        })
      ),
      removed: removed,
    };
  }

  function findItem(id) {
    return ensureChecklist(app.facts, app.answers).filter(function (i) {
      return i.id === id;
    })[0];
  }

  function bindEvents() {
    var root = document.getElementById("ros-app");

    root.addEventListener("input", function (e) {
      var el = e.target;
      if (el.hasAttribute("data-bind") && el.type !== "checkbox" && el.tagName !== "SELECT") {
        onBind(el);
        return;
      }
      if (el.hasAttribute("data-check-label")) {
        if (/[\r\n]/.test(el.value)) el.value = el.value.replace(/\s*[\r\n]+\s*/g, " ");
        fitLabel(el);
        var item = findItem(el.getAttribute("data-check-label"));
        if (item) {
          item.label = el.value;
          item.labelEdited = true;
          saveStore();
          renderPreview();
        }
      }
    });

    root.addEventListener("change", function (e) {
      var el = e.target;
      if (el.hasAttribute("data-bind") && (el.type === "checkbox" || el.tagName === "SELECT")) {
        onBind(el);
        return;
      }
      if (el.hasAttribute("data-check-toggle")) {
        var item = findItem(el.getAttribute("data-check-toggle"));
        if (item) {
          item.checked = el.checked;
          el.closest(".ros-edit-item").classList.toggle("ros-edit-item--off", !el.checked);
          saveStore();
          renderPreview();
        }
      }
    });

    root.addEventListener("click", function (e) {
      var t = e.target.closest("button");
      if (!t) return;
      var a = app.answers;
      if (t.hasAttribute("data-goto")) {
        goTo(Number(t.getAttribute("data-goto")));
        return;
      }
      if (t.hasAttribute("data-stop-move")) {
        var i = Number(t.getAttribute("data-stop-move"));
        var j = i + Number(t.getAttribute("data-dir"));
        if (j < 0 || j >= a.stops.length) return;
        var names = a.stops.map(function (s) {
          return s.name;
        });
        var tmp = names[i];
        names[i] = names[j];
        names[j] = tmp;
        names.forEach(function (n, idx) {
          a.stops[idx].name = n;
        });
        if (a.hqStop === i) a.hqStop = j;
        else if (a.hqStop === j) a.hqStop = i;
        if (a.fixed.stopIndex === i) a.fixed.stopIndex = j;
        else if (a.fixed.stopIndex === j) a.fixed.stopIndex = i;
        saveStore();
        renderAll();
        return;
      }
      if (t.hasAttribute("data-stop-remove")) {
        var r = Number(t.getAttribute("data-stop-remove"));
        if (a.stops.length <= 1) return;
        a.stops.splice(r, 1);
        if (a.hqStop === r) a.hqStop = -1;
        else if (a.hqStop > r) a.hqStop -= 1;
        if (a.fixed.stopIndex > r) a.fixed.stopIndex -= 1;
        a.fixed.stopIndex = Math.min(a.fixed.stopIndex, a.stops.length - 1);
        refreshGeneratedLabels();
        saveStore();
        renderAll();
        return;
      }
      if (t.id === "ros-add-stop") {
        var max = maxStopsForHours(effective(app.facts, a).hours || 5);
        if (a.stops.length >= max) return;
        a.stops.push({ name: "", travelAfter: 15 });
        refreshGeneratedLabels();
        saveStore();
        renderAll();
        return;
      }
      if (t.hasAttribute("data-check-remove")) {
        var id = t.getAttribute("data-check-remove");
        var items = ensureChecklist(app.facts, a);
        var gone = findItem(id);
        a.checklist.items = items.filter(function (x) {
          return x.id !== id;
        });
        if (gone && !gone.custom) {
          a.checklist.removed = (a.checklist.removed || []).concat([id]);
        }
        saveStore();
        renderAll();
        return;
      }
      if (t.id === "ros-add-item") {
        var input = document.getElementById("ros-new-item");
        var label = input.value.trim();
        if (!label) {
          input.focus();
          return;
        }
        ensureChecklist(app.facts, a).push({
          id: "custom-" + Date.now(),
          group: document.getElementById("ros-new-group").value,
          label: label,
          checked: true,
          custom: true,
        });
        saveStore();
        renderAll();
        var again = document.getElementById("ros-new-item");
        if (again) again.focus();
        return;
      }
      if (t.id === "ros-reset-checklist") {
        var hasCustom = ensureChecklist(app.facts, a).some(function (x) {
          return x.custom;
        });
        var dropCustom = hasCustom && window.confirm("Also remove the items you added yourself? Choose Cancel to keep them.");
        resetChecklist(app.facts, a, dropCustom);
        saveStore();
        renderAll();
      }
    });

    root.addEventListener("keydown", function (e) {
      if (e.key === "Enter" && e.target.id === "ros-new-item") {
        e.preventDefault();
        document.getElementById("ros-add-item").click();
      }
      if (e.key === "Enter" && e.target.hasAttribute("data-check-label")) {
        e.preventDefault();
        e.target.blur();
      }
    });

    window.addEventListener("resize", function () {
      root.querySelectorAll(".ros-edit-item__label").forEach(fitLabel);
    });

    document.getElementById("ros-back").addEventListener("click", function () {
      goTo(app.answers.step - 1);
    });
    document.getElementById("ros-next").addEventListener("click", function () {
      var msg = validateStep();
      if (msg) {
        document.getElementById("ros-step-msg").textContent = msg;
        return;
      }
      goTo(app.answers.step + 1);
    });

    document.getElementById("ros-date-select").addEventListener("change", function (e) {
      selectDate(e.target.value);
    });

    function pdfButton(id, kind, build) {
      var btn = document.getElementById(id);
      btn.addEventListener("click", async function () {
        var msg = document.getElementById("ros-dl-msg");
        var prev = btn.textContent;
        btn.disabled = true;
        btn.textContent = "Generating…";
        msg.textContent = "";
        try {
          await buildPdf(build(app.facts, app.answers), fileSlug(app.facts, app.answers, kind));
        } catch (err) {
          console.error("SEC run-of-show PDF:", err);
          msg.textContent = "Could not build the PDF. Use Print and choose Save as PDF.";
        } finally {
          btn.disabled = false;
          btn.textContent = prev;
        }
      });
    }
    pdfButton("ros-dl-plan", "run-of-show", renderPlanDoc);
    pdfButton("ros-dl-checklist", "checklist", renderChecklistDoc);
    document.getElementById("ros-print").addEventListener("click", function () {
      renderPreview();
      window.print();
    });
  }

  function init() {
    app.source = loadSource();
    if (!app.source) {
      document.getElementById("ros-empty").hidden = false;
      return;
    }
    app.store = loadStore();
    app.dates = promoDates(app.source.items);
    var pick = document.getElementById("ros-date-pick");
    var select = document.getElementById("ros-date-select");
    if (app.dates.length > 1) {
      pick.hidden = false;
      select.innerHTML = app.dates
        .map(function (d) {
          return '<option value="' + esc(d) + '">' + esc(longDate(d)) + "</option>";
        })
        .join("");
    }
    var initial = app.dates.indexOf(app.store.activeDate) !== -1 ? app.store.activeDate : app.dates[0];
    select.value = initial;
    document.getElementById("ros-app").hidden = false;
    bindEvents();
    selectDate(initial);
  }

  window.SEC_PromoRunOfShow = {
    buildSchedule: buildSchedule,
    generateChecklist: generateChecklist,
    defaultAnswers: defaultAnswers,
    factsForDate: factsForDate,
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
