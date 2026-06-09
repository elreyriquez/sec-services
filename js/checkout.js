(function () {
  /** Match cart.js: priced lines only, finite numbers, inquire → 0 */
  function lineJmdTotal(i) {
    if (!i || i.inquire) return 0;
    const p = Number(i.price);
    const q = Number(i.qty);
    const qty = Number.isFinite(q) && q > 0 ? q : 1;
    if (!Number.isFinite(p)) return 0;
    return p * qty;
  }

  function buildInvoiceText(items, customer) {
    const cfg = window.SEC_CONFIG || {};
    const cur = window.SEC_Currency && window.SEC_Currency.get ? window.SEC_Currency.get() : "jmd";
    const fmt = (jmd) =>
      window.SEC_Currency && window.SEC_Currency.formatFromJmd
        ? window.SEC_Currency.formatFromJmd(jmd, cur)
        : "$" + Number(jmd).toLocaleString();
    const noteText = (i) =>
      window.SECCart && window.SECCart.displayNotes
        ? window.SECCart.displayNotes(i.notes || "")
        : i.notes || "";
    const formatEventDate = (iso) =>
      window.SECCart && window.SECCart.formatEventDateLabel
        ? window.SECCart.formatEventDateLabel(iso)
        : iso;
    const lines = [];
    lines.push(cfg.BUSINESS_NAME || "SEC Services");
    lines.push("QUOTATION REQUEST");
    lines.push("=".repeat(44));
    lines.push("NOTE: Figures below are indicative only. A binding quote is issued after SEC reviews your request.");
    lines.push("-".repeat(44));
    if (customer) {
      lines.push(`Name: ${customer.name || "—"}`);
      lines.push(`Email: ${customer.email || "—"}`);
      lines.push(`Phone: ${customer.phone || "—"}`);
      lines.push(`Company: ${customer.company || "—"}`);
      lines.push(`Address: ${customer.address || "—"}`);
      lines.push(`Parish: ${customer.parish || "—"}`);
      lines.push(`Country: ${customer.country || "—"}`);
      lines.push("-".repeat(44));
    }
    let sub = 0;
    const oneTime = [];
    const recurring = [];
    items.forEach((i) => {
      if (i.recurring) recurring.push(i);
      else oneTime.push(i);
    });

    function appendItemLines(list, startIndex) {
      let n = startIndex;
      list.forEach((i) => {
        const lineTotal = lineJmdTotal(i);
        sub += lineTotal;
        lines.push(`${n + 1}. ${i.name} × ${i.qty || 1}`);
        if (i.inquire) lines.push(`   [Inquire — price TBD]`);
        else lines.push(`   ${fmt(lineTotal)}`);
        const notes = noteText(i);
        if (notes) lines.push(`   Note: ${notes}`);
        n += 1;
      });
      return n;
    }

    let lineNum = 0;
    if (window.SECCart && typeof window.SECCart.groupOneTimeByEventDate === "function") {
      const groups = window.SECCart.groupOneTimeByEventDate(oneTime);
      groups.dated.forEach(([date, groupItems]) => {
        lines.push(`Event date: ${formatEventDate(date)}`);
        lineNum = appendItemLines(groupItems, lineNum);
        lines.push("");
      });
      lineNum = appendItemLines(groups.undated, lineNum);
    } else {
      lineNum = appendItemLines(oneTime, lineNum);
    }
    lines.push("-".repeat(44));
    lines.push(`Subtotal (one-time priced items): ${fmt(sub)}`);
    if (recurring.length) {
      lines.push("-".repeat(44));
      lines.push("Recurring (monthly):");
      let recSub = 0;
      recurring.forEach((i, n) => {
        const lineTotal = lineJmdTotal(i);
        recSub += lineTotal;
        lines.push(`${n + 1}. ${i.name} × ${i.qty || 1}`);
        lines.push(`   ${fmt(lineTotal)} / mo`);
        const notes = noteText(i);
        if (notes) lines.push(`   Note: ${notes}`);
      });
      lines.push(`Recurring subtotal: ${fmt(recSub)} / mo`);
    }
    const disc =
      window.SECCart && typeof SECCart.getDiscount === "function" ? SECCart.getDiscount() : null;
    if (disc && sub > 0) {
      const off = Math.round((sub * disc.percent) / 100);
      const tot = Math.max(0, sub - off);
      lines.push(`Discount (${disc.code} · ${disc.percent}%): -${fmt(off)}`);
      lines.push(`Total after discount: ${fmt(tot)}`);
    }
    if (cur === "usd" && window.SEC_Currency && window.SEC_Currency.jmdPerUsd) {
      lines.push(
        `(USD figures use ~${window.SEC_Currency.jmdPerUsd()} JMD = 1 USD — confirm on final quote.)`
      );
    }
    lines.push("");
    lines.push("Terms: Deposit/balance and usage rights as stated at checkout.");
    lines.push(`Sent: ${new Date().toISOString()}`);
    return lines.join("\n");
  }

  function downloadTxt(filename, text) {
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  window.SECCheckout = { buildInvoiceText, downloadTxt };
})();
