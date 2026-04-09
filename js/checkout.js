(function () {
  function buildInvoiceText(items, customer) {
    const cfg = window.SEC_CONFIG || {};
    const cur = window.SEC_Currency && window.SEC_Currency.get ? window.SEC_Currency.get() : "jmd";
    const fmt = (jmd) =>
      window.SEC_Currency && window.SEC_Currency.formatFromJmd
        ? window.SEC_Currency.formatFromJmd(jmd, cur)
        : "$" + Number(jmd).toLocaleString();
    const lines = [];
    lines.push(cfg.BUSINESS_NAME || "SEC Services");
    lines.push("QUOTATION REQUEST");
    lines.push("=".repeat(44));
    if (customer) {
      lines.push(`Name: ${customer.name || "—"}`);
      lines.push(`Email: ${customer.email || "—"}`);
      lines.push(`Phone: ${customer.phone || "—"}`);
      lines.push(`Company: ${customer.company || "—"}`);
      lines.push("-".repeat(44));
    }
    let sub = 0;
    items.forEach((i, n) => {
      const lineTotal = (i.inquire ? 0 : (i.price || 0) * (i.qty || 1));
      sub += lineTotal;
      lines.push(`${n + 1}. ${i.name} × ${i.qty || 1}`);
      if (i.inquire) lines.push(`   [Inquire — price TBD]`);
      else lines.push(`   ${fmt((i.price || 0) * (i.qty || 1))}`);
      if (i.notes) lines.push(`   Note: ${i.notes}`);
    });
    lines.push("-".repeat(44));
    lines.push(`Subtotal (priced items): ${fmt(sub)}`);
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
