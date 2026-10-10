import { api, setSession, clearSession, getToken } from "./api.js";
const authView = document.querySelector("#auth-view");
const appView = document.querySelector("#app-view");
const authForm = document.querySelector("#auth-form");
const authError = document.querySelector("#auth-error");
const authSubmit = document.querySelector("#auth-submit");
const form = document.querySelector("#bio-form");
const linksEl = document.querySelector("#links");
const preview = document.querySelector("#preview");
const formError = document.querySelector("#form-error");
let mode = "login";
let links = [];
const showError = (el, message) => { el.hidden = !message; el.textContent = message || ""; };

function paint() {
  preview.innerHTML = "";
  const name = document.createElement("h2");
  name.textContent = document.querySelector("#name").value.trim() || "Nombre";
  const text = document.createElement("p");
  text.textContent = document.querySelector("#text").value.trim();
  preview.append(name, text);
  links.forEach((link) => {
    const a = document.createElement("a");
    a.href = link.url;
    a.target = "_blank";
    a.rel = "noreferrer";
    a.textContent = link.title;
    preview.append(a);
  });
  linksEl.innerHTML = "";
  links.forEach((link, index) => {
    const li = document.createElement("li");
    li.className = "item";
    li.textContent = `${link.title} \u00b7 ${link.url}`;
    const del = document.createElement("button");
    del.type = "button";
    del.className = "ghost";
    del.textContent = "Quitar";
    del.addEventListener("click", () => { links.splice(index, 1); paint(); });
    li.append(del);
    linksEl.append(li);
  });
}
function setMode(next) {
  mode = next;
  document.querySelectorAll(".tab").forEach((tab) => tab.classList.toggle("active", tab.dataset.mode === mode));
  authSubmit.textContent = mode === "login" ? "Entrar" : "Crear cuenta";
}
async function boot() {
  if (!getToken()) return;
  try {
    const { user } = await api("/api/auth/me");
    authView.classList.add("hidden");
    appView.classList.remove("hidden");
    document.querySelector("#user-name").textContent = user.username;
    const data = await api("/api/bio");
    document.querySelector("#name").value = data.bio.name;
    document.querySelector("#text").value = data.bio.text;
    links = data.bio.links || [];
    paint();
  } catch { clearSession(); }
}
document.querySelectorAll(".tab").forEach((tab) => tab.addEventListener("click", () => setMode(tab.dataset.mode)));
form.addEventListener("input", paint);
document.querySelector("#add-link").addEventListener("click", () => {
  const title = document.querySelector("#link-title").value.trim();
  const url = document.querySelector("#link-url").value.trim();
  if (!title || !/^https?:\/\//i.test(url) || links.length >= 8) return;
  links.push({ title, url });
  document.querySelector("#link-title").value = "";
  document.querySelector("#link-url").value = "";
  paint();
});
authForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  showError(authError, "");
  const fd = new FormData(authForm);
  try {
    const data = await api(mode === "login" ? "/api/auth/login" : "/api/auth/register", { method: "POST", body: JSON.stringify({ username: fd.get("username"), password: fd.get("password") }) });
    setSession(data.token);
    authForm.reset();
    await boot();
  } catch (err) { showError(authError, err.message); }
});
document.querySelector("#logout").addEventListener("click", () => { clearSession(); appView.classList.add("hidden"); authView.classList.remove("hidden"); });
form.addEventListener("submit", async (event) => {
  event.preventDefault();
  showError(formError, "");
  try {
    await api("/api/bio", { method: "PUT", body: JSON.stringify({ name: document.querySelector("#name").value.trim(), text: document.querySelector("#text").value.trim(), links }) });
  } catch (err) { showError(formError, err.message); }
});
boot();
