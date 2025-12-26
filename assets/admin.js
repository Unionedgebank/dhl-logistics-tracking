// assets/admin.js (NO FUNCTIONS, NO PIN, Firestore direct-write)
import { APP } from "./app.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js"; // [web:121][web:172]
import {
  getFirestore,
  doc,
  setDoc,
  updateDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js"; // [web:496]

const firebaseConfig = {
  apiKey: "AIzaSyDa9o9rSXpBOBpoMj_1TxG8zW3X70El3wI",
  authDomain: "dhl-logistics-tracking.firebaseapp.com",
  projectId: "dhl-logistics-tracking",
  storageBucket: "dhl-logistics-tracking.firebasestorage.app",
  messagingSenderId: "583046173440",
  appId: "1:583046173440:web:2ec340838c3f69ec8dd9e5"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const $ = (id) => document.getElementById(id);

function setMsg(text, type = "info") {
  const el = $("adminMsg");
  el.classList.remove("hidden");
  el.textContent = text;

  el.className = "rounded-xl px-4 py-3 text-sm border";
  if (type === "error") el.classList.add("border-red-500/30", "bg-red-500/10", "text-red-100");
  else if (type === "ok") el.classList.add("border-emerald-500/30", "bg-emerald-500/10", "text-emerald-100");
  else el.classList.add("border-white/10", "bg-white/5", "text-slate-200");
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

function validateTrackingNumber(v) {
  return APP.trackingRegex.test((v || "").trim().toUpperCase());
}

function isAdminUser(user) {
  const email = String(user?.email || "").toLowerCase();
  return email && email === String(APP.adminEmail).toLowerCase();
}

function randId() {
  return Math.random().toString(16).slice(2) + Math.random().toString(16).slice(2);
}

async function createShipment(trackingNumber, customerPhone) {
  // shipments/{trackingNumber}
  await setDoc(doc(db, "shipments", trackingNumber), {
    trackingNumber,
    customerPhone,
    currentStatus: "Created",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  }); // [web:496]

  const evId = randId();
  await setDoc(doc(db, "shipments", trackingNumber, "events", evId), {
    eventId: evId,
    status: "Created",
    location: "System",
    note: "Shipment created",
    eventTime: serverTimestamp()
  }); // [web:496]
}

async function addEvent(trackingNumber, status, location, note) {
  const evId = randId();

  await setDoc(doc(db, "shipments", trackingNumber, "events", evId), {
    eventId: evId,
    status,
    location,
    note,
    eventTime: serverTimestamp()
  }); // [web:496]

  await updateDoc(doc(db, "shipments", trackingNumber), {
    currentStatus: status,
    updatedAt: serverTimestamp()
  }); // [web:496]
}

onAuthStateChanged(auth, (user) => {
  if (user) {
    lockUi(true, user.email || "");
    if (!isAdminUser(user)) {
      setMsg("Signed in but not allowed. Use dhlnow@usa.com", "error");
      $("ops").classList.add("hidden");
    } else {
      setMsg("Admin access granted.", "ok");
    }
  } else {
    lockUi(false);
    setMsg("Not signed in.", "info");
  }
}); // [web:172]

$("btnLogin").addEventListener("click", async () => {
  const email = $("email").value.trim();
  const password = $("password").value;

  try {
    await signInWithEmailAndPassword(auth, email, password); // [web:121]
  } catch (e) {
    setMsg(e?.message || "Login failed.", "error");
  }
});

$("btnLogout").addEventListener("click", async () => {
  await signOut(auth);
});

$("btnResetCreate").addEventListener("click", () => {
  $("newTracking").value = "";
  $("newPhone").value = "";
});

$("btnResetEvent").addEventListener("click", () => {
  $("evTracking").value = "";
  $("evLocation").value = "";
  $("evNote").value = "";
  $("evStatus").value = "In transit";
});

$("btnCreate").addEventListener("click", async () => {
  const user = auth.currentUser;
  if (!user) return setMsg("Please login first.", "error");
  if (!isAdminUser(user)) return setMsg("Not allowed.", "error");

  const trackingNumber = $("newTracking").value.trim().toUpperCase();
  const customerPhone = $("newPhone").value.trim();

  if (!validateTrackingNumber(trackingNumber)) return setMsg("Invalid tracking number (DLH-YYYY-000000).", "error");
  if (!/^\+\d{8,15}$/.test(customerPhone)) return setMsg("Phone must be E.164 like +2547...", "error");

  try {
    await createShipment(trackingNumber, customerPhone);
    setMsg("Shipment created (no SMS / no PIN).", "ok");
  } catch (e) {
    setMsg(e?.message || "Create shipment failed.", "error");
  }
});

$("btnAddEvent").addEventListener("click", async () => {
  const user = auth.currentUser;
  if (!user) return setMsg("Please login first.", "error");
  if (!isAdminUser(user)) return setMsg("Not allowed.", "error");

  const trackingNumber = $("evTracking").value.trim().toUpperCase();
  const status = $("evStatus").value;
  const location = $("evLocation").value.trim();
  const note = $("evNote").value.trim();

  if (!validateTrackingNumber(trackingNumber)) return setMsg("Invalid tracking number.", "error");
  if (!location) return setMsg("Location is required.", "error");

  try {
    await addEvent(trackingNumber, status, location, note);
    setMsg("Event added.", "ok");
  } catch (e) {
    setMsg(e?.message || "Add event failed.", "error");
  }
});
