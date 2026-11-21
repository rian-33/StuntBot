const fs = require("fs");
const path = require("path");
const fetch = require("node-fetch");
const { createChildRecord } = require("../models/childRecord");

const LOG_FILE = path.join(__dirname, "..", "data.log");

exports.handleList = async (req, res) => {
  const sheetsEndpoint = process.env.SHEETS_ENDPOINT;
  if (!sheetsEndpoint) {
    return res.status(503).json({ success: false, message: "SHEETS_ENDPOINT belum dikonfigurasi." });
  }

  try {
    const endpoint = new URL(sheetsEndpoint);
    endpoint.searchParams.set("view", "1");
    const response = await fetch(endpoint.toString());
    if (!response.ok) throw new Error(`Apps Script merespons HTTP ${response.status}.`);

    const result = await response.json();
    if (result.status !== "ok" || !Array.isArray(result.data)) {
      throw new Error(result.message || "Format data dari Apps Script tidak valid.");
    }

    return res.json({ success: true, data: result.data });
  } catch (error) {
    console.error("Read records error:", error.message);
    return res.status(502).json({ success: false, message: "Gagal mengambil data dari Google Sheets." });
  }
};

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
    if (!response.ok) throw new Error(`Apps Script merespons HTTP ${response.status}.`);

    const result = await response.json();
    if (result.status !== "ok") throw new Error(result.message || "Apps Script gagal menyimpan data.");

    const line = `${new Date().toISOString()} - data (${record.nama}) berhasil dimasukkan\n`;
    fs.appendFileSync(LOG_FILE, line, "utf8");
    return res.json({ success: true, message: "Data berhasil disimpan", hp: record.hp });
  } catch (error) {
    console.error("Submission error:", error.message);
    return res.status(502).json({ success: false, message: "Gagal menyimpan data ke Google Sheets." });
  }
};
