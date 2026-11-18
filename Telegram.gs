function telegramRequest_(method, payload) {
  const token = getConfig_().telegramToken;
  if (!token) throw new Error('TELEGRAM_TOKEN belum dikonfigurasi.');

  const response = UrlFetchApp.fetch(
    'https://api.telegram.org/bot' + token + '/' + method,
    {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    }
  );
  const result = JSON.parse(response.getContentText());
  if (!result.ok) {
    throw new Error('Telegram API gagal: ' + (result.description || 'unknown error'));
  }
  return result;
}

function sendMessage_(chatId, text, showMenu) {
  const payload = {
    chat_id: String(chatId),
    text: text
  };

  if (showMenu) {
    payload.reply_markup = {
      keyboard: [
        ['Nilai Tugas', 'Nilai Quiz'],
        ['Nilai MID', 'Nilai UAS'],
        ['Kehadiran', 'Ganti NIM']
      ],
      resize_keyboard: true
    };
  }

  return telegramRequest_('sendMessage', payload);
}

/** Jalankan sekali setelah Web App selesai di-deploy. */
function setTelegramWebhook() {
  const config = getConfig_();
  if (!config.webAppUrl || !config.webhookSecret) {
    throw new Error('WEB_APP_URL atau WEBHOOK_SECRET belum diisi.');
  }

  const result = telegramRequest_('setWebhook', {
    url: config.webAppUrl + '?key=' + encodeURIComponent(config.webhookSecret),
    drop_pending_updates: true,
    max_connections: 1,
    allowed_updates: ['message']
  });
  console.log('Webhook berhasil didaftarkan.');
  return result;
}
