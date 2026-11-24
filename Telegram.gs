/** Telegram Bot API client. */
var Telegram = (function () {
  function callApi_(method, payload) {
    var token = getTelegramBotToken_();
    var response = UrlFetchApp.fetch("https://api.telegram.org/bot" + token + "/" + method, {
      method: "post", contentType: "application/json", muteHttpExceptions: true,
      payload: JSON.stringify(payload || {})
    });
    var result = JSON.parse(response.getContentText());
    if (!result.ok) throw new Error("Telegram API: " + (result.description || "request gagal"));
    return result.result;
  }
  function sendMessage(chatId, text, replyMarkup) {
    var payload = { chat_id: chatId, text: text, parse_mode: "HTML" };
    if (replyMarkup) payload.reply_markup = replyMarkup;
    return callApi_("sendMessage", payload);
  }
  function answerCallbackQuery(callbackId, text) {
    return callApi_("answerCallbackQuery", { callback_query_id: callbackId, text: text || "" });
  }
  function getBotUsername() {
    var me = callApi_("getMe", {});
    return me.username;
  }
  function setWebhook(url) {
    return callApi_("setWebhook", { url: url, allowed_updates: ["message", "callback_query"] });
  }
  return { callApi_: callApi_, sendMessage: sendMessage, answerCallbackQuery: answerCallbackQuery, getBotUsername: getBotUsername, setWebhook: setWebhook };
})();

/** Run once manually after deploying the Apps Script web app. */
function setupTelegramWebhook() {
  var webAppUrl = ScriptApp.getService().getUrl();
  if (!webAppUrl) throw new Error("Deploy Apps Script sebagai Web App terlebih dahulu.");
  var url = webAppUrl + (webAppUrl.indexOf("?") >= 0 ? "&" : "?") + "key=" + getWebhookSecret_();
  Telegram.setWebhook(url);
  Logger.log("Webhook Telegram berhasil dipasang.");
}

