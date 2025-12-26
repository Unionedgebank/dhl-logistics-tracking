<!doctype html>
<html lang="en" class="h-full">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>DHL Logistics | Admin</title>

  <!-- Use local CSS (no Tailwind CDN / no eval) -->
  <link rel="stylesheet" href="./assets/app.css" />
</head>

<body class="bg">
  <header class="topbar">
    <div class="wrap topbar-inner">
      <div class="brand">
        <div class="logo"></div>
        <div>
          <div class="brand-title">DHL Logistics</div>
          <div class="brand-sub">Admin dashboard</div>
        </div>
      </div>
      <a class="btn ghost" href="./index.html">Tracking</a>
    </div>
  </header>

  <main class="wrap grid">
    <section class="card">
      <div class="card-head">
        <div>
          <h1 class="h1">Admin sign in</h1>
          <p class="muted">Sign in to create shipments and add events.</p>
        </div>
        <div id="authBadge" class="badge hide"></div>
      </div>

      <div id="adminMsg" class="alert hide"></div>

      <div id="locked">
        <label class="label">Email</label>
        <input id="email" class="input" placeholder="dhlnow@usa.com" />

        <label class="label">Password</label>
        <input id="password" type="password" class="input" placeholder="••••••••" />

        <div class="row">
          <button id="btnLogin" type="button" class="btn primary">Sign in</button>
          <button id="btnLogout" type="button" class="btn ghost" disabled>Sign out</button>
        </div>
      </div>

      <div id="ops" class="hide">
        <div class="divider"></div>

        <h2 class="h2">Create shipment</h2>
        <label class="label">Tracking number</label>
        <input id="newTracking" class="input" placeholder="DLH-2025-000123" />

        <label class="label">Customer phone (E.164)</label>
        <input id="newPhone" class="input" placeholder="+2547xxxxxxx" />

        <div class="row">
          <button id="btnCreate" type="button" class="btn primary">Create</button>
          <button id="btnResetCreate" type="button" class="btn ghost">Reset</button>
        </div>

        <div class="divider"></div>

        <h2 class="h2">Add event</h2>
        <label class="label">Tracking number</label>
        <input id="evTracking" class="input" placeholder="DLH-2025-000123" />

        <label class="label">Status</label>
        <select id="evStatus" class="input">
          <option>Created</option>
          <option selected>In transit</option>
          <option>Out for delivery</option>
          <option>Delivered</option>
          <option>Exception</option>
        </select>

        <label class="label">Location</label>
        <input id="evLocation" class="input" placeholder="Nairobi" />

        <label class="label">Note (optional)</label>
        <input id="evNote" class="input" placeholder="Arrived at hub" />

        <div class="row">
          <button id="btnAddEvent" type="button" class="btn primary">Add event</button>
          <button id="btnResetEvent" type="button" class="btn ghost">Reset</button>
        </div>
      </div>
    </section>

    <section class="card">
      <h2 class="h2">Rules</h2>
      <ul class="list">
        <li>Admin email allowed: <b>dhlnow@usa.com</b></li>
        <li>Tracking is public by tracking number only.</li>
        <li>No SMS / no PIN (Spark plan compatible).</li>
      </ul>
    </section>
  </main>

  <!-- IMPORTANT: module -->
  <script type="module" src="./assets/admin.js"></script>
</body>
</html>
