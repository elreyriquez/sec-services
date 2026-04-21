/**
 * POST /api/quote-pdf — multipart field "file" (PDF), optional "meta" (JSON string).
 * Header X-Webhook-Secret must match WEBHOOK_SECRET.
 *
 * Env: WEBHOOK_SECRET, RESEND_API_KEY, TO_EMAIL, FROM_EMAIL, PORT (optional)
 */
"use strict";

require("dotenv").config();

const express = require("express");
const cors = require("cors");
const multer = require("multer");
const { Resend } = require("resend");

const PORT = Number(process.env.PORT) || 8787;
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || "";
const RESEND_API_KEY = process.env.RESEND_API_KEY || "";
const TO_EMAIL = process.env.TO_EMAIL || "";
const FROM_EMAIL =
  process.env.FROM_EMAIL || "SEC Quotations <onboarding@resend.dev>";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 12 * 1024 * 1024 },
});

const app = express();

app.use(
  cors({
    origin: true,
    methods: ["POST", "OPTIONS"],
    allowedHeaders: ["Accept", "Content-Type", "X-Webhook-Secret"],
    maxAge: 86400,
  })
);

app.get("/health", function (_req, res) {
  res.status(200).json({ ok: true });
});

app.post(
  "/api/quote-pdf",
  upload.single("file"),
  async function (req, res) {
    try {
      if (!WEBHOOK_SECRET) {
        return res.status(500).json({ error: "Server misconfigured (WEBHOOK_SECRET)" });
      }
      var sent = String(req.headers["x-webhook-secret"] || "");
      if (sent !== WEBHOOK_SECRET) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      if (!RESEND_API_KEY || !TO_EMAIL) {
        return res.status(500).json({ error: "Server misconfigured (RESEND_API_KEY / TO_EMAIL)" });
      }
      if (!req.file || !req.file.buffer || !req.file.buffer.length) {
        return res.status(400).json({ error: "Missing file" });
      }

      var meta = {};
      try {
        if (req.body && typeof req.body.meta === "string" && req.body.meta.length) {
          meta = JSON.parse(req.body.meta);
        }
      } catch (_e) {
        meta = {};
      }

      var name = typeof meta.name === "string" ? meta.name : "—";
      var email = typeof meta.email === "string" ? meta.email : "—";
      var phone = typeof meta.phone === "string" ? meta.phone : "—";
      var company = typeof meta.company === "string" ? meta.company : "";

      var subject = "SEC job request — " + name;
      var lines = [
        "<p><strong>New quotation PDF</strong> (submitted via sec-services cart).</p>",
        "<ul>",
        "<li><strong>Name:</strong> " + escapeHtml(name) + "</li>",
        "<li><strong>Email:</strong> " + escapeHtml(email) + "</li>",
        "<li><strong>Phone:</strong> " + escapeHtml(phone) + "</li>",
      ];
      if (company) {
        lines.push("<li><strong>Company:</strong> " + escapeHtml(company) + "</li>");
      }
      lines.push("</ul>");
      lines.push("<p>The job request was also sent through Formspree.</p>");

      var filename = req.file.originalname || "sec-quotation.pdf";
      if (!/\.pdf$/i.test(filename)) {
        filename += ".pdf";
      }

      var resend = new Resend(RESEND_API_KEY);
      var result = await resend.emails.send({
        from: FROM_EMAIL,
        to: TO_EMAIL.split(/[,\s]+/).map(function (s) {
          return s.trim();
        }).filter(Boolean),
        subject: subject,
        html: lines.join("\n"),
        attachments: [
          {
            filename: filename,
            content: req.file.buffer,
          },
        ],
      });

      if (result.error) {
        console.error("Resend error:", result.error);
        return res.status(502).json({ error: String(result.error.message || "Email send failed") });
      }

      return res.status(200).json({ ok: true, id: result.data && result.data.id });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Server error" });
    }
  }
);

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

app.listen(PORT, function () {
  console.log("sec-quote-pdf-webhook listening on " + PORT);
});
