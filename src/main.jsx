// /src/main.jsx
import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import "./styles.css";

// -------- Mount React App --------
const rootEl = document.getElementById("root");
createRoot(rootEl).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>
);

// -------- Service Worker (PWA) --------
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("/sw.js").catch((err) => {
    console.warn("SW register failed:", err);
  });
}

// -------- “Install” (Add to Home Screen) helper --------
const installBtn = document.createElement("button");
installBtn.textContent = "Install";
installBtn.className = "fab";
installBtn.style.display = "none";
document.body.appendChild(installBtn);

let deferredPrompt = null;

window.addEventListener("beforeinstallprompt", (e) => {
  // Prevent the mini-infobar on mobile
  e.preventDefault();
  deferredPrompt = e;
  installBtn.style.display = "flex"; // show button
});

installBtn.addEventListener("click", async () => {
  if (!deferredPrompt) return;
  deferredPrompt.prompt();
  await deferredPrompt.userChoice;
  // hide button after user action
  installBtn.style.display = "none";
  deferredPrompt = null;
});
