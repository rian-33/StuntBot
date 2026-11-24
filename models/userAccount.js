const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const USERS_FILE = path.join(__dirname, "..", "users.json");
const HASH_BYTES = 64;

function readUsers() {
  try {
    const users = JSON.parse(fs.readFileSync(USERS_FILE, "utf8"));
    return Array.isArray(users) ? users : [];
  } catch (error) {
    if (error.code === "ENOENT") return [];
    throw error;
  }
}

function normalizePhone(value) {
  let phone = String(value || "").replace(/\D/g, "");
  if (phone.startsWith("62")) phone = "0" + phone.slice(2);
  return phone;
}

function publicAccount(user) {
  return { name: user.name, email: user.email, phone: user.phone };
}

function register(input = {}) {
  const name = String(input.name || "").trim();
  const email = String(input.email || "").trim().toLowerCase();
  const password = String(input.password || "");
  const phone = normalizePhone(input.phone);

  if (!name) throw new Error("Nama wajib diisi.");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("Alamat Gmail/email tidak valid.");
  if (password.length < 8) throw new Error("Kata sandi harus minimal 8 karakter.");
  if (!/^\d{8,15}$/.test(phone)) throw new Error("Nomor HP harus terdiri dari 8–15 digit.");

  const users = readUsers();
  if (users.some(user => user.email === email)) throw new Error("Email tersebut sudah terdaftar. Silakan masuk.");

  const salt = crypto.randomBytes(16).toString("hex");
  const passwordHash = crypto.scryptSync(password, salt, HASH_BYTES).toString("hex");
  const user = { id: crypto.randomUUID(), name, email, phone, salt, passwordHash };
  users.push(user);
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), "utf8");
  return publicAccount(user);
}

function authenticate(emailValue, passwordValue) {
  const email = String(emailValue || "").trim().toLowerCase();
  const password = String(passwordValue || "");
  const user = readUsers().find(item => item.email === email);
  if (!user || !user.salt || !user.passwordHash) return null;

  const actualHash = crypto.scryptSync(password, user.salt, HASH_BYTES);
  const expectedHash = Buffer.from(user.passwordHash, "hex");
  if (actualHash.length !== expectedHash.length || !crypto.timingSafeEqual(actualHash, expectedHash)) return null;
  return publicAccount(user);
}

module.exports = { register, authenticate };
