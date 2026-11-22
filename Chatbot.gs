/**
 * chatbos.gs – Core chatbot logic for Telegram integration.
 * This file processes incoming Telegram updates and returns a response.
 */

/**
 * Entry point for Telegram webhook updates.
 * Called from code.gs (doPost) when a payload contains `message`.
 */
function handleTelegramUpdate(update) {
  try {
    var message = update.message;
    var chatId = message.chat.id;
    var text = (message.text || '').trim();

    // Simple command handling
    if (text === '/start' || text === '/help') {
      var helpMsg = '👋 Selamat datang!\n' +
        'Kirimkan nomor HP (tanpa spasi, contoh: 08123456789) untuk\n' +
        'menampilkan data balita yang sudah tercatat.';
      return Telegram.sendMessage(chatId, helpMsg);
    }

    // Assume the text is a phone number query
    var hpQuery = text.replace(/\D/g, ''); // keep digits only
    if (!hpQuery) {
      return Telegram.sendMessage(chatId, '⚠️ Mohon kirimkan nomor HP yang valid.');
    }

    // Search the spreadsheet for the given phone number
    var record = Sheets.findByPhone(hpQuery);
    if (!record) {
      return Telegram.sendMessage(chatId, '❌ Tidak ditemukan data untuk HP ' + hpQuery + '.');
    }

    // Build response message (using HTML parse mode)
    var resp = '<b>Data Balita (HP: ' + hpQuery + ')</b>\n' +
      '<b>NIK:</b> ' + record.nik + '\n' +
      '<b>Nama:</b> ' + record.nama + '\n' +
      '<b>Jenis Kelamin:</b> ' + record.jenisKelamin + '\n' +
      '<b>Tanggal Lahir:</b> ' + record.tanggalLahir + '\n' +
      '<b>Tanggal Ukur:</b> ' + record.tanggalUkur + '\n' +
      '<b>Tinggi:</b> ' + record.tinggi + ' cm\n' +
      '<b>Posisi Pengukuran:</b> ' + record.posisiUkur + '\n' +
      '<b>Stunting:</b> ' + (record.isStunted ? '✅ Ya' : '❌ Tidak');

    return Telegram.sendMessage(chatId, resp, CONFIG.DEFAULT_PARSE_MODE);
  } catch (e) {
    // Log error and send generic message back
    Logger.log('Error in handleTelegramUpdate: ' + e.stack);
    return Telegram.sendMessage(update.message.chat.id, '⚠️ Terjadi error: ' + e.message);
  }
}
