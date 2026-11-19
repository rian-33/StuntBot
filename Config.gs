const CHATBOT = Object.freeze({
  SHEET_NAME: "HasilPendataan",
  SESSION_PREFIX: "SESSION_",
  SESSION_TTL_HOURS: 24 * 30,
  REQUIRED_HEADERS: [
    "Nama Lengkap",
    "Jenis Kelamin",
    "Tanggal Lahir",
    "Tanggal Ukur",
    "Tinggi (cm)",
    "Posisi Pengukuran",
    "Stunted?",
  ],
});

function getConfig_() {
  const properties = PropertiesService.getScriptProperties();
  return {
    telegramToken: properties.getProperty("TELEGRAM_TOKEN") || "",
    spreadsheetId: properties.getProperty("SPREADSHEET_ID") || "",
    webAppUrl: properties.getProperty("WEB_APP_URL") || "",
    webhookSecret: properties.getProperty("WEBHOOK_SECRET") || "",
  };
}
