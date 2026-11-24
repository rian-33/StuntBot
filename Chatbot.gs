/** Telegram conversation handlers: phone pairing and protected result buttons. */
function handleTelegramUpdate(update) {
  if (update.callback_query) return handleResultCallback_(update.callback_query);
  var message = update.message;
  if (!message || !message.chat || !message.from) return;
  var chatId = message.chat.id;
  var text = String(message.text || "").trim();

  var pairMatch = text.match(/^\/start(?:@\w+)?\s+pair_([a-f0-9]{32})$/i);
  if (pairMatch) {
    var expectedPhone = Session.getPairPhone(pairMatch[1]);
    if (!expectedPhone) {
      Telegram.sendMessage(chatId, "Tautan penghubung sudah kedaluwarsa. Kembali ke form dan tekan Hubungkan dengan bot lagi.");
      return;
    }
    Session.setPendingPair(chatId, pairMatch[1]);
    sendContactRequest_(chatId, "Bagikan nomor HP yang dimasukkan pada form untuk menyelesaikan penghubungan.");
    return;
  }

  if (/^\/(start|help)(?:@\w+)?(?:\s|$)/i.test(text)) {
    sendContactRequest_(chatId, "Selamat datang! Bagikan nomor HP Anda untuk menghubungkan akun Telegram dengan data pendataan.");
    return;
  }

  if (message.contact) {
    var contact = message.contact;
    if (!contact.user_id || String(contact.user_id) !== String(message.from.id)) {
      Telegram.sendMessage(chatId, "Mohon gunakan tombol Bagikan nomor HP saya agar kepemilikan akun dapat diverifikasi.");
      return;
    }

    var phone = Sheets.normalizePhone_(contact.phone_number);
    var pendingToken = Session.getPendingPair(chatId);
    if (!Session.isPhoneApproved(phone)) {
      Session.clearPendingPair(chatId);
      Telegram.sendMessage(chatId, "Nomor ini belum diverifikasi admin. Silakan hubungi petugas puskesmas.");
      return;
    }
    if (pendingToken) {
      var expected = Session.getPairPhone(pendingToken);
      if (!expected) {
        Session.clearPendingPair(chatId);
        Telegram.sendMessage(chatId, "Tautan penghubung sudah kedaluwarsa. Kembali ke form dan coba lagi.");
        return;
      }
      if (phone !== expected) {
        Telegram.sendMessage(chatId, "Nomor kontak tidak sama dengan nomor pada form. Kembali ke form untuk mencoba lagi.");
        return;
      }
      Session.consumePairToken(pendingToken);
      Session.clearPendingPair(chatId);
    }

    Session.bindPhone(phone, chatId);
    Telegram.sendMessage(chatId,
      "Nomor <b>" + escapeHtml_(phone) + "</b> berhasil dihubungkan. Anda akan menerima notifikasi saat data dengan nomor ini disimpan.",
      { remove_keyboard: true }
    );
    return;
  }

  Telegram.sendMessage(chatId, "Kirim /start untuk menghubungkan nomor HP Anda.");
}

function sendContactRequest_(chatId, text) {
  Telegram.sendMessage(chatId, text, {
    keyboard: [[{ text: "Bagikan nomor HP saya", request_contact: true }]],
    resize_keyboard: true,
    one_time_keyboard: true
  });
}

function handleResultCallback_(query) {
  var chatId = query.message && query.message.chat && query.message.chat.id;
  try {
    var match = String(query.data || "").match(/^result:(\d+)$/);
    if (!match || !chatId) throw new Error("Tombol hasil tidak valid.");
    var record = Sheets.getRecordByRow(Number(match[1]));
    if (!record || !Session.isPhoneBoundToChat(record.hp, chatId) || String(query.from.id) !== String(chatId)) {
      throw new Error("Akun Telegram ini tidak terhubung dengan data tersebut.");
    }
    Telegram.answerCallbackQuery(query.id, "Hasil pendataan dimuat.");
    Telegram.sendMessage(chatId, formatRecord_(record));
  } catch (error) {
    try { Telegram.answerCallbackQuery(query.id, error.message); } catch (ignored) {}
  }
}

function formatRecord_(record) {
  return "<b>Hasil Pendataan</b>\n" +
    "<b>Nama:</b> " + escapeHtml_(record.nama) + "\n" +
    "<b>Jenis kelamin:</b> " + escapeHtml_(record.jenisKelamin) + "\n" +
    "<b>Tanggal lahir:</b> " + escapeHtml_(record.tanggalLahir) + "\n" +
    "<b>Tanggal ukur:</b> " + escapeHtml_(record.tanggalUkur) + "\n" +
    "<b>Tinggi:</b> " + escapeHtml_(record.tinggi) + " cm\n" +
    "<b>Posisi ukur:</b> " + escapeHtml_(record.posisiUkur) + "\n" +
    "<b>Status stunting:</b> " + (record.isStunted ? "Ya" : "Tidak");
}


