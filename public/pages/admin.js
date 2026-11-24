const $ = id => document.getElementById(id);
const loginCard = $("loginCard");
const dashboard = $("dashboard");
const loginForm = $("loginForm");

async function request(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok || !result.success) {
    throw new Error(result.message || `Server merespons dengan status ${response.status}.`);
  }
  return result;
}

async function showDashboard() {
  loginCard.hidden = true;
  dashboard.hidden = false;
  $("logout").hidden = false;
  await loadSchedules();
}

loginForm.addEventListener("submit", async event => {
  event.preventDefault();
  const notice = $("loginNotice");
  const button = $("loginButton");
  notice.textContent = "Memeriksa akun admin…";
  notice.className = "notice";
  button.disabled = true;
  const form = new FormData(loginForm);
  try {
    await request("/api/admin/login", {
      method: "POST",
      body: JSON.stringify({ username: form.get("username"), password: form.get("password") }),
    });
    notice.textContent = "Login berhasil. Membuka dashboard…";
    notice.className = "notice success";
    await showDashboard();
  } catch (error) {
    notice.textContent = error.message.includes("Failed to fetch")
      ? "Server tidak dapat dihubungi. Pastikan aplikasi berjalan dan coba lagi."
      : error.message;
    notice.className = "notice error";
  } finally {
    button.disabled = false;
  }
});

$("logout").addEventListener("click", async () => {
  try {
    await request("/api/admin/logout", { method: "POST" });
  } finally {
    dashboard.hidden = true;
    loginCard.hidden = false;
    $("logout").hidden = true;
    loginForm.reset();
  }
});

$("scheduleForm").addEventListener("submit", async event => {
  event.preventDefault();
  const form = event.currentTarget;
  const button = $("saveSchedule");
  const notice = $("scheduleNotice");
  const fields = new FormData(form);
  notice.textContent = "Menyimpan jadwal…";
  notice.className = "notice";
  button.disabled = true;
  try {
    await request("/api/admin/schedules", {
      method: "POST",
      body: JSON.stringify(Object.fromEntries(fields)),
    });
    form.reset();
    notice.textContent = "Jadwal tersimpan dan sudah tersedia untuk pengguna.";
    notice.className = "notice success";
    await loadSchedules();
  } catch (error) {
    notice.textContent = error.message;
    notice.className = "notice error";
  } finally {
    button.disabled = false;
  }
});

async function loadSchedules() {
  const root = $("schedules");
  try {
    const result = await request("/api/admin/schedules");
    root.replaceChildren();
    if (!result.data.length) {
      root.textContent = "Belum ada jadwal. Tambahkan jadwal melalui formulir di atas.";
      return;
    }
    result.data.forEach(item => {
      const row = document.createElement("article");
      row.className = "schedule-row";
      const details = document.createElement("div");
      const title = document.createElement("strong");
      title.textContent = `${item.tanggal} · ${item.waktu} — ${item.puskesmas}`;
      details.append(title);
      if (item.lokasi) {
        const location = document.createElement("p");
        location.textContent = `Alamat: ${item.lokasi}`;
        details.append(location);
      }
      if (item.catatan) {
        const note = document.createElement("p");
        note.textContent = `Catatan: ${item.catatan}`;
        details.append(note);
      }
      if (!item.lokasi && !item.catatan) {
        const emptyDetail = document.createElement("p");
        emptyDetail.textContent = "Tidak ada alamat atau catatan tambahan.";
        details.append(emptyDetail);
      }
      const remove = document.createElement("button");
      remove.type = "button";
      remove.className = "delete-button";
      remove.innerHTML = '<svg aria-hidden="true"><use href="#a-trash"/></svg><span>Hapus</span>';
      remove.setAttribute("aria-label", `Hapus jadwal ${item.puskesmas} tanggal ${item.tanggal}`);
      remove.addEventListener("click", async () => {
        if (!window.confirm("Hapus jadwal ini?")) return;
        try {
          await request(`/api/admin/schedules/${encodeURIComponent(item.id)}`, {
            method: "DELETE",
          });
          await loadSchedules();
        } catch (error) {
          root.textContent = error.message;
        }
      });
      row.append(details, remove);
      root.append(row);
    });
  } catch (error) {
    root.textContent = `${error.message} Muat ulang halaman dan masuk kembali jika sesi sudah berakhir.`;
  }
}

request("/api/admin/session").then(showDashboard).catch(() => {
  loginCard.hidden = false;
  dashboard.hidden = true;
});
