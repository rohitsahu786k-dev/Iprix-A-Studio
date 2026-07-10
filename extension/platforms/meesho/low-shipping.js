/*
  A+ Studio — Meesho Low-Shipping Studio (drawer)
  Runs only on supplier.meesho.com.

  ASSIST, DON'T AUTOMATE — hard boundary:
  This script NEVER clicks buttons, submits forms, creates catalogs or uploads
  images into Meesho's DOM programmatically. It only (a) shows a local
  estimator/tracker UI in a shadow-DOM drawer, (b) READS the shipping charge
  text already visible on the page when the seller explicitly presses
  "Record shown price", and (c) deep-links to the A+ Studio webapp where image
  variants are generated 100% client-side. Automated actions on the supplier
  panel violate Meesho ToS and risk seller account bans — do not add them.
*/

(() => {
  if (window.__aplusLowShipping) return;
  window.__aplusLowShipping = true;
  if (!/^supplier\.meesho\.com$/.test(location.hostname)) return;

  const ACCENT = "#4f46e5";
  const WEBAPP_TOOL_URL = "https://aplusstudio.iprixmedia.com/tools/meesho-low-shipping-image-generator";
  const STORE_KEY = "aplus_lowship_tests_v1";

  // Indicative editable defaults — mirrors src/lib/low-shipping/rate-card.ts.
  const RATE_CARD = {
    slabs: [
      { maxGrams: 500, label: "0-500g", national: [65, 90], local: [27, 45], zonal: [55, 70] },
      { maxGrams: 1000, label: "500g-1kg", national: [80, 120], local: [45, 68], zonal: [68, 95] },
      { maxGrams: 1500, label: "1kg-1.5kg", national: [100, 150], local: [62, 90], zonal: [88, 120] },
      { maxGrams: 2000, label: "1.5kg-2kg", national: [120, 180], local: [80, 112], zonal: [108, 145] },
    ],
    extraPerHalfKg: { national: [26, 36], local: [18, 26], zonal: [22, 30] },
  };

  const DISCLAIMER = "Estimate only — confirm final charge in your Meesho Supplier Panel.";

  /* ---------------- pure estimator (mirrors webapp engine) ---------------- */

  const volumetricKg = (l, b, h) => Math.round(((l * b * h) / 5000) * 1000) / 1000;

  function slabIndexFor(grams) {
    const idx = RATE_CARD.slabs.findIndex((s) => grams <= s.maxGrams);
    if (idx !== -1) return idx;
    const lastMax = RATE_CARD.slabs[RATE_CARD.slabs.length - 1].maxGrams;
    return RATE_CARD.slabs.length - 1 + Math.ceil((grams - lastMax) / 500);
  }

  function slabInfo(index, zone) {
    const slabs = RATE_CARD.slabs;
    if (index < slabs.length) return { label: slabs[index].label, range: slabs[index][zone] };
    const extra = index - (slabs.length - 1);
    const last = slabs[slabs.length - 1];
    const per = RATE_CARD.extraPerHalfKg[zone];
    const fromKg = (last.maxGrams + (extra - 1) * 500) / 1000;
    return {
      label: fromKg + "kg-" + (fromKg + 0.5) + "kg",
      range: [last[zone][0] + extra * per[0], last[zone][1] + extra * per[1]],
    };
  }

  function estimate(dead, l, b, h) {
    const volKg = volumetricKg(l, b, h);
    const chargeable = Math.round(Math.max(dead, volKg * 1000));
    const index = slabIndexFor(chargeable);
    const national = slabInfo(index, "national");
    const local = slabInfo(index, "local");
    const zonal = slabInfo(index, "zonal");
    let drop = "Already in the lowest slab — image compactness is now your main lever.";
    let dropGood = true;
    if (index > 0) {
      const floor = index - 1 < RATE_CARD.slabs.length ? RATE_CARD.slabs[index - 1].maxGrams
        : RATE_CARD.slabs[RATE_CARD.slabs.length - 1].maxGrams + (index - RATE_CARD.slabs.length) * 500;
      const gramsToDrop = Math.ceil(chargeable - floor);
      const lower = slabInfo(index - 1, "national");
      const save = [Math.max(0, national.range[0] - lower.range[0]), Math.max(0, national.range[1] - lower.range[1])];
      let hint = "Reduce chargeable weight by " + gramsToDrop + "g";
      if (volKg * 1000 > dead && b * l > 0) {
        const targetVol = ((Math.max(floor, dead) / 1000) * 5000);
        const needH = Math.ceil((h - targetVol / (l * b)) * 10) / 10;
        if (needH > 0 && needH < h) hint = "Reduce packed height by " + needH + "cm OR weight by " + gramsToDrop + "g";
      }
      drop = hint + " to fall into the " + slabInfo(index - 1, "national").label + " slab and save ~₹" + save[0] + "–₹" + save[1] + "/order.";
      dropGood = false;
    }
    return { volKg, chargeable, index, national, local, zonal, drop, dropGood };
  }

  /* ---------------- read-only page price detection (manual trigger only) ---------------- */

  function detectShownShipping() {
    // Simple visible-text read: find an element mentioning shipping/delivery
    // with a ₹ amount. Never touches inputs, never clicks.
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    let node;
    while ((node = walker.nextNode())) {
      const text = (node.textContent || "").trim();
      if (!text || text.length > 160) continue;
      if (/(shipping|delivery)/i.test(text)) {
        const match = text.match(/₹\s?([\d,]+)/);
        if (match) return match[1].replace(/,/g, "");
      }
    }
    return "";
  }

  /* ---------------- storage helpers ---------------- */

  function loadTests(cb) {
    try {
      chrome.storage.local.get([STORE_KEY], (data) => cb((data && data[STORE_KEY]) || []));
    } catch (_) {
      cb([]);
    }
  }

  function saveTests(tests, cb) {
    try {
      const payload = {};
      payload[STORE_KEY] = tests.slice(0, 50);
      chrome.storage.local.set(payload, cb || (() => {}));
    } catch (_) {
      if (cb) cb();
    }
  }

  /* ---------------- UI (shadow DOM so Meesho CSS never clashes) ---------------- */

  const host = document.createElement("div");
  host.id = "aplus-low-shipping";
  host.style.cssText = "position:fixed;bottom:76px;right:18px;z-index:2147483000;";
  const root = host.attachShadow({ mode: "open" });

  root.innerHTML = `
    <style>
      * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Inter', ui-sans-serif, system-ui, sans-serif; }
      .fab {
        display: flex; align-items: center; gap: 8px;
        background: ${ACCENT}; color: #fff; border: none; cursor: pointer;
        border-radius: 999px; padding: 12px 18px; font-size: 12.5px; font-weight: 700;
        box-shadow: 0 4px 18px rgba(35,28,90,0.35); transition: transform .15s ease;
      }
      .fab:hover { transform: scale(1.04); }
      .drawer {
        display: none; width: 356px; max-height: 560px; overflow-y: auto;
        background: #fff; color: #211922; border-radius: 20px;
        box-shadow: 0 2px 6px rgba(20,12,20,0.08), 0 18px 44px rgba(20,12,20,0.22);
        padding: 16px; margin-bottom: 12px;
      }
      .drawer.open { display: block; }
      .head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
      .head strong { font-size: 13px; font-weight: 800; }
      .head small { display: block; font-size: 10.5px; color: #74747e; font-weight: 600; }
      .close { background: #f1f1f3; border: none; border-radius: 99px; width: 26px; height: 26px; cursor: pointer; font-size: 13px; color: #55555e; }
      .section { font-size: 10.5px; font-weight: 800; text-transform: uppercase; letter-spacing: .06em; color: #74747e; margin: 14px 0 8px; }
      .grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 7px; }
      .grid3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 7px; }
      label { font-size: 10px; font-weight: 700; color: #74747e; display: grid; gap: 3px; }
      input, select {
        width: 100%; border: 1px solid #e9e9ec; border-radius: 10px; padding: 8px 10px;
        font-size: 12px; font-weight: 700; color: #211922; outline: none; background: #fff;
      }
      input:focus, select:focus { border-color: ${ACCENT}; box-shadow: 0 0 0 3px rgba(79,70,229,0.12); }
      .row { border-radius: 14px; padding: 10px 12px; font-size: 11.5px; font-weight: 600; line-height: 1.45; margin-top: 8px; }
      .ok   { background: #e9f9f1; color: #0b7a4b; }
      .warn { background: #fdf3e4; color: #a05a04; }
      .info { background: #f7f7f8; color: #55555e; }
      .stats { display: grid; grid-template-columns: 1fr 1fr; gap: 7px; margin-top: 8px; }
      .stat { background: #f7f7f8; border-radius: 12px; padding: 9px 11px; }
      .stat b { display: block; font-size: 13px; font-weight: 800; }
      .stat span { font-size: 9.5px; font-weight: 700; text-transform: uppercase; letter-spacing: .05em; color: #74747e; }
      .btn {
        width: 100%; margin-top: 10px; background: ${ACCENT}; color: #fff; border: none;
        border-radius: 12px; padding: 11px 12px; font-size: 12px; font-weight: 800; cursor: pointer;
      }
      .btn.ghost { background: #f1f1f3; color: #211922; }
      .btn:hover { filter: brightness(1.05); }
      table { width: 100%; border-collapse: collapse; margin-top: 8px; }
      th, td { text-align: left; font-size: 10.5px; padding: 6px 6px; border-bottom: 1px solid #f1f1f3; font-weight: 700; }
      th { color: #74747e; text-transform: uppercase; font-size: 9px; letter-spacing: .05em; }
      tr.best td { background: #e9f9f1; color: #0b7a4b; }
      td button { background: none; border: none; color: ${ACCENT}; font-size: 10.5px; font-weight: 800; cursor: pointer; }
      .foot { margin-top: 10px; font-size: 9.5px; color: #9a9aa4; font-weight: 600; line-height: 1.5; }
    </style>
    <div class="drawer" id="drawer">
      <div class="head">
        <div>
          <strong>Low-Shipping Studio</strong>
          <small>Slab estimator + variant A/B tracker — 100% local</small>
        </div>
        <button class="close" id="close" aria-label="Close">✕</button>
      </div>

      <button class="btn" id="openStudio">Generate 5 low-bulk image variants ↗</button>
      <div class="row info">Images are generated in the A+ Studio webapp, 100% in your browser. Download the variant, then upload it on Meesho manually.</div>

      <div class="section">Shipping slab estimator</div>
      <div class="grid2" style="margin-bottom:7px;">
        <label>Category
          <select id="cat">
            <option>jewellery</option><option>saree</option><option>kurti</option>
            <option>western wear</option><option>footwear</option><option>home</option>
            <option>kitchen</option><option>kids</option><option>beauty</option>
            <option>electronics accessories</option><option>other</option>
          </select>
        </label>
        <label>Dead weight (g)<input id="dead" type="number" min="1" value="120" /></label>
      </div>
      <div class="grid3">
        <label>L (cm)<input id="l" type="number" min="1" step="0.5" value="15" /></label>
        <label>B (cm)<input id="b" type="number" min="1" step="0.5" value="12" /></label>
        <label>H (cm)<input id="h" type="number" min="0.5" step="0.5" value="4" /></label>
      </div>
      <div class="stats">
        <div class="stat"><b id="statVol">–</b><span>Volumetric</span></div>
        <div class="stat"><b id="statCharge">–</b><span>Chargeable</span></div>
        <div class="stat"><b id="statSlab">–</b><span>Slab</span></div>
        <div class="stat"><b id="statNat">–</b><span>National est.</span></div>
      </div>
      <div class="row" id="dropRow" style="display:none;"></div>

      <div class="section">Variant A/B tracker</div>
      <div class="grid3">
        <label>Variant
          <select id="variant">
            <option>V1 Compact-70</option><option>V2 Compact-55</option><option>V3 Compact-40</option>
            <option>V4 Tight-Crop</option><option>V5 Original-Cleaned</option>
          </select>
        </label>
        <label>Panel price ₹<input id="seenPrice" type="number" min="0" placeholder="auto" /></label>
        <label>&nbsp;<button class="btn" id="record" style="margin-top:0;padding:9px 6px;font-size:10.5px;">Record shown price</button></label>
      </div>
      <table id="testsTable" style="display:none;">
        <thead><tr><th>Variant</th><th>₹ seen</th><th>Date</th><th></th></tr></thead>
        <tbody id="testsBody"></tbody>
      </table>
      <div class="row info" id="testsEmpty">No tested variants yet. Upload a variant on Meesho manually, note the shipping shown, and record it here.</div>

      <div class="foot">
        ${DISCLAIMER}<br/>
        This tool never clicks, submits or uploads anything on the Meesho panel — all panel actions are yours, manually. Automation is against Meesho ToS and risks account bans.
      </div>
    </div>
    <button class="fab" id="fab">📦 Low-Shipping Studio</button>
  `;

  const el = (id) => root.getElementById(id);

  function renderEstimate() {
    const dead = Number(el("dead").value) || 0;
    const l = Number(el("l").value) || 0;
    const b = Number(el("b").value) || 0;
    const h = Number(el("h").value) || 0;
    if (dead <= 0 || l <= 0 || b <= 0 || h <= 0) return;
    const result = estimate(dead, l, b, h);
    el("statVol").textContent = result.volKg.toFixed(3) + " kg";
    el("statCharge").textContent = result.chargeable + " g";
    el("statSlab").textContent = result.national.label;
    el("statNat").textContent = "₹" + result.national.range[0] + "–" + result.national.range[1];
    const dropRow = el("dropRow");
    dropRow.style.display = "block";
    dropRow.className = "row " + (result.dropGood ? "ok" : "warn");
    dropRow.textContent = result.drop;
  }

  function renderTests(tests) {
    const table = el("testsTable");
    const empty = el("testsEmpty");
    const body = el("testsBody");
    body.innerHTML = "";
    if (!tests.length) {
      table.style.display = "none";
      empty.style.display = "block";
      return;
    }
    table.style.display = "table";
    empty.style.display = "none";
    const cheapest = Math.min.apply(null, tests.map((t) => Number(t.price) || Infinity));
    tests.forEach((test, index) => {
      const tr = document.createElement("tr");
      if (Number(test.price) === cheapest && Number.isFinite(cheapest)) tr.className = "best";
      const dateText = new Date(test.date).toLocaleDateString();
      tr.innerHTML =
        "<td></td><td>₹" + (Number(test.price) || 0) + "</td><td>" + dateText + "</td>" +
        '<td><button data-i="' + index + '">✕</button></td>';
      tr.children[0].textContent = test.variant; // textContent — no HTML injection
      body.appendChild(tr);
    });
    body.querySelectorAll("button[data-i]").forEach((button) => {
      button.addEventListener("click", () => {
        loadTests((current) => {
          current.splice(Number(button.getAttribute("data-i")), 1);
          saveTests(current, () => renderTests(current));
        });
      });
    });
  }

  el("fab").addEventListener("click", () => {
    el("drawer").classList.toggle("open");
    renderEstimate();
    loadTests(renderTests);
  });
  el("close").addEventListener("click", () => el("drawer").classList.remove("open"));
  el("openStudio").addEventListener("click", () => window.open(WEBAPP_TOOL_URL, "_blank", "noopener"));
  ["dead", "l", "b", "h", "cat"].forEach((id) => el(id).addEventListener("input", renderEstimate));

  el("record").addEventListener("click", () => {
    let price = Number(el("seenPrice").value) || 0;
    if (!price) {
      // Read-only detection of the shipping figure already visible on the page.
      price = Number(detectShownShipping()) || 0;
      if (price) el("seenPrice").value = String(price);
    }
    if (!price) {
      el("seenPrice").placeholder = "type ₹ manually";
      el("seenPrice").focus();
      return;
    }
    loadTests((tests) => {
      tests.unshift({ variant: el("variant").value, price, date: new Date().toISOString(), url: location.pathname });
      saveTests(tests, () => renderTests(tests));
    });
  });

  const attach = () => document.body && document.body.appendChild(host);
  if (document.body) attach();
  else document.addEventListener("DOMContentLoaded", attach, { once: true });
})();
