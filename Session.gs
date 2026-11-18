function sessionKey_(chatId) {
  return CHATBOT.SESSION_PREFIX + String(chatId);
}

function getSession_(chatId) {
  const properties = PropertiesService.getScriptProperties();
  const raw = properties.getProperty(sessionKey_(chatId));
  if (!raw) return null;

  try {
    const session = JSON.parse(raw);
    const maxAge = CHATBOT.SESSION_TTL_HOURS * 60 * 60 * 1000;
    if (!session.updatedAt || Date.now() - session.updatedAt > maxAge) {
      clearSession_(chatId);
      return null;
    }
    return session;
  } catch (error) {
    clearSession_(chatId);
    return null;
  }
}

function saveSession_(chatId, changes) {
  const lock = LockService.getScriptLock();
  lock.waitLock(5000);
  try {
    const current = getSession_(chatId) || {};
    const session = Object.assign({}, current, changes, {
      updatedAt: Date.now()
    });
    PropertiesService.getScriptProperties().setProperty(
      sessionKey_(chatId),
      JSON.stringify(session)
    );
    return session;
  } finally {
    lock.releaseLock();
  }
}

function clearSession_(chatId) {
  PropertiesService.getScriptProperties().deleteProperty(sessionKey_(chatId));
}
