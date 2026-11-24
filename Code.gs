/**
 * Web App entry points for the StuntBot website and Telegram webhook.
 *
 * Website POST actions:
 *   { action: "create_telegram_pair", phone: "08..." }
 *   { action: "telegram_status", phone: "08..." }
 *   { ...child measurement fields... }
 *
 * Telegram webhook updates are authenticated by the "key" query parameter.
 */

function doPost(e) {
  try {
    var rawBody = e && e.postData && e.postData.contents;
    if (!rawBody) {
      return jsonOutput_({ status: "error", message: "Request body kosong." });
    }

    var body;
    try {
      body = JSON.parse(rawBody);
    } catch (parseError) {
      return jsonOutput_({ status: "error", message: "Format request harus JSON yang valid." });
    }

    // Admin route asks the script to approve a phone and create a short-lived pairing link.
    if (body.action === "create_telegram_pair") {
      return createTelegramPairResponse_(body.phone);
    }

    // A logged-in user checks the approval and gets their current pairing/chat URL.
    if (body.action === "telegram_status") {
      return telegramStatusResponse_(body.phone);
    }

    // Telegram webhook updates are signed with the key installed by setupTelegramWebhook().
    if (isTelegramUpdate_(body)) {
      var suppliedKey = e && e.parameter && e.parameter.key;
      if (!suppliedKey || suppliedKey !== getWebhookSecret_()) {
        console.error("Rejected Telegram webhook: missing or invalid key.");
        return jsonOutput_({ status: "error", message: "Webhook Telegram tidak terverifikasi." });
      }
      var chatId = body.message && body.message.chat ? body.message.chat.id : null;
      try {
        console.log("Telegram update received: " + (body.message ? "message" : "callback_query"));
        handleTelegramUpdate(body);
        return jsonOutput_({ status: "ok" });
      } catch (updateError) {
        console.error("Telegram update handler failed: " + updateError.message);
        if (chatId) {
          try {
            Telegram.sendMessage(chatId, "Maaf, bot mengalami kendala saat memproses pesan. Silakan kirim /start lagi atau hubungi admin.");
          } catch (replyError) {
            console.error("Telegram fallback reply failed: " + replyError.message);
          }
        }
        return jsonOutput_({ status: "error", message: "Update Telegram gagal diproses." });
      }
    }

    // Do not pass unknown actions into measurement validation (which otherwise reports a missing NIK).
    if (body.action) {
      return jsonOutput_({
        status: "error",
        message: "Aksi tidak dikenal. Pastikan Code.gs versi terbaru sudah di-deploy."
      });
    }

    return saveWebsiteRecord_(body);
  } catch (error) {
    console.error("doPost error: " + (error && error.message ? error.message : error));
    return jsonOutput_({
      status: "error",
      message: error && error.message ? error.message : "Permintaan tidak dapat diproses."
    });
  }
}

function createTelegramPairResponse_(phoneValue) {
  var phone = Sheets.normalizePhone_(phoneValue);
  if (!/^\d{8,15}$/.test(phone)) {
    return jsonOutput_({ status: "error", message: "Nomor HP harus terdiri dari 8–15 digit." });
  }

  // This action is called through the admin-only endpoint in the website server.
  var token = Session.createPairToken(phone);
  var username = Telegram.getBotUsername();
  return jsonOutput_({
    status: "ok",
    phone: phone,
    url: buildTelegramUrl_(username, "pair_" + token),
    expiresInSeconds: 600
  });
}

function telegramStatusResponse_(phoneValue) {
  var phone = Sheets.normalizePhone_(phoneValue);
  if (!/^\d{8,15}$/.test(phone)) {
    return jsonOutput_({ status: "error", message: "Nomor HP harus terdiri dari 8–15 digit." });
  }

  var chatId = Session.getChatIdForPhone(phone);
  var connected = Boolean(chatId);
  var approved = connected || Session.isPhoneApproved(phone);
  var pairToken = Session.getPairTokenForPhone(phone);

  // A previously approved but not yet connected phone gets a fresh ten-minute link.
  if (approved && !connected && !pairToken) {
    pairToken = Session.createPairToken(phone);
  }

  var ready = approved && (connected || Boolean(pairToken));
  var url = null;
  if (ready) {
    var username = Telegram.getBotUsername();
    url = connected
      ? buildTelegramUrl_(username)
      : buildTelegramUrl_(username, "pair_" + pairToken);
  }

  return jsonOutput_({
    status: "ok",
    approved: approved,
    connected: connected,
    ready: ready,
    url: url
  });
}

function saveWebsiteRecord_(body) {
  validateWebsiteRecord_(body);

  var rowNumber = Sheets.addRecord(body);
  var phone = Sheets.normalizePhone_(body.hp);
  var chatId = Session.getChatIdForPhone(phone);
  var telegramNotified = false;

  if (chatId) {
    try {
      Telegram.sendMessage(
        chatId,
        "Data pendataan untuk <b>" + escapeHtml_(body.nama) + "</b> sudah tersimpan.",
        { inline_keyboard: [[{ text: "Lihat hasil pendataan", callback_data: "result:" + rowNumber }]] }
      );
      telegramNotified = true;
    } catch (telegramError) {
      // A Telegram outage must not undo a record already saved in Sheets.
      console.error("Telegram notification failed: " + telegramError.message);
    }
  }

  return jsonOutput_({
    status: "ok",
    hp: phone,
    rowNumber: rowNumber,
    telegramNotified: telegramNotified
  });
}

function doGet(e) {
  var params = e && e.parameter ? e.parameter : {};

  if (params.telegram === "1") {
    try {
      return jsonOutput_({ status: "ok", username: Telegram.getBotUsername() });
    } catch (error) {
      console.error("Telegram username error: " + error.message);
      return jsonOutput_({ status: "error", message: error.message || "Gagal mengambil username bot." });
    }
  }

  if (params.view === "1") {
    try {
      return jsonOutput_({ status: "ok", data: Sheets.getRecentRecords(10) });
    } catch (error) {
      console.error("Read spreadsheet error: " + error.message);
      return jsonOutput_({ status: "error", message: "Gagal membaca spreadsheet." });
    }
  }

  return ContentService.createTextOutput("StuntBot Web Service");
}

function validateWebsiteRecord_(data) {
  if (!data || !/^\d{16}$/.test(String(data.nik || ""))) {
    throw new Error("NIK harus terdiri dari 16 digit.");
  }
  if (!String(data.nama || "").trim()) throw new Error("Nama wajib diisi.");

  var gender = String(data.jenis_kelamin || "").trim().toUpperCase();
  if (gender !== "L" && gender !== "P") {
    throw new Error("Jenis kelamin harus L atau P.");
  }

  var birthDate = String(data.tanggal_lahir || "");
  var measuredDate = String(data.tanggal_ukur || "");
  if (!isIsoDate_(birthDate) || !isIsoDate_(measuredDate)) {
    throw new Error("Tanggal lahir dan tanggal ukur harus berformat YYYY-MM-DD.");
  }
  if (measuredDate < birthDate) {
    throw new Error("Tanggal ukur tidak boleh sebelum tanggal lahir.");
  }

  var height = Number(data.tinggi_cm);
  if (!isFinite(height) || height <= 0) {
    throw new Error("Tinggi harus berupa angka lebih dari 0.");
  }

  var position = String(data.posisi_ukur || "").trim();
  if (position !== "Berdiri" && position !== "Terlentang") {
    throw new Error("Posisi pengukuran harus Berdiri atau Terlentang.");
  }

  var phone = Sheets.normalizePhone_(data.hp);
  if (!/^\d{8,15}$/.test(phone)) {
    throw new Error("Nomor HP harus terdiri dari 8–15 digit.");
  }
}

function isIsoDate_(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  var date = new Date(value + "T00:00:00Z");
  return !isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function isTelegramUpdate_(body) {
  return Boolean(body && (body.message || body.callback_query));
}

function buildTelegramUrl_(username, startParameter) {
  var safeUsername = String(username || "").replace(/^@/, "");
  if (!/^[A-Za-z0-9_]{5,32}$/.test(safeUsername)) {
    throw new Error("Username bot Telegram tidak valid. Periksa token TELEGRAM_TOKEN.");
  }
  var url = "https://t.me/" + safeUsername;
  return startParameter ? url + "?start=" + encodeURIComponent(startParameter) : url;
}

function jsonOutput_(value) {
  return ContentService.createTextOutput(JSON.stringify(value))
    .setMimeType(ContentService.MimeType.JSON);
}

function escapeHtml_(value) {
  return String(value == null ? "" : value).replace(/[&<>"']/g, function (character) {
    return {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    }[character];
  });
}

