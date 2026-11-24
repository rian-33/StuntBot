const $ = id => document.getElementById(id);
const loginCard = $("loginCard"), dashboard = $("dashboard");
async function api(url, options = {}) {
  const response = await fetch(url, { ...options, headers: { "Content-Type": "application/json", ...(options.headers || {}) } });
  const result = await response.json();
  if (!response.ok || !result.success) throw new Error(result.message || "Permintaan gagal.");
  return result;
}
async function showDashboard() { loginCard.hidden = true; dashboard.hidden = false; await loadSchedules(); }
async function checkSession() { try { await api("/api/admin/session"); await showDashboard(); } catch {} }
$("loginForm").addEventListener("submit", async event => {
  event.preventDefault(); const notice = $("loginNotice"); notice.textContent = "";
  const form = new FormData(event.currentTarget);
  try { await api("/api/admin/login", { method: "POST", body: JSON.stringify({ username: form.get("username"), password: form.get("password") }) }); await showDashboard(); }
  catch (error) { notice.textContent = error.message; }
});
$("logout").addEventListener("click", async () => { try { await api("/api/admin/logout", { method: "POST" }); } finally { dashboard.hidden = true; loginCard.hidden = false; } });
$("scheduleForm").addEventListener("submit", async event => {
  event.preventDefault(); const notice = $("scheduleNotice"), form = new FormData(event.currentTarget);
  try { await api("/api/admin/schedules", { method: "POST", body: JSON.stringify(Object.fromEntries(form)) }); event.currentTarget.reset(); notice.textContent = "Jadwal berhasil disimpan."; await loadSchedules(); }
  catch (error) { notice.textContent = error.message; }
});
async function loadSchedules() {
  const result = await api("/api/admin/schedules"), root = $("schedules"); root.replaceChildren();
  if (!result.data.length) { root.textContent = "Belum ada jadwal."; return; }
  result.data.forEach(item => { const row = document.createElement("article"); row.className = "schedule"; const info = document.createElement("div"); const title = document.createElement("strong"); title.textContent = `${item.tanggal} · ${item.waktu} — ${item.puskesmas}`; const detail = document.createElement("p"); detail.textContent = [item.lokasi, item.catatan].filter(Boolean).join(" · "); info.append(title, detail); const remove = document.createElement("button"); remove.textContent = "Hapus"; remove.addEventListener("click", async () => { await api(`/api/admin/schedules/${encodeURIComponent(item.id)}`, { method: "DELETE" }); await loadSchedules(); }); row.append(info, remove); root.append(row); });
}
checkSession();
