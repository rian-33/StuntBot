const fs = require("fs");
const path = require("path");
const fetch = require("node-fetch");
const { createChildRecord } = require("../models/childRecord");

const LOG_FILE = path.join(__dirname, "..", "data.log");
const telegramPairingLinks = new Map();

function appsScriptErrorMessage(message, fallback) {
  const text = String(message || "");
  if (/NIK harus 16 digit|Aksi tidak dikenal/i.test(text)) {
    return "Deployment Apps Script belum diperbarui. Deploy versi terbaru Code.gs, Session.gs, dan Chatbot.gs.";
  }
  return text || fallback;
}

exports.handleList = async (req, res) => {
  const sheetsEndpoint = process.env.SHEETS_ENDPOINT;
  if (!sheetsEndpoint) {
    return res.status(503).json({ success: false, message: "SHEETS_ENDPOINT belum dikonfigurasi." });
  }

  try {
    const endpoint = new URL(sheetsEndpoint);
    endpoint.searchParams.set("view", "1");
    const response = await fetch(endpoint.toString());
    const responseText = await response.text();
    let result;
    try {
      result = JSON.parse(responseText);
    } catch (parseError) {
      throw new Error("Apps Script tidak mengembalikan JSON. Periksa SHEETS_ENDPOINT dan deployment Web App.");
    }
    if (!response.ok) throw new Error("Apps Script merespons HTTP " + response.status + ".");
    if (result.status !== "ok" || !Array.isArray(result.data)) {
      throw new Error(result.message || "Format data dari Apps Script tidak valid.");
    }
    return res.json({ success: true, data: result.data });
  } catch (error) {
    console.error("Read records error:", error.message);
    return res.status(502).json({ success: false, message: error.message || "Gagal mengambil data dari Google Sheets." });
  }
};

exports.handleTelegramLink = async (req, res) => {
  const sheetsEndpoint = process.env.SHEETS_ENDPOINT;
  if (!sheetsEndpoint) {
    return res.status(503).json({ success: false, message: "SHEETS_ENDPOINT belum dikonfigurasi." });
  }

  const phone = normalizeTelegramPhone((req.body && req.body.phone) || "");
  if (!/^\d{8,15}$/.test(phone)) {
    return res.status(400).json({ success: false, message: "Nomor HP harus 8–15 digit." });
  }

  try {
    const response = await fetch(sheetsEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "create_telegram_pair", phone }),
    });
    const responseText = await response.text();
    let result;
    try {
      result = JSON.parse(responseText);
    } catch (parseError) {
      throw new Error("Apps Script tidak mengembalikan JSON. Periksa SHEETS_ENDPOINT dan deploy Web App versi terbaru.");
    }
    if (!response.ok) throw new Error("Apps Script merespons HTTP " + response.status + ".");
    if (result.status !== "ok" || !result.url) {
      throw new Error(appsScriptErrorMessage(result.message, "Apps Script gagal membuat tautan."));
    }
    const url = validateTelegramUrl(result.url);
    const lifetime = Number(result.expiresInSeconds) > 0 ? Number(result.expiresInSeconds) : 600;
    telegramPairingLinks.set(phone, { url, expiresAt: Date.now() + lifetime * 1000 });
    return res.json({ success: true, url });
  } catch (error) {
    console.error("Telegram link error:", error.message);
    return res.status(502).json({ success: false, message: error.message || "Tautan bot Telegram belum dapat dibuat." });
  }
};

exports.lookupTelegramStatus = async value => {
  const sheetsEndpoint = process.env.SHEETS_ENDPOINT;
  if (!sheetsEndpoint) throw new Error("SHEETS_ENDPOINT belum dikonfigurasi.");

  const phone = normalizeTelegramPhone(value);
  if (!/^\d{8,15}$/.test(phone)) throw new Error("Masukkan nomor HP 8–15 digit.");

  const response = await fetch(sheetsEndpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "telegram_status", phone }),
  });
  const responseText = await response.text();
  let result;
  try {
    result = JSON.parse(responseText);
  } catch (parseError) {
    throw new Error("Apps Script tidak mengembalikan JSON. Deploy ulang Code.gs dan Session.gs.");
  }
  if (!response.ok) throw new Error("Apps Script merespons HTTP " + response.status + ".");
  if (result.status !== "ok") throw new Error(appsScriptErrorMessage(result.message, "Status Telegram tidak dapat diperiksa."));
  return result;
};

exports.handleTelegramStatus = async (req, res) => {
  const phone = normalizeTelegramPhone(req.userSession && req.userSession.phone);
  if (!/^\d{8,15}$/.test(phone)) {
    return res.status(400).json({
      success: false,
      message: "Nomor HP akun tidak tersedia. Keluar lalu masuk kembali sebagai pengguna."
    });
  }

  let status = null;
  let statusError = null;
  try {
    status = await exports.lookupTelegramStatus(phone);
  } catch (error) {
    statusError = error;
  }

  const cachedPair = telegramPairingLinks.get(phone);
  if (cachedPair && cachedPair.expiresAt > Date.now() &&
      (statusError || !status.approved || !status.ready || !status.url)) {
    return res.json({
      success: true,
      approved: true,
      ready: true,
      connected: false,
      url: cachedPair.url,
      fallback: true
    });
  }

  if (statusError) {
    if (!/Masukkan nomor HP 8–15 digit/.test(statusError.message)) {
      console.error("Telegram status error:", statusError.message);
    }
    return res.status(502).json({
      success: false,
      message: statusError.message || "Status Telegram tidak dapat diperiksa."
    });
  }

  if (cachedPair && cachedPair.expiresAt <= Date.now()) telegramPairingLinks.delete(phone);
  try {
    return res.json({
      success: true,
      approved: status.approved === true,
      ready: status.ready === true,
      connected: status.connected === true,
      url: status.url ? validateTelegramUrl(status.url) : null
    });
  } catch (error) {
    console.error("Invalid Telegram URL:", error.message);
    return res.status(502).json({ success: false, message: "Tautan Telegram yang diterima tidak valid." });
  }
};

function validateTelegramUrl(value) {
  let url;
  try {
    url = new URL(String(value || ""));
  } catch (error) {
    throw new Error("Tautan Telegram tidak valid.");
  }
  if (url.protocol !== "https:" || url.hostname !== "t.me" || !url.pathname.startsWith("/")) {
    throw new Error("Tautan Telegram tidak valid.");
  }
  return url.toString();
}

function normalizeTelegramPhone(value) {
  let phone = String(value || "").replace(/\D/g, "");
  if (phone.startsWith("62")) phone = "0" + phone.slice(2);
  return phone;
}
exports.normalizeTelegramPhone = normalizeTelegramPhone;

exports.handleSubmit = async (req, res) => {
  let record;
  try {
    record = createChildRecord(req.body);
  } catch (error) {
    return res.status(error.statusCode || 400).json({ success: false, message: error.message });
  }

  const sheetsEndpoint = process.env.SHEETS_ENDPOINT;
  if (!sheetsEndpoint) {
    return res.status(503).json({ success: false, message: "SHEETS_ENDPOINT belum dikonfigurasi." });
  }

  try {
    const response = await fetch(sheetsEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(record),
    });
    const responseText = await response.text();
    let result;
    try {
      result = JSON.parse(responseText);
    } catch (parseError) {
      throw new Error("Apps Script tidak mengembalikan JSON. Periksa SHEETS_ENDPOINT dan deploy Web App versi terbaru.");
    }
    if (!response.ok) throw new Error("Apps Script merespons HTTP " + response.status + ".");
    if (result.status !== "ok") {
      throw new Error(result.message || "Apps Script gagal menyimpan data.");
    }

    const line = new Date().toISOString() + " - data (" + record.nama + ") berhasil dimasukkan\n";
    fs.appendFileSync(LOG_FILE, line, "utf8");
    return res.json({ success: true, message: "Data berhasil disimpan", hp: record.hp });
  } catch (error) {
    console.error("Submission error:", error.message);
    return res.status(502).json({ success: false, message: error.message || "Gagal menyimpan data ke Google Sheets." });
  }
};



