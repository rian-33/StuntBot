/**
 * telegram.gs – Helper functions to talk to Telegram Bot API
 */
var Telegram = (function () {
  var baseUrl = "https://api.telegram.org/bot" + CONFIG.BOT_TOKEN;

  /**
   * Kirim pesan teks ke chat tertentu.
   *
   * @param {Number|String} chatId  ID chat (user atau grup)
   * @param {String}        text    Isi pesan
   * @param {String}        parseMode  (optional) 'HTML' | 'Markdown' | 'MarkdownV2'
   */
  function sendMessage(chatId, text, parseMode) {
    var payload = {
      method: "post",
      contentType: "application/json",
      muteHttpExceptions: true,
      payload: JSON.stringify({
        chat_id: chatId,
        text: text,
        parse_mode: parseMode || CONFIG.DEFAULT_PARSE_MODE,
      }),
    };
    var url = baseUrl + "/sendMessage";
    UrlFetchApp.fetch(url, payload);
  }

  /**
   * Set webhook URL untuk bot ini (hanya dipanggil sekali saat konfigurasi).
   *
   * @param {String} webhookUrl  URL publik yang mengarah ke Web‑App Anda.
   */
  function setWebhook(webhookUrl) {
    var url = baseUrl + "/setWebhook";
    var opts = {
      method: "post",
      contentType: "application/json",
      muteHttpExceptions: true,
      payload: JSON.stringify({ url: webhookUrl }),
    };
    var resp = UrlFetchApp.fetch(url, opts);
    Logger.log("setWebhook response: %s", resp.getContentText());
  }

  /**
   * Dapatkan info webhook yang sedang aktif (debug).
   */
  function getWebhookInfo() {
    var resp = UrlFetchApp.fetch(baseUrl + "/getWebhookInfo");
    Logger.log("WebhookInfo: %s", resp.getContentText());
  }

  // expose public API
  return {
    sendMessage: sendMessage,
    setWebhook: setWebhook,
    getWebhookInfo: getWebhookInfo,
  };
})();
