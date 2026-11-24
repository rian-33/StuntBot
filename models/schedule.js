const fs = require("fs");
const path = require("path");
const FILE = path.join(__dirname, "..", "schedules.json");

function list() {
  try { return JSON.parse(fs.readFileSync(FILE, "utf8")); }
  catch (error) { if (error.code === "ENOENT") return []; throw error; }
}
function add(input = {}) {
  const schedule = {
    id: require("crypto").randomUUID(),
    tanggal: String(input.tanggal || "").trim(),
    waktu: String(input.waktu || "").trim(),
    puskesmas: String(input.puskesmas || "").trim(),
    lokasi: String(input.lokasi || "").trim(),
    catatan: String(input.catatan || "").trim(),
  };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(schedule.tanggal) || Number.isNaN(Date.parse(schedule.tanggal))) throw new Error("Tanggal jadwal tidak valid.");
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(schedule.waktu)) throw new Error("Waktu harus menggunakan format JJ:MM.");
  if (!schedule.puskesmas) throw new Error("Nama puskesmas wajib diisi.");
  const schedules = [...list(), schedule].sort((a, b) => (a.tanggal + a.waktu).localeCompare(b.tanggal + b.waktu));
  fs.writeFileSync(FILE, JSON.stringify(schedules, null, 2), "utf8");
  return schedule;
}
function remove(id) {
  const schedules = list();
  const updated = schedules.filter(item => item.id !== id);
  if (updated.length !== schedules.length) fs.writeFileSync(FILE, JSON.stringify(updated, null, 2), "utf8");
  return updated.length !== schedules.length;
}
module.exports = { list, add, remove };
