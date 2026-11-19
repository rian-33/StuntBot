/**
 * session.gs – Simple per‑chat session storage using UserProperties.
 *
 * Set / get / clear session data yang di‑key‑kan dengan chatId.
 */
var Session = (function () {
  var store = PropertiesService.getUserProperties(); // per‑user (script owner)

  function _key(chatId) {
    return "session_" + chatId;
  }

  /** Simpan objek (JSON‑stringified) untuk chatId */
  function set(chatId, dataObj) {
    store.setProperty(_key(chatId), JSON.stringify(dataObj));
  }

  /** Ambil objek yang tersimpan; kalau tidak ada, kembali null */
  function get(chatId) {
    var raw = store.getProperty(_key(chatId));
    return raw ? JSON.parse(raw) : null;
  }

  /** Hapus sesi untuk chatId */
  function clear(chatId) {
    store.deleteProperty(_key(chatId));
  }

  return {
    set: set,
    get: get,
    clear: clear,
  };
})();
