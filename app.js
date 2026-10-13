const STORE_KEY = "meus-gastos-v1";
const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "BRL" });
const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
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
  $("monthShort").textContent = `${list.length} ${list.length === 1 ? "record" : "records"}`;
  $("monthTotal").textContent = money.format(total);
  $("entryCount").textContent = `${list.length} ${list.length === 1 ? "expense" : "expenses"}`;
  $("fixedTotal").textContent = money.format(fixed); $("randomTotal").textContent = money.format(random);
  $("fixedMeter").style.width = total ? `${fixed / total * 100}%` : "0%"; $("randomMeter").style.width = total ? `${random / total * 100}%` : "0%";
  $("listCount").textContent = `${list.length} ${list.length === 1 ? "item" : "items"}`;
  $("emptyState").hidden = list.length > 0;
  $("expenseList").innerHTML = list.map((e) => `<article class="expense-item"><span class="expense-type ${e.type === "fixed" ? "fixed-icon" : "random-icon"}" aria-hidden="true">${e.type === "fixed" ? "↻" : "✳"}</span><div class="expense-copy"><div class="expense-name">${escapeHtml(e.description)}</div><div class="expense-meta">${escapeHtml(e.category)} · ${new Date(`${e.date}T12:00:00`).toLocaleDateString("en-US", { day: "2-digit", month: "short" })} · ${e.type === "fixed" ? "Fixed" : "Variable"}</div></div><div class="expense-right"><div class="expense-value">${money.format(e.amount)}</div><button class="delete-button" data-delete="${escapeHtml(e.id)}" aria-label="Delete ${escapeHtml(e.description)}">Delete</button></div></article>`).join("");
}
function toast(message) { const el = $("toast"); el.textContent = message; el.classList.add("show"); clearTimeout(toast.timer); toast.timer = setTimeout(() => el.classList.remove("show"), 2300); }
function openDialog() { const d = new Date(); $("date").value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; $("expenseDialog").showModal(); setTimeout(() => $("description").focus(), 100); }
$("addButton").addEventListener("click", openDialog);
$("closeDialog").addEventListener("click", () => $("expenseDialog").close());
$("expenseDialog").addEventListener("click", (event) => { if (event.target === $("expenseDialog")) $("expenseDialog").close(); });
$("prevMonth").addEventListener("click", () => { selectedMonth = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() - 1, 1); render(); });
$("nextMonth").addEventListener("click", () => { selectedMonth = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 1); render(); });
$("expenseForm").addEventListener("submit", (event) => {
  event.preventDefault(); const fd = new FormData(event.currentTarget); const typed = String(fd.get("amount")).trim();
  // Accept "1,234.56", "1234.56" or "12.5"; reject "12,5" instead of silently reading it as 125.
  const valid = /^(\d{1,3}(,\d{3})+|\d+)(\.\d{1,2})?$/.test(typed); const amount = Number(typed.replace(/,/g, ""));
  if (!valid || !Number.isFinite(amount) || amount <= 0) { toast("Enter an amount greater than zero, e.g. 12.50."); $("amount").focus(); return; }
  expenses.push({ id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`, description: String(fd.get("description")).trim(), amount: Math.round(amount * 100) / 100, date: String(fd.get("date")), type: String(fd.get("type")), category: String(fd.get("category")), createdAt: Date.now() });
  persist(); selectedMonth = new Date(`${String(fd.get("date"))}T12:00:00`); event.currentTarget.reset(); $("expenseDialog").close(); render(); toast("Expense saved on this device.");
});
$("expenseList").addEventListener("click", (event) => { const button = event.target.closest("[data-delete]"); if (!button) return; const expense = expenses.find((e) => e.id === button.dataset.delete); if (!expense || !confirm(`Delete the expense “${expense.description}”?`)) return; expenses = expenses.filter((e) => e.id !== expense.id); persist(); render(); toast("Expense deleted."); });
$("backupButton").addEventListener("click", () => {
  if (!expenses.length) { toast("There are no expenses to export yet."); return; }
  const blob = new Blob([JSON.stringify({ app: "meus-gastos", version: 1, exportedAt: new Date().toISOString(), expenses }, null, 2)], { type: "application/json" }); const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = `my-expenses-backup-${new Date().toISOString().slice(0, 10)}.json`; a.click(); URL.revokeObjectURL(url); toast("Backup exported.");
});
$("restoreButton").addEventListener("click", () => $("restoreFile").click());
$("restoreFile").addEventListener("change", async (event) => { const file = event.target.files[0]; if (!file) return; try { const data = JSON.parse(await file.text()); if (!Array.isArray(data.expenses) || !data.expenses.every((e) => e && typeof e.id === "string" && Number.isFinite(e.amount) && e.amount > 0 && /^\d{4}-\d{2}-\d{2}$/.test(e.date))) throw new Error(); if (!confirm(`Restore ${data.expenses.length} expenses? This will replace the current records.`)) return; expenses = data.expenses; persist(); render(); toast("Backup restored."); } catch { toast("This file does not look like a valid backup."); } finally { event.target.value = ""; } });
if ("serviceWorker" in navigator && location.protocol.startsWith("http")) navigator.serviceWorker.register("./sw.js").catch(() => {});
render();
