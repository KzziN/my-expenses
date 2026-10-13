const STORE_KEY = "meus-gastos-v1";
const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const monthNames = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
let expenses = readExpenses();
let selectedMonth = new Date();
const $ = (id) => document.getElementById(id);

function readExpenses() {
  try {
    const data = JSON.parse(localStorage.getItem(STORE_KEY) || "[]");
    return Array.isArray(data) ? data.filter((e) => e && typeof e.id === "string" && Number.isFinite(e.amount) && e.amount > 0 && /^\d{4}-\d{2}-\d{2}$/.test(e.date)) : [];
  } catch { return []; }
}
function persist() { localStorage.setItem(STORE_KEY, JSON.stringify(expenses)); }
function monthKey(date) { return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`; }
function monthExpenses() { const key = monthKey(selectedMonth); return expenses.filter((e) => e.date.slice(0, 7) === key).sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt); }
function escapeHtml(value) { return String(value).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]); }
function render() {
  const list = monthExpenses(); const fixed = list.filter((e) => e.type === "fixed").reduce((s, e) => s + e.amount, 0); const random = list.filter((e) => e.type === "random").reduce((s, e) => s + e.amount, 0); const total = fixed + random;
  $("monthLabel").textContent = `${monthNames[selectedMonth.getMonth()]} ${selectedMonth.getFullYear()}`;
  $("monthShort").textContent = `${list.length} ${list.length === 1 ? "registro" : "registros"}`;
  $("monthTotal").textContent = money.format(total);
  $("entryCount").textContent = `${list.length} ${list.length === 1 ? "gasto" : "gastos"}`;
  $("fixedTotal").textContent = money.format(fixed); $("randomTotal").textContent = money.format(random);
  $("fixedMeter").style.width = total ? `${fixed / total * 100}%` : "0%"; $("randomMeter").style.width = total ? `${random / total * 100}%` : "0%";
  $("listCount").textContent = `${list.length} ${list.length === 1 ? "item" : "itens"}`;
  $("emptyState").hidden = list.length > 0;
  $("expenseList").innerHTML = list.map((e) => `<article class="expense-item"><span class="expense-type ${e.type === "fixed" ? "fixed-icon" : "random-icon"}" aria-hidden="true">${e.type === "fixed" ? "↻" : "✳"}</span><div class="expense-copy"><div class="expense-name">${escapeHtml(e.description)}</div><div class="expense-meta">${escapeHtml(e.category)} · ${new Date(`${e.date}T12:00:00`).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })} · ${e.type === "fixed" ? "Fixo" : "Aleatório"}</div></div><div class="expense-right"><div class="expense-value">${money.format(e.amount)}</div><button class="delete-button" data-delete="${escapeHtml(e.id)}" aria-label="Excluir ${escapeHtml(e.description)}">Excluir</button></div></article>`).join("");
}
function toast(message) { const el = $("toast"); el.textContent = message; el.classList.add("show"); clearTimeout(toast.timer); toast.timer = setTimeout(() => el.classList.remove("show"), 2300); }
function openDialog() { const d = new Date(); $("date").value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; $("expenseDialog").showModal(); setTimeout(() => $("description").focus(), 100); }
$("addButton").addEventListener("click", openDialog);
$("closeDialog").addEventListener("click", () => $("expenseDialog").close());
$("expenseDialog").addEventListener("click", (event) => { if (event.target === $("expenseDialog")) $("expenseDialog").close(); });
$("prevMonth").addEventListener("click", () => { selectedMonth = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() - 1, 1); render(); });
$("nextMonth").addEventListener("click", () => { selectedMonth = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 1); render(); });
$("expenseForm").addEventListener("submit", (event) => {
  event.preventDefault(); const fd = new FormData(event.currentTarget); const raw = String(fd.get("amount")).trim().replace(/\s/g, "").replace(/\.(?=.*[,])/g, "").replace(",", "."); const amount = Number(raw);
  if (!Number.isFinite(amount) || amount <= 0) { toast("Digite um valor maior que zero."); $("amount").focus(); return; }
  expenses.push({ id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`, description: String(fd.get("description")).trim(), amount: Math.round(amount * 100) / 100, date: String(fd.get("date")), type: String(fd.get("type")), category: String(fd.get("category")), createdAt: Date.now() });
  persist(); selectedMonth = new Date(`${String(fd.get("date"))}T12:00:00`); event.currentTarget.reset(); $("expenseDialog").close(); render(); toast("Gasto salvo neste aparelho.");
});
$("expenseList").addEventListener("click", (event) => { const button = event.target.closest("[data-delete]"); if (!button) return; const expense = expenses.find((e) => e.id === button.dataset.delete); if (!expense || !confirm(`Excluir o gasto “${expense.description}”?`)) return; expenses = expenses.filter((e) => e.id !== expense.id); persist(); render(); toast("Gasto excluído."); });
$("backupButton").addEventListener("click", () => {
  if (!expenses.length) { toast("Ainda não há gastos para exportar."); return; }
  const blob = new Blob([JSON.stringify({ app: "meus-gastos", version: 1, exportedAt: new Date().toISOString(), expenses }, null, 2)], { type: "application/json" }); const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = `meus-gastos-backup-${new Date().toISOString().slice(0, 10)}.json`; a.click(); URL.revokeObjectURL(url); toast("Backup exportado.");
});
$("restoreButton").addEventListener("click", () => $("restoreFile").click());
$("restoreFile").addEventListener("change", async (event) => { const file = event.target.files[0]; if (!file) return; try { const data = JSON.parse(await file.text()); if (!Array.isArray(data.expenses) || !data.expenses.every((e) => e && typeof e.id === "string" && Number.isFinite(e.amount) && e.amount > 0 && /^\d{4}-\d{2}-\d{2}$/.test(e.date))) throw new Error(); if (!confirm(`Restaurar ${data.expenses.length} gastos? Isso substituirá os registros atuais.`)) return; expenses = data.expenses; persist(); render(); toast("Backup restaurado."); } catch { toast("Esse arquivo não parece um backup válido."); } finally { event.target.value = ""; } });
if ("serviceWorker" in navigator && location.protocol.startsWith("http")) navigator.serviceWorker.register("./sw.js").catch(() => {});
render();

