const fs = require("fs");
const path = require("path");

const FILE_PATH = path.join(__dirname, "../users.json");
let memoryUsers = [];

// Load data pengguna di awal
function loadUsers() {
  if (memoryUsers.length > 0) return memoryUsers;
  try {
    if (fs.existsSync(FILE_PATH)) {
      const data = fs.readFileSync(FILE_PATH, "utf8");
      memoryUsers = JSON.parse(data || "[]");
      return memoryUsers;
    }
  } catch (err) {
    console.log("Membaca file users.json gagal, menggunakan memori sementara.");
  }
  return memoryUsers;
}

// Simpan data pengguna tanpa memicu EROFS di Netlify
function saveUsers(users) {
  memoryUsers = users; // Selalu update di memori

  // Hanya tulis ke disk jika TIDAK berjalan di Netlify
  if (!process.env.NETLIFY) {
    try {
      fs.writeFileSync(FILE_PATH, JSON.stringify(users, null, 2));
    } catch (err) {
      console.warn("Gagal menulis file lokal:", err.message);
    }
  }
}

module.exports = {
  authenticate: (email, password) => {
    const users = loadUsers();
    return users.find((u) => u.email === email && u.password === password);
  },
  register: (userData) => {
    const users = loadUsers();
    if (users.some((u) => u.email === userData.email)) {
      throw new Error("Gmail sudah terdaftar.");
    }
    const newUser = { ...userData, id: Date.now().toString() };
    users.push(newUser);
    saveUsers(users);
    return newUser;
  },
};
