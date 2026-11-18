const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');

// Path to log file
const LOG_FILE = path.join(__dirname, '..', 'data.log');

// Google Sheets endpoint (set via env var or hard‑code here)
const SHEETS_ENDPOINT = process.env.SHEETS_ENDPOINT || 'https://example.com/your-appscript-endpoint';

// Render the static HTML form
exports.renderForm = (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
};

// Handle form submission
exports.handleSubmit = async (req, res) => {
  const data = req.body;
  const nama = data.nama || data.nama_lengkap || 'UNKNOWN';
  const tinggi = parseFloat(data.tinggi_cm);
  const tanggalLahir = data.tanggal_lahir;
  const tanggalUkur = data.tanggal_ukur;

  // Simple age calculation in months
  const ageMonths = Math.floor((new Date(tanggalUkur) - new Date(tanggalLahir)) / (1000 * 60 * 60 * 24 * 30));
  // Very simple stunting rule: if height < 75 cm for children < 24 months, flag as stunted
  const isStunted = ageMonths < 24 && tinggi < 75;

  const logMessage = `data (${nama}) berhasil dimasukkan`;
  const line = `${new Date().toISOString()} - ${logMessage}\n`;

  try {
    // Append to local log file
    fs.appendFileSync(LOG_FILE, line, { encoding: 'utf8' });
    // Send data to Google Sheets via Apps Script endpoint
    await fetch(SHEETS_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...data, isStunted })
    });
    // Respond to client with stunting result
    res.json({
      success: true,
      message: 'Data berhasil disimpan',
      stunted: isStunted,
      note: isStunted ? 'Anak terkena stunting' : 'Anak tidak terkena stunting'
    });
  } catch (err) {
    console.error('Logging or Sheets error', err);
    res.status(500).json({ success: false, message: 'Gagal menyimpan data' });
  }
};
