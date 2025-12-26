// assets/admin.js
import { APP } from "./app.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js"; // [web:121]

/** PASTE your Firebase Web App config here (same as before) */
const firebaseConfig = {
  apiKey: "PASTE_ME",
  authDomain: "PASTE_ME",
  projectId: "PASTE_ME",
  appId: "PASTE_ME",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

const $ = (id) => document.getElementById(id);

function setMsg(text, type = "info") {
  const el = $("adminMsg");
  el.classList.remove("hidden");
  el.textContent = text;

  el.className = "rounded-xl px-4 py-3 text-sm";
  if (type === "error") el.classList.add("border", "border-red-500/30", "bg-red-500/10", "text-red-100");
  else if (type === "ok") el.classList.add("border", "border-emerald-500/30", "bg-emerald-500/10", "text-emerald-100");
  else el.classList.add("border", "border-white/10", "bg-white/5", "text-slate-200");
}

function setPin(text) {
  const el = $("pinBox");
  el.classList.remove("hidden");
  el.textContent = text;
}

function clearPin() {
  $("pinBox").classList.add("hidden");
  $("pinBox").textContent = "";
}

function validateTrackingNumber(v) {
  return APP.trackingRegex.test((v || "").trim().toUpperCase());
}

function requireFunctionsUrl() {
  if (!APP.functionsBaseUrl || APP.functionsBaseUrl.includes("PASTE_")) {
    throw new Error("Missing Functions URL. Set it in assets/app.js");
  }
}

function lockUi(isAuthed, email = "") {
  $("btnLogout").disabled = !isAuthed;
  $("locked").classList.toggle("hidden", isAuthed);
  $("ops").classList.toggle("hidden", !isAuthed);

  const badge = $("authBadge");
  if (isAuthed) {
    badge.textContent = `Signed in: ${email}`;
    badge.classList.remove("hidden");
  } else {
    badge.classList.add("hidden");
  }
}

onAuthStateChanged(auth, (user) => {
  clearPin();
  if (user) {
    lockUi(true, user.email || "");
    setMsg("Signed in.", "ok");
  } else {
    lockUi(false);
    setMsg("Not signed in.", "info");
  }
});

$("btnLogin").addEventListener("click", async () => {
  clearPin();
  const email = $("email").value.trim();
  const password = $("password").value;

  try {
    await signInWithEmailAndPassword(auth, email, password); // [web:121]
  } catch (e) {
    setMsg(e?.message || "Login failed.", "error");
  }
});

$("btnLogout").addEventListener("click", async () => {
  clearPin();
  await signOut(auth);
});

$("btnResetCreate").addEventListener("click", () => {
  $("newTracking").value = "";
  $("newPhone").value = "";
  clearPin();
});

$("btnResetEvent").addEventListener("click", () => {
  $("evTracking").value = "";
  $("evLocation").value = "";
  $("evNote").value = "";
  $("evStatus").value = "In transit";
  clearPin();
});

$("btnCreate").addEventListener("click", async () => {
  clearPin();
  requireFunctionsUrl();

  const trackingNumber = $("newTracking").value.trim().toUpperCase();
  const customerPhone = $("newPhone").value.trim();

  if (!validateTrackingNumber(trackingNumber)) return setMsg("Invalid tracking number (DLH-YYYY-000000).", "error");
  if (!/^\+\d{8,15}$/.test(customerPhone)) return setMsg("Phone must be E.164 like +2547...", "error");

  try {
    const idToken = await auth.currentUser.getIdToken();
    const res = await fetch(`${APP.functionsBaseUrl}/createShipment`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${idToken}`,
      },
      body: JSON.stringify({ trackingNumber, customerPhone }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) return setMsg(data?.error || "Create shipment failed.", "error");

    setMsg("Shipment created and first SMS sent.", "ok");
    setPin(`PIN (show customer once): ${data.pin}`);
  } catch (e) {
    setMsg(e?.message || "Network error.", "error");
  }
});

$("btnAddEvent").addEventListener("click", async () => {
  clearPin();
  requireFunctionsUrl();

  const trackingNumber = $("evTracking").value.trim().toUpperCase();
  const status = $("evStatus").value;
  const location = $("evLocation").value.trim();
  const note = $("evNote").value.trim();

  if (!validateTrackingNumber(trackingNumber)) return setMsg("Invalid tracking number.", "error");
  if (!location) return setMsg("Location is required.", "error");

  try {
    const idToken = await auth.currentUser.getIdToken();
    const res = await fetch(`${APP.functionsBaseUrl}/addEvent`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${idToken}`,
      },
      body: JSON.stringify({ trackingNumber, status, location, note }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) return setMsg(data?.error || "Add event failed.", "error");

    setMsg("Event added and SMS sent.", "ok");
  } catch (e) {
    setMsg(e?.message || "Network error.", "error");
  }
});
