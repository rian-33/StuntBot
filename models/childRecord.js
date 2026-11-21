const ALLOWED_GENDERS = new Set(["L", "P"]);
const ALLOWED_POSITIONS = new Set(["Berdiri", "Terlentang"]);

function isValidDate(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function createChildRecord(input = {}) {
  const record = {
    nik: String(input.nik || "").trim(),
    nama: String(input.nama || "").trim(),
    jenis_kelamin: String(input.jenis_kelamin || "").trim().toUpperCase(),
    tanggal_lahir: String(input.tanggal_lahir || "").trim(),
    tanggal_ukur: String(input.tanggal_ukur || "").trim(),
    tinggi_cm: Number(input.tinggi_cm),
    posisi_ukur: String(input.posisi_ukur || "").trim(),
    hp: String(input.hp || "").trim(),
    isStunted: input.isStunted === true || String(input.isStunted).toLowerCase() === "true",
  };

  const errors = [];
  if (!/^\d{16}$/.test(record.nik)) errors.push("NIK harus terdiri dari 16 digit.");
  if (!record.nama) errors.push("Nama wajib diisi.");
  if (!ALLOWED_GENDERS.has(record.jenis_kelamin)) errors.push("Jenis kelamin harus L atau P.");
  if (!isValidDate(record.tanggal_lahir)) errors.push("Tanggal lahir tidak valid.");
  if (!isValidDate(record.tanggal_ukur)) errors.push("Tanggal ukur tidak valid.");
  if (isValidDate(record.tanggal_lahir) && isValidDate(record.tanggal_ukur) && record.tanggal_ukur < record.tanggal_lahir) {
    errors.push("Tanggal ukur tidak boleh sebelum tanggal lahir.");
  }
  if (!Number.isFinite(record.tinggi_cm) || record.tinggi_cm <= 0) errors.push("Tinggi harus berupa angka lebih dari 0.");
  if (!ALLOWED_POSITIONS.has(record.posisi_ukur)) errors.push("Posisi pengukuran harus Berdiri atau Terlentang.");
  if (!/^\d{8,15}$/.test(record.hp)) errors.push("Nomor HP harus terdiri dari 8–15 digit.");

  if (errors.length) {
    const error = new Error(errors.join(" "));
    error.statusCode = 400;
    throw error;
  }

  return record;
}

module.exports = { createChildRecord };
