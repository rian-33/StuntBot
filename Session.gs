/** Per-phone Telegram account binding, stored in Script Properties. */
var Session = (function () {
  var properties_ = function () { return PropertiesService.getScriptProperties(); };
  var key_ = function (phone) { return "TELEGRAM_CHAT_FOR_PHONE_" + Sheets.normalizePhone_(phone); };
  var pairKey_ = function (phone) { return "TELEGRAM_PHONE_PAIR_" + Sheets.normalizePhone_(phone); };
  var approvedKey_ = function (phone) { return "TELEGRAM_APPROVED_PHONE_" + Sheets.normalizePhone_(phone); };

  function bindPhone(phone, chatId) {
    var normalized = Sheets.normalizePhone_(phone);
    if (!/^\d{8,15}$/.test(normalized)) throw new Error("Nomor HP dari Telegram tidak valid.");
    if (!isPhoneApproved(normalized)) throw new Error("Nomor HP belum diverifikasi admin.");
    properties_().setProperties({
      [key_(normalized)]: String(chatId),
      [approvedKey_(normalized)]: "1"
    });
    return normalized;
  }
  function getChatIdForPhone(phone) {
    var normalized = Sheets.normalizePhone_(phone);
    return normalized ? properties_().getProperty(key_(normalized)) : null;
  }
  function createPairToken(phone) {
    var props = properties_();
    var normalized = Sheets.normalizePhone_(phone);
    if (!/^\d{8,15}$/.test(normalized)) throw new Error("Nomor HP tidak valid.");
    props.setProperty(approvedKey_(normalized), "1");
    var previousToken = props.getProperty(pairKey_(normalized));
    if (previousToken) props.deleteProperty("TELEGRAM_PAIR_" + previousToken);
    var all = props.getProperties();
    Object.keys(all).forEach(function (key) {
      if (key.indexOf("TELEGRAM_PAIR_") !== 0) return;
      try {
        if (Date.now() > JSON.parse(all[key]).expiresAt) props.deleteProperty(key);
      } catch (ignored) {
        props.deleteProperty(key);
      }
    });
    var token = Utilities.getUuid().replace(/-/g, "");
    props.setProperty("TELEGRAM_PAIR_" + token, JSON.stringify({
      phone: normalized,
      expiresAt: Date.now() + 10 * 60 * 1000
    }));
    props.setProperty(pairKey_(normalized), token);
    return token;
  }
  function getPairTokenForPhone(phone) {
    var props = properties_();
    var normalized = Sheets.normalizePhone_(phone);
    var token = normalized && props.getProperty(pairKey_(normalized));
    if (!token) return null;
    if (!getPairPhone(token)) {
      props.deleteProperty(pairKey_(normalized));
      return null;
    }
    return token;
  }
  function isPhoneApproved(phone) {
    var normalized = Sheets.normalizePhone_(phone);
    return Boolean(normalized && properties_().getProperty(approvedKey_(normalized)));
  }
  function getPairPhone(token) {
    var key = "TELEGRAM_PAIR_" + String(token || "");
    var raw = properties_().getProperty(key);
    if (!raw) return null;
    var pair;
    try { pair = JSON.parse(raw); } catch (error) {
      properties_().deleteProperty(key);
      return null;
    }
    if (Date.now() > pair.expiresAt) {
      properties_().deleteProperty(key);
      return null;
    }
    return pair.phone;
  }
  function consumePairToken(token) {
    var phone = getPairPhone(token);
    if (phone && properties_().getProperty(pairKey_(phone)) === String(token)) {
      properties_().deleteProperty(pairKey_(phone));
    }
    properties_().deleteProperty("TELEGRAM_PAIR_" + String(token || ""));
  }
  function setPendingPair(chatId, token) {
    properties_().setProperty("TELEGRAM_PENDING_PAIR_" + chatId, String(token));
  }
  function getPendingPair(chatId) {
    return properties_().getProperty("TELEGRAM_PENDING_PAIR_" + chatId);
  }
  function clearPendingPair(chatId) {
    properties_().deleteProperty("TELEGRAM_PENDING_PAIR_" + chatId);
  }
  function isPhoneBoundToChat(phone, chatId) {
    return String(getChatIdForPhone(phone) || "") === String(chatId);
  }
  return { bindPhone: bindPhone, getChatIdForPhone: getChatIdForPhone, isPhoneBoundToChat: isPhoneBoundToChat, createPairToken: createPairToken, getPairPhone: getPairPhone, getPairTokenForPhone: getPairTokenForPhone, isPhoneApproved: isPhoneApproved, consumePairToken: consumePairToken, setPendingPair: setPendingPair, getPendingPair: getPendingPair, clearPendingPair: clearPendingPair };
})();

