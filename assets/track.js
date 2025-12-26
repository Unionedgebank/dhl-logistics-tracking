import { APP } from "./app.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import {
  getFirestore, doc, getDoc, collection, query, orderBy, limit, getDocs
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "PASTE_ME",
  authDomain: "PASTE_ME",
  projectId: "PASTE_ME",
  appId: "PASTE_ME",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const $ = (id) => document.getElementById(id);

function setMsg(text, type = "info") {
  const el = $("msg");
  el.classList.remove("hidden");
  el.textContent = text;
  el.className = "rounded-2xl px-4 py-3 text-sm";
  if (type === "error") el.classList.add("border","border-red-500/30","bg-red-500/10","text-red-100");
  else if (type === "ok") el.classList.add("border","border-emerald-500/30","bg-emerald-500/10","text-emerald-100");
  else el.classList.add("border","border-white/10","bg-white/5","text-slate-200");
}
function clearMsg(){ $("msg").classList.add("hidden"); $("msg").textContent=""; }
function esc(s){ return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"}[c])); }

$("btnClear").addEventListener("click", () => {
  $("trackingNumber").value = "";
  clearMsg();
  $("result").classList.add("hidden");
  $("events").innerHTML = "";
  $("badgeStatus").classList.add("hidden");
  $("badgeTracking").classList.add("hidden");
  $("emptyState").classList.remove("hidden");
});

$("btnTrack").addEventListener("click", async () => {
  clearMsg();
  const trackingNumber = $("trackingNumber").value.trim().toUpperCase();
  if (!APP.trackingRegex.test(trackingNumber)) return setMsg("Invalid tracking number. Example: DLH-2025-000123", "error");

  $("btnTrack").disabled = true;
  $("btnTrack").textContent = "Loading...";

  try {
    const shipmentRef = doc(db, "shipments", trackingNumber);
    const snap = await getDoc(shipmentRef);
    if (!snap.exists()) return setMsg("Shipment not found.", "error");

    const shipment = snap.data() || {};
    const status = shipment.currentStatus || "—";
    const updatedAt = shipment.updatedAt ? new Date(shipment.updatedAt).toLocaleString() : "—";

    $("badgeTracking").textContent = trackingNumber;
    $("badgeTracking").classList.remove("hidden");
    $("badgeStatus").textContent = status;
    $("badgeStatus").classList.remove("hidden");

    $("rStatus").textContent = status;
    $("rUpdated").textContent = updatedAt;

    const q = query(collection(db, "shipments", trackingNumber, "events"), orderBy("eventTime", "desc"), limit(50));
    const evSnap = await getDocs(q);

    const container = $("events");
    container.innerHTML = "";

    if (evSnap.empty) {
      container.innerHTML = `<div class="rounded-2xl border border-white/10 bg-slate-950/25 p-5 text-slate-300">No events yet.</div>`;
    } else {
      evSnap.forEach((d) => {
        const ev = d.data() || {};
        const time = ev.eventTime ? new Date(ev.eventTime).toLocaleString() : "—";
        const loc = ev.location || "—";
        const note = ev.note || "";
        const st = ev.status || "—";
        container.insertAdjacentHTML("beforeend", `
          <div class="rounded-3xl border border-white/10 bg-slate-950/25 p-5">
            <div class="flex flex-wrap items-center justify-between gap-2">
              <div class="font-semibold">${esc(st)}</div>
              <div class="text-xs text-slate-400">${esc(time)}</div>
            </div>
            <div class="mt-1 text-sm text-slate-300">Location: <span class="text-slate-100">${esc(loc)}</span></div>
            ${note ? `<div class="mt-2 text-sm text-slate-200">${esc(note)}</div>` : ""}
          </div>
        `);
      });
    }

    $("emptyState").classList.add("hidden");
    $("result").classList.remove("hidden");
    setMsg("Tracking loaded.", "ok");
  } catch (e) {
    setMsg("Error loading tracking. Check Firestore rules & config.", "error");
  } finally {
    $("btnTrack").disabled = false;
    $("btnTrack").textContent = "Track";
  }
});
