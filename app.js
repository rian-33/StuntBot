require("dotenv").config();
const express = require("express");
const path = require("path");
const crypto = require("crypto");

const formController = require("./controllers/formController");
const userAccount = require("./models/userAccount");

const app = express();
const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, "public");

// Parse incoming form and JSON payloads.
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

const sessions = new Map();
const userSessions = new Map();

function cookieValue(req, name) {
  const prefix = name + "=";
  const item = (req.headers.cookie || "").split(";").map(value => value.trim()).find(value => value.startsWith(prefix));
  return item ? decodeURIComponent(item.slice(prefix.length)) : null;
}

function findSession(req, cookieName, store) {
  const value = cookieValue(req, cookieName);
  const session = value && store.get(value);
  if (!session || session.expires < Date.now()) {
    if (value) store.delete(value);
    return null;
  }
  return { value, session };
}

function adminOnly(req, res, next) {
  if (!findSession(req, "stuntbot_admin", sessions)) {
    return res.status(401).json({ success: false, message: "Silakan masuk sebagai admin." });
  }
  next();
}

function userOrAdmin(req, res, next) {
  if (findSession(req, "stuntbot_admin", sessions)) return next();
  const user = findSession(req, "stuntbot_user", userSessions);
  if (!user) return res.status(401).json({ success: false, message: "Silakan masuk terlebih dahulu." });
  req.userSession = user.session;
  next();
}

function userOnly(req, res, next) {
  const user = findSession(req, "stuntbot_user", userSessions);
  if (!user) return res.status(401).json({ success: false, message: "Silakan masuk dengan nomor HP." });
  req.userSession = user.session;
  next();
}

app.post("/api/admin/login", (req, res) => {
  const username = String(req.body.username || "");
  const password = String(req.body.password || "");
  const expectedUser = process.env.ADMIN_USERNAME;
  const expectedPassword = process.env.ADMIN_PASSWORD;
  if (!expectedUser || !expectedPassword) return res.status(503).json({ success: false, message: "Kredensial admin belum dikonfigurasi." });
  const safeEqual = (a, b) => {
    const left = Buffer.from(a), right = Buffer.from(b);
    return left.length === right.length && crypto.timingSafeEqual(left, right);
  };
  if (!safeEqual(username, expectedUser) || !safeEqual(password, expectedPassword)) return res.status(401).json({ success: false, message: "Username atau kata sandi tidak sesuai." });
  const sessionId = crypto.randomBytes(32).toString("hex");
  sessions.set(sessionId, { expires: Date.now() + 8 * 60 * 60 * 1000 });
  res.setHeader("Set-Cookie", `stuntbot_admin=${sessionId}; HttpOnly; SameSite=Strict; Path=/; Max-Age=28800${process.env.NODE_ENV === "production" ? "; Secure" : ""}`);
  res.json({ success: true });
});
app.post("/api/user/login", (req, res) => {
  const phone = formController.normalizeTelegramPhone(req.body && req.body.phone);
  if (!/^\d{8,15}$/.test(phone)) {
    return res.status(400).json({ success: false, message: "Masukkan nomor HP 8–15 digit." });
  }

  const account = userAccount.authenticate(req.body && req.body.email, req.body && req.body.password);
  if (!account || account.phone !== phone) {
    return res.status(401).json({ success: false, message: "Gmail, kata sandi, atau nomor HP tidak sesuai." });
  }

  const sessionId = crypto.randomBytes(32).toString("hex");
  userSessions.set(sessionId, { ...account, expires: Date.now() + 12 * 60 * 60 * 1000 });
  res.setHeader("Set-Cookie", `stuntbot_user=${sessionId}; HttpOnly; SameSite=Strict; Path=/; Max-Age=43200${process.env.NODE_ENV === "production" ? "; Secure" : ""}`);
  return res.json({ success: true });
});
app.post("/api/user/register", (req, res) => {
  try {
    const account = userAccount.register(req.body);
    return res.status(201).json({ success: true, account, message: "Akun berhasil dibuat. Anda dapat masuk sekarang; verifikasi admin diperlukan untuk mengaktifkan chat Telegram." });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message || "Akun tidak dapat dibuat." });
  }
});
app.get("/api/user/session", userOnly, (req, res) => res.json({ success: true, name: req.userSession.name, email: req.userSession.email, phone: req.userSession.phone }));
app.post("/api/user/logout", userOnly, (req, res) => {
  const token = cookieValue(req, "stuntbot_user");
  if (token) userSessions.delete(token);
  res.setHeader("Set-Cookie", "stuntbot_user=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0");
  res.json({ success: true });
});
app.post("/api/admin/logout", adminOnly, (req, res) => {
  const token = cookieValue(req, "stuntbot_admin");
  if (token) sessions.delete(token);
  res.setHeader("Set-Cookie", "stuntbot_admin=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0");
  res.json({ success: true });
});
app.get("/api/admin/session", adminOnly, (req, res) => res.json({ success: true }));

// Serve the frontend, including public/index.html at "/".
app.use(express.static(PUBLIC_DIR));

// API endpoint for form submissions.
app.post("/submit", adminOnly, formController.handleSubmit);
app.get("/api/records", userOrAdmin, formController.handleList);
app.post("/api/telegram/link", adminOnly, formController.handleTelegramLink);
app.post("/api/telegram/status", userOnly, formController.handleTelegramStatus);
app.get("/api/schedules", userOrAdmin, (req, res) => res.json({ success: true, data: require("./models/schedule").list() }));
app.get("/api/admin/schedules", adminOnly, (req, res) => res.json({ success: true, data: require("./models/schedule").list() }));
app.post("/api/admin/schedules", adminOnly, (req, res) => {
  try { res.json({ success: true, data: require("./models/schedule").add(req.body) }); }
  catch (error) { res.status(400).json({ success: false, message: error.message }); }
});
app.delete("/api/admin/schedules/:id", adminOnly, (req, res) => {
  const removed = require("./models/schedule").remove(req.params.id);
  res.json({ success: true, removed });
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});


