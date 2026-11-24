/** Shared non-secret configuration for the Apps Script web app. */
const CHATBOT = Object.freeze({
  SPREADSHEET_ID: "17jQbCJkfOG68SGicnFonP_9EZclxfHQryldIBIf8KNI",
  SHEET_NAME: "HasilPendataan",
  REQUIRED_HEADERS: [
    "NIK",
    "Nama Lengkap",
    "Jenis Kelamin",
    "Tanggal Lahir",
    "Tanggal Ukur",
    "Tinggi (cm)",
    "Posisi Pengukuran",
    "Nomor HP",
    "Stunted?",
  ],
});

/** Store this token in Apps Script > Project Settings > Script Properties. */
function getTelegramBotToken_() {
  var token = PropertiesService.getScriptProperties().getProperty("TELEGRAM_TOKEN");
  if (!token || !token.trim()) {
    throw new Error("Atur TELEGRAM_TOKEN pada Script Properties terlebih dahulu.");
  }
  return token.trim();
}

/** Stable webhook key derived from the bot token; never expose the token in the URL. */
function getWebhookSecret_() {
  var digest = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    getTelegramBotToken_(),
  );
  return digest
    .slice(0, 16)
    .map(function (b) {
      return (b < 0 ? b + 256 : b).toString(16).padStart(2, "0");
    })
    .join("");
}
