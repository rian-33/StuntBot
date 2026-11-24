/** Web app endpoints: website submissions, Telegram updates, and recent records. */
function doPost(e) {
  try {
    var raw = e && e.postData && e.postData.contents;
    if (!raw) return jsonOutput_({ status: "error", message: "Request body kosong." });
    var body = JSON.parse(raw);

    // The website requests an expiring, one-time pairing link for the entered phone.
    if (body && body.action === "create_telegram_pair") {
      var phone = Sheets.normalizePhone_(body.phone);
      if (!/^\d{8,15}$/.test(phone)) {
        return jsonOutput_({ status: "error", message: "Nomor HP tidak valid." });
      }
      var pairToken = Session.createPairToken(phone);
      var username = Telegram.getBotUsername();
      return jsonOutput_({
        status: "ok",
        url: "https://t.me/" + username + "?start=pair_" + pairToken
      });
    }

    if (body && body.action === "telegram_status") {
      var statusPhone = Sheets.normalizePhone_(body.phone);
      if (!/^\d{8,15}$/.test(statusPhone)) {
        return jsonOutput_({ status: "error", message: "Nomor HP tidak valid." });
      }
      var connected = Boolean(Session.getChatIdForPhone(statusPhone));
      var activePair = Session.getPairTokenForPhone(statusPhone);
      var approved = connected || Session.isPhoneApproved(statusPhone) || Boolean(activePair);
      if (approved && !connected && !activePair) {
        activePair = Session.createPairToken(statusPhone);
      }
      var ready = approved && (connected || Boolean(activePair));
      var pairUrl = null;
      if (ready) {
        var botUsername = Telegram.getBotUsername();
        pairUrl = connected
          ? "https://t.me/" + botUsername
          : "https://t.me/" + botUsername + "?start=pair_" + activePair;
      }
      return jsonOutput_({
        status: "ok",
        approved: approved,
        connected: connected,
        ready: ready,
        url: pairUrl
      });
    }

    // Telegram sends message/callback updates to the same deployed web app URL.
    if (body && (body.message || body.callback_query)) {
      if (!e.parameter || e.parameter.key !== getWebhookSecret_()) {
        return jsonOutput_({ status: "error", message: "Webhook tidak terverifikasi." });
      }
      handleTelegramUpdate(body);
      return jsonOutput_({ status: "ok" });
    }

    if (body && body.action) {
      return jsonOutput_({ status: "error", message: "Aksi tidak dikenal. Deploy versi terbaru Code.gs." });
    }

    validateWebsiteRecord_(body);
    var rowNumber = Sheets.addRecord(body);
    var phone = Sheets.normalizePhone_(body.hp);
    var chatId = Session.getChatIdForPhone(phone);
    var notified = false;
    if (chatId) {
      try {
        Telegram.sendMessage(chatId,
          "Data pendataan untuk <b>" + escapeHtml_(body.nama) + "</b> sudah tersimpan.",
          { inline_keyboard: [[{ text: "Lihat hasil pendataan", callback_data: "result:" + rowNumber }]] }
        );
        notified = true;
      } catch (telegramError) {
        // A Telegram outage must not roll back a successfully stored record.
        console.error("Telegram notification failed: " + telegramError.message);
      }
    }
    return jsonOutput_({ status: "ok", hp: phone, telegramNotified: notified });
  } catch (error) {
    console.error("doPost error: " + error.message);
    return jsonOutput_({ status: "error", message: error.message });
  }
}

function doGet(e) {
  if (e && e.parameter && e.parameter.telegram === "1") {
    try {
      return jsonOutput_({ status: "ok", username: Telegram.getBotUsername() });
    } catch (error) {
      console.error("Telegram username error: " + error.message);
      return jsonOutput_({ status: "error", message: "Gagal mengambil username bot." });
    }
  }
  if (e && e.parameter && e.parameter.view === "1") {
    try {
      return jsonOutput_({ status: "ok", data: Sheets.getRecentRecords(10) });
    } catch (error) {
      console.error("doGet error: " + error.message);
      return jsonOutput_({ status: "error", message: "Gagal membaca spreadsheet." });
    }
  }
  return ContentService.createTextOutput("StuntBot Web Service");
}

function validateWebsiteRecord_(data) {
  if (!data || !/^\d{16}$/.test(String(data.nik || ""))) throw new Error("NIK harus 16 digit.");
  if (!String(data.nama || "").trim()) throw new Error("Nama wajib diisi.");
  if (!["L", "P"].includes(String(data.jenis_kelamin || "").trim().toUpperCase())) throw new Error("Jenis kelamin harus L atau P.");

  var birth = String(data.tanggal_lahir || "");
  var measured = String(data.tanggal_ukur || "");
  var datePattern = /^\d{4}-\d{2}-\d{2}$/;
  if (!datePattern.test(birth) || !datePattern.test(measured) ||
      isNaN(Date.parse(birth + "T00:00:00Z")) || isNaN(Date.parse(measured + "T00:00:00Z")) ||
      new Date(birth + "T00:00:00Z").toISOString().slice(0, 10) !== birth ||
      new Date(measured + "T00:00:00Z").toISOString().slice(0, 10) !== measured) {
    throw new Error("Tanggal lahir dan tanggal ukur tidak valid.");
  }
  if (measured < birth) throw new Error("Tanggal ukur tidak boleh sebelum tanggal lahir.");
  if (!isFinite(Number(data.tinggi_cm)) || Number(data.tinggi_cm) <= 0) throw new Error("Tinggi harus berupa angka lebih dari 0.");
  if (!["Berdiri", "Terlentang"].includes(String(data.posisi_ukur || "").trim())) throw new Error("Posisi pengukuran tidak valid.");
  if (!/^\d{8,15}$/.test(Sheets.normalizePhone_(data.hp))) throw new Error("Nomor HP tidak valid.");
}

function jsonOutput_(value) {
  return ContentService.createTextOutput(JSON.stringify(value))
    .setMimeType(ContentService.MimeType.JSON);
}

function escapeHtml_(value) {
  return String(value == null ? "" : value).replace(/[&<>"']/g, function (ch) {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch];
  });
}



