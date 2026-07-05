/*
  A+ Studio — Meesho Image Guard
  Runs only on supplier.meesho.com. Fully local: no network calls, nothing
  uploaded anywhere, never auto-submits or blocks any Meesho form.

  Why: Meesho verifies weight/shipping against the FIRST catalog image. A combo
  or oversized-looking first image with a single-unit declared weight is the
  most common cause of shipping overcharges and rejected weight claims. This
  guard reviews the first selected image the moment the seller picks it and
  shows an instant compliance report + chargeable-weight calculator.
*/

(() => {
  if (window.__aplusMeeshoGuard) return;
  window.__aplusMeeshoGuard = true;

  const ACCENT = "#4f46e5";

  /* ---------------- floating UI (shadow DOM so Meesho CSS never clashes) ---------------- */

  const host = document.createElement("div");
  host.id = "aplus-meesho-guard";
  host.style.cssText = "position:fixed;bottom:18px;right:18px;z-index:2147483000;";
  const root = host.attachShadow({ mode: "open" });

  root.innerHTML = `
    <style>
      * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Inter', ui-sans-serif, system-ui, sans-serif; }
      .fab {
        display: flex; align-items: center; gap: 8px;
        background: #211922; color: #fff; border: none; cursor: pointer;
        border-radius: 999px; padding: 12px 18px; font-size: 12.5px; font-weight: 700;
        box-shadow: 0 4px 18px rgba(20,12,20,0.28);
        transition: transform .15s ease;
      }
      .fab:hover { transform: scale(1.04); }
      .fab .dot { width: 8px; height: 8px; border-radius: 99px; background: ${ACCENT}; }
      .panel {
        display: none; width: 340px; max-height: 520px; overflow-y: auto;
        background: #ffffff; color: #211922; border-radius: 20px;
        box-shadow: 0 2px 6px rgba(20,12,20,0.08), 0 18px 44px rgba(20,12,20,0.2);
        padding: 16px; margin-bottom: 12px;
      }
      .panel.open { display: block; }
      .head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
      .head strong { font-size: 13px; font-weight: 800; }
      .head small { display:block; font-size: 10.5px; color: #74747e; font-weight: 600; }
      .close { background: #f1f1f3; border: none; border-radius: 99px; width: 26px; height: 26px; cursor: pointer; font-size: 13px; color: #55555e; }
      .row { border-radius: 14px; padding: 10px 12px; font-size: 11.5px; font-weight: 600; line-height: 1.45; margin-bottom: 7px; }
      .ok   { background: #e9f9f1; color: #0b7a4b; }
      .warn { background: #fdf3e4; color: #a05a04; }
      .bad  { background: #fdeef0; color: ${ACCENT}; }
      .info { background: #f7f7f8; color: #55555e; }
      .score { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; }
      .score .ring {
        width: 52px; height: 52px; border-radius: 99px; display: grid; place-items: center;
        color: #fff; font-size: 16px; font-weight: 800; flex-shrink: 0;
      }
      .score p { font-size: 11.5px; font-weight: 700; }
      .score small { font-size: 10.5px; color: #74747e; font-weight: 600; }
      .section { font-size: 10.5px; font-weight: 800; text-transform: uppercase; letter-spacing: .06em; color: #74747e; margin: 14px 0 8px; }
      .calc { display: grid; grid-template-columns: 1fr 1fr; gap: 7px; }
      .calc label { font-size: 10px; font-weight: 700; color: #74747e; display: grid; gap: 3px; }
      .calc input {
        width: 100%; border: 1px solid #e9e9ec; border-radius: 10px; padding: 8px 10px;
        font-size: 12px; font-weight: 700; color: #211922; outline: none; background: #fff;
      }
      .calc input:focus { border-color: ${ACCENT}; box-shadow: 0 0 0 3px rgba(79,70,229,0.12); }
      .stats { display: grid; grid-template-columns: 1fr 1fr; gap: 7px; margin-top: 8px; }
      .stat { background: #f7f7f8; border-radius: 12px; padding: 9px 11px; }
      .stat b { display: block; font-size: 13px; font-weight: 800; }
      .stat span { font-size: 9.5px; font-weight: 700; text-transform: uppercase; letter-spacing: .05em; color: #74747e; }
      .empty { text-align: center; padding: 18px 8px; font-size: 11.5px; color: #74747e; font-weight: 600; line-height: 1.5; }
    </style>
    <div class="panel" id="panel">
      <div class="head">
        <div>
          <strong>A+ Image Guard</strong>
          <small>Meesho first-image &amp; shipping check — 100% local</small>
        </div>
        <button class="close" id="close">✕</button>
      </div>
      <div id="report">
        <div class="empty">
          Catalog me image select karte hi pehli image ka instant check yahan aayega.<br><br>
          <b>Kyun zaroori hai?</b> Meesho weight verification me first image dekhta hai — combo/oversized first image + single-unit weight = shipping overcharge.
        </div>
      </div>
      <div class="section">Chargeable weight calculator</div>
      <div class="calc">
        <label>Dead weight (g)<input id="w" type="number" value="300"></label>
        <label>Length (cm)<input id="l" type="number" value="30"></label>
        <label>Breadth (cm)<input id="b" type="number" value="25"></label>
        <label>Height (cm)<input id="h" type="number" value="5"></label>
      </div>
      <div class="stats">
        <div class="stat"><span>Volumetric</span><b id="vol">0.75 kg</b></div>
        <div class="stat"><span>Chargeable slab</span><b id="slab">0.5 kg</b></div>
      </div>
      <div class="row info" id="calcTip" style="margin-top:8px;">
        Volumetric = (L × B × H) / 5000. Jo zyada ho (dead ya volumetric), courier usi par charge karta hai.
      </div>
    </div>
    <button class="fab" id="fab"><span class="dot"></span> Image Guard</button>
  `;

  const $ = (id) => root.getElementById(id);
  const panel = $("panel");
  $("fab").addEventListener("click", () => panel.classList.toggle("open"));
  $("close").addEventListener("click", () => panel.classList.remove("open"));

  /* ---------------- weight calculator ---------------- */

  function recalc() {
    const w = Number($("w").value) || 0;
    const l = Number($("l").value) || 0;
    const b = Number($("b").value) || 0;
    const h = Number($("h").value) || 0;
    const volKg = (l * b * h) / 5000;
    const deadKg = w / 1000;
    const chargeable = Math.max(volKg, deadKg);
    const slab = chargeable <= 0.5 ? 0.5 : Math.ceil(chargeable * 2) / 2;
    $("vol").textContent = `${volKg.toFixed(2)} kg`;
    $("slab").textContent = `${slab.toFixed(1)} kg`;
    $("calcTip").className = "row " + (volKg > deadKg ? "warn" : "info");
    $("calcTip").textContent =
      volKg > deadKg
        ? `Volumetric (${volKg.toFixed(2)} kg) dead weight (${deadKg.toFixed(2)} kg) se zyada hai — packaging chhota karke shipping bachegi.`
        : "Volumetric = (L × B × H) / 5000. Jo zyada ho (dead ya volumetric), courier usi par charge karta hai.";
  }
  ["w", "l", "b", "h"].forEach((id) => $(id).addEventListener("input", recalc));
  recalc();

  /* ---------------- first-image analysis ---------------- */

  function analyse(file) {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        const scale = Math.min(1, 360 / Math.max(img.width, img.height));
        canvas.width = Math.max(1, Math.round(img.width * scale));
        canvas.height = Math.max(1, Math.round(img.height * scale));
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);

        const bw = Math.max(2, Math.round(canvas.width * 0.08));
        const bh = Math.max(2, Math.round(canvas.height * 0.08));
        let border = 0;
        let white = 0;
        let lumSum = 0;
        let n = 0;
        for (let y = 0; y < canvas.height; y += 2) {
          for (let x = 0; x < canvas.width; x += 2) {
            const i = (y * canvas.width + x) * 4;
            const r = data[i], g = data[i + 1], bl = data[i + 2];
            const lum = 0.2126 * r + 0.7152 * g + 0.0722 * bl;
            lumSum += lum;
            n += 1;
            if (x < bw || x > canvas.width - bw || y < bh || y > canvas.height - bh) {
              border += 1;
              if (lum > 232 && Math.max(r, g, bl) - Math.min(r, g, bl) < 18) white += 1;
            }
          }
        }

        render({
          width: img.width,
          height: img.height,
          sizeKb: Math.round(file.size / 1024),
          whitePct: border ? Math.round((white / border) * 100) : 0,
          brightness: Math.round(lumSum / Math.max(1, n)),
          square: Math.abs(img.width / img.height - 1) < 0.06,
          name: file.name,
        });
      } finally {
        URL.revokeObjectURL(url);
      }
    };
    img.src = url;
  }

  function render(r) {
    const checks = [
      [r.width >= 1000 && r.height >= 1000, r.width >= 512, `Resolution ${r.width}×${r.height}px ${r.width >= 1000 ? "— badiya" : r.width >= 512 ? "— chalega, 1000px+ better hai" : "— Meesho minimum 512px se kam!"}`],
      [r.square, false, r.square ? "Square 1:1 ratio — perfect" : "Image 1:1 square nahi hai — crop karen"],
      [r.whitePct >= 80, r.whitePct >= 55, `Background whiteness ${r.whitePct}% ${r.whitePct >= 80 ? "— clean" : "— first image ke liye plain/white background rakhen"}`],
      [r.sizeKb <= 2048, false, `File size ${r.sizeKb} KB ${r.sizeKb > 2048 ? "— 2MB se zyada hai" : "— OK"}`],
      [r.brightness >= 120, r.brightness >= 90, `Brightness ${r.brightness}/255 ${r.brightness < 120 ? "— photo dark hai" : "— OK"}`],
    ];
    let score = 0;
    for (const [ok, warn] of checks) score += ok ? 20 : warn ? 10 : 0;
    const color = score >= 80 ? "#0f9d63" : score >= 50 ? "#d97706" : ACCENT;

    $("report").innerHTML = `
      <div class="score">
        <div class="ring" style="background:${color}">${score}</div>
        <div>
          <p>${score >= 80 ? "First image ready hai" : score >= 50 ? "Improvement chahiye" : "Ye image first position ke liye risky hai"}</p>
          <small>${r.name.replace(/[<>&]/g, "")}</small>
        </div>
      </div>
      ${checks
        .map(
          ([ok, warn, text]) =>
            `<div class="row ${ok ? "ok" : warn ? "warn" : "bad"}">${ok ? "✓" : "!"} ${text}</div>`,
        )
        .join("")}
      <div class="row warn">
        <b>Shipping tip:</b> agar is image me combo/multi-pack dikh raha hai to declared weight bhi combo ka total hona chahiye —
        warna Meesho weight verification me zyada shipping lag sakti hai. Single listing hai to first image me sirf 1 unit dikhayen.
      </div>
    `;
    panel.classList.add("open");
  }

  // Watch every file input on the supplier portal (works for dynamically added
  // React inputs too, since change events bubble in capture phase).
  document.addEventListener(
    "change",
    (event) => {
      const el = event.target;
      if (!el || el.tagName !== "INPUT" || el.type !== "file") return;
      const file = el.files && el.files[0];
      if (file && /^image\//.test(file.type)) analyse(file);
    },
    true,
  );

  const attach = () => document.body && document.body.appendChild(host);
  if (document.body) attach();
  else document.addEventListener("DOMContentLoaded", attach);
})();
