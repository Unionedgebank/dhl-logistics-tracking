// assets/track.js
import { APP } from "./app.js";

const $ = (id) => document.getElementById(id);

function setMsg(text, type = "info") {
  const el = $("msg");
  el.classList.remove("hidden");
  el.textContent = text;

  el.className = "rounded-xl px-4 py-3 text-sm";
  if (type === "error") el.classList.add("border", "border-red-500/30", "bg-red-500/10", "text-red-100");
  else if (type === "ok") el.classList.add("border", "border-emerald-500/30", "bg-emerald-500/10", "text-emerald-100");
  else el.classList.add("border", "border-white/10", "bg-white/5", "text-slate-200");
}

function clearMsg() {
  $("msg").classList.add("hidden");
  $("msg").textContent = "";
}

function esc(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({
    "&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"
  }[c]));
}

function validate(trackingNumber, pin) {
  if (!APP.trackingRegex.test(trackingNumber)) return "Invalid tracking number. Example: DLH-2025-000123";
  if (!/^\d{6}$/.test(pin)) return "PIN must be exactly 6 digits.";
  if (!APP.functionsBaseUrl || APP.functionsBaseUrl.includes("PASTE_")) return "Missing Functions URL. Add it in assets/app.js.";
  return null;
}

$("btnClear").addEventListener("click", () => {
  $("trackingNumber").value = "";
  $("pin").value = "";
  clearMsg();
  $("result").classList.add("hidden");
  $("badgeStatus").classList.add("hidden");
  $("events").innerHTML = "";
  $("emptyState").classList.remove("hidden");
});

$("btnTrack").addEventListener("click", async () => {
  clearMsg();

  const trackingNumber = $("trackingNumber").value.trim().toUpperCase();
  const pin = $("pin").value.trim();

  const err = validate(trackingNumber, pin);
  if (err) return setMsg(err, "error");

  $("btnTrack").disabled = true;
  $("btnTrack").textContent = "Loading...";

  try {
    const res = await fetch(`${APP.functionsBaseUrl}/trackLookup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ trackingNumber, pin }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setMsg(data?.error || "Tracking lookup failed.", "error");
      return;
    }

    const shipment = data.shipment || {};
    const events = data.events || [];

    $("rTracking").textContent = shipment.trackingNumber || trackingNumber;
    $("rUpdated").textContent = shipment.updatedAt ? new Date(shipment.updatedAt).toLocaleString() : "—";

    const status = shipment.currentStatus || "—";
    $("badgeStatus").textContent = status;
    $("badgeStatus").classList.remove("hidden");

    const container = $("events");
    container.innerHTML = "";

    if (!events.length) {
      container.innerHTML = `<div class="rounded-xl border border-white/10 bg-slate-950/30 p-4 text-slate-300">No events yet.</div>`;
    } else {
      for (const ev of events) {
        const time = ev.eventTime ? new Date(ev.eventTime).toLocaleString() : "—";
        const loc = ev.location || "—";
        const note = ev.note || "";
        const st = ev.status || "—";

        const html = `
          <div class="rounded-2xl border border-white/10 bg-slate-950/30 p-4">
            <div class="flex flex-wrap items-center justify-between gap-2">
              <div class="font-semibold">${esc(st)}</div>
              <div class="text-xs text-slate-400">${esc(time)}</div>
            </div>
            <div class="mt-1 text-sm text-slate-300">Location: <span class="text-slate-100">${esc(loc)}</span></div>
            ${note ? `<div class="mt-2 text-sm text-slate-200">${esc(note)}</div>` : ""}
          </div>
        `;
        container.insertAdjacentHTML("beforeend", html);
      }
    }

    $("emptyState").classList.add("hidden");
    $("result").classList.remove("hidden");
    setMsg("Tracking loaded.", "ok");
  } catch (e) {
    setMsg("Network error. Check your Functions URL and CORS.", "error");
  } finally {
    $("btnTrack").disabled = false;
    $("btnTrack").textContent = "Track";
  }
});
