/** Telegram Bot API client. Secrets are read from Script Properties only. */
var Telegram = (function () {
  function callApi_(method, payload) {
    var token = getTelegramBotToken_();
    var response = UrlFetchApp.fetch("https://api.telegram.org/bot" + token + "/" + method, {
      method: "post",
      contentType: "application/json",
      muteHttpExceptions: true,
      payload: JSON.stringify(payload || {})
    });

    var responseText = response.getContentText();
    var result;
    try {
      result = JSON.parse(responseText);
    } catch (error) {
      throw new Error("Telegram API " + method + " mengembalikan respons yang bukan JSON (HTTP " + response.getResponseCode() + ").");
    }

    if (!result.ok) {
      throw new Error("Telegram API " + method + " gagal: " + (result.description || "request ditolak."));
    }
    return result.result;
  }

  function sendMessage(chatId, text, replyMarkup) {
    var payload = { chat_id: chatId, text: text, parse_mode: "HTML" };
    if (replyMarkup) payload.reply_markup = replyMarkup;
    return callApi_("sendMessage", payload);
  }

  function answerCallbackQuery(callbackId, text) {
    return callApi_("answerCallbackQuery", {
      callback_query_id: callbackId,
      text: text || ""
    });
  }

  function getBotUsername() {
    var me = callApi_("getMe", {});
    if (!me || !me.username) throw new Error("Telegram tidak mengembalikan username bot.");
    return me.username;
  }

  function setWebhook(url) {
    return callApi_("setWebhook", {
      url: url,
      allowed_updates: ["message", "callback_query"]
    });
  }

  function getWebhookInfo() {
    return callApi_("getWebhookInfo", {});
  }

  return {
    callApi_: callApi_,
    sendMessage: sendMessage,
    answerCallbackQuery: answerCallbackQuery,
    getBotUsername: getBotUsername,
    setWebhook: setWebhook,
    getWebhookInfo: getWebhookInfo
  };
})();

/** Run once after deploying the Web App and setting TELEGRAM_TOKEN. */
function setupTelegramWebhook() {
  var webAppUrl = getWebAppUrl_();
  if (!webAppUrl) {
    throw new Error("Deploy Apps Script sebagai Web App terlebih dahulu.");
  }

  var separator = webAppUrl.indexOf("?") >= 0 ? "&" : "?";
  var webhookUrl = webAppUrl + separator + "key=" + getWebhookSecret_();
  var setResult = Telegram.setWebhook(webhookUrl);
  if (setResult !== true) throw new Error("Telegram menolak pemasangan webhook.");

  var info = Telegram.getWebhookInfo();
  if (!info.url || info.url !== webhookUrl) {
    throw new Error("Webhook tersimpan, tetapi URL webhook tidak cocok dengan deployment aktif.");
  }

  // Never log the webhook URL because it contains the secret query parameter.
  Logger.log("Webhook aktif dan menunjuk ke deployment Apps Script saat ini.");
  Logger.log("Menunggu update: " + Number(info.pending_update_count || 0));
  if (info.last_error_message) {
    Logger.log("Error terakhir Telegram: " + info.last_error_message);
  }
}

/** Inspect delivery state without printing the secret webhook URL. */
function diagnoseTelegramWebhook() {
  var info = Telegram.getWebhookInfo();
  var configuredUrl = getWebAppUrl_();
  var webhookUrl = String(info.url || "");
  var webhookBase = webhookUrl.split("?")[0];
  var deploymentBase = configuredUrl.split("?")[0];
  var keyMatch = webhookUrl.match(/[?&]key=([^&]+)/);
  var webhookKey = keyMatch ? decodeURIComponent(keyMatch[1]) : "";
  var expectedKey = getWebhookSecret_();

  Logger.log(JSON.stringify({
    configured: Boolean(webhookUrl),
    pointsToConfiguredDeployment: Boolean(webhookBase && deploymentBase && webhookBase === deploymentBase),
    configuredPathIsExec: /\/exec$/.test(deploymentBase),
    webhookPathIsExec: /\/exec(?:\?|$)/.test(webhookUrl),
    webhookKeyMatches: Boolean(webhookKey && webhookKey === expectedKey),
    pendingUpdateCount: Number(info.pending_update_count || 0),
    lastErrorDate: info.last_error_date
      ? new Date(Number(info.last_error_date) * 1000).toISOString()
      : null,
    lastErrorMessage: info.last_error_message || null,
    allowedUpdates: info.allowed_updates || []
  }, null, 2));
}


