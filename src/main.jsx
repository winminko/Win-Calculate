BrowserRouter React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import "./styles.css";

createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <App />
  </BrowserRouter// ...ရှိပြီးသား import/render အောက်ကနေပါ
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("/sw.js");
}

// Install prompt helper
const btn = document.createElement("button");
btn.textContent = "Install";
btn.className = "fab";
btn.style.display = "none";
document.body.appendChild(btn);
let deferred;
window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault(); deferred = e; btn.style.display = "flex";
});
btn.onclick = async () => {
  if (!deferred) return;
  deferred.prompt();
  await deferred.userChoice;
  btn.style.display = "none";
  deferred = null;
};>
);


