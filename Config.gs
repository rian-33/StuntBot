const CHATBOT = Object.freeze({
  SHEET_NAME: 'NilaiAbsensi',
  SESSION_PREFIX: 'SESSION_',
  SESSION_TTL_HOURS: 24 * 30,
  REQUIRED_HEADERS: [
    'NIM', 'Nama', 'Tugas', 'Quiz', 'MID', 'UAS',
    'Hadir', 'Izin', 'Sakit', 'Alfa'
  ]
});

function getConfig_() {
  const properties = PropertiesService.getScriptProperties();
  return {
    telegramToken: properties.getProperty('TELEGRAM_TOKEN') || '',
    spreadsheetId: properties.getProperty('SPREADSHEET_ID') || '',
    webAppUrl: properties.getProperty('WEB_APP_URL') || '',
    webhookSecret: properties.getProperty('WEBHOOK_SECRET') || ''
  };
}
