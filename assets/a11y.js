/* ============================================================
   הקופסה — סרגל נגישות
   ------------------------------------------------------------
   ת"י 5568 / WCAG 2.0 AA.

   ⚠️  הסרגל הזה הוא *תוספת*, לא פתרון. הנגישות האמיתית נמצאת
   בקוד עצמו: מבנה כותרות תקין, טקסט חלופי, ניווט מקלדת,
   ניגודיות צבעים וסימון פוקוס. סרגל לבדו לא עומד בתקן.
   ============================================================ */
(function () {
  "use strict";

  const KEY = "kupsa-a11y";
  const html = document.documentElement;

  const DEFAULTS = {
    fs: 0,            /* 0–3 גודל טקסט */
    contrast: false,  /* ניגודיות גבוהה */
    links: false,     /* הדגשת קישורים */
    readable: false,  /* גופן קריא */
    spacing: false,   /* ריווח מוגדל */
    nomotion: false,  /* עצירת אנימציות */
    mode: false,      /* מצב נגיש — גרסה חלופית תואמת: מכבה רקע, תלת-ממד, שקיפות ותנועה */
  };

  let state = { ...DEFAULTS };
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) state = { ...DEFAULTS, ...JSON.parse(raw) };
  } catch (e) {
    /* אחסון חסום — ממשיכים עם ברירות המחדל */
  }

  /* early: מוחל מיד, לפני ציור הדף, כדי שלא יהבהב העיצוב התלת-ממדי */
  if (state.mode) { html.setAttribute("data-a11ymode", ""); html.setAttribute("data-contrast", "high"); }

  function persist() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {}
  }

  function apply() {
    if (state.fs > 0) html.setAttribute("data-fs", String(state.fs));
    else html.removeAttribute("data-fs");

    /* מצב נגיש מפעיל ניגודיות גבוהה ועצירת תנועה בלי לשנות את הבחירות האישיות */
    if (state.mode) html.setAttribute("data-a11ymode", "");
    else html.removeAttribute("data-a11ymode");
    if (state.contrast || state.mode) html.setAttribute("data-contrast", "high");
    else html.removeAttribute("data-contrast");

    document.body.classList.toggle("a11y-links", state.links);
    document.body.classList.toggle("a11y-readable", state.readable);
    document.body.classList.toggle("a11y-spacing", state.spacing);
    document.body.classList.toggle("a11y-nomotion", state.nomotion || state.mode);
    document.querySelectorAll("[data-a11y-mode]").forEach((b) => {
      b.setAttribute("aria-pressed", String(state.mode));
      b.setAttribute("aria-label", state.mode ? "כיבוי מצב נגיש" : "הפעלת מצב נגיש: ניגודיות גבוהה, בלי רקע ובלי אנימציות");
    });

    document.querySelectorAll("[data-a11y]").forEach((b) => {
      const k = b.dataset.a11y;
      if (k === "fs") b.setAttribute("aria-pressed", String(state.fs > 0));
      else if (k !== "reset") b.setAttribute("aria-pressed", String(!!state[k]));
    });
    const fsLabel = document.getElementById("a11y-fs-label");
    if (fsLabel) fsLabel.textContent = ["רגיל", "גדול", "גדול יותר", "ענק"][state.fs];
  }

  const ICONS = {
    person:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">' +
      '<circle cx="12" cy="4" r="2" fill="currentColor"/><path d="M4 8h16M12 8v6M12 14l-3 7M12 14l3 7" stroke-linecap="round"/></svg>',
    text: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M3 20 9 4h2l6 16h-2.2l-1.5-4.2H6.7L5.2 20H3Zm4.3-6h5.4L10 6.6 7.3 14Z"/><path d="M17 12h5v2h-5z" opacity=".55"/></svg>',
    contrast: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 3a9 9 0 0 1 0 18z" fill="currentColor" stroke="none"/></svg>',
    link: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M10 13a5 5 0 0 0 7 0l2-2a5 5 0 0 0-7-7l-1 1"/><path d="M14 11a5 5 0 0 0-7 0l-2 2a5 5 0 0 0 7 7l1-1"/></svg>',
    font: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M5 4h14v3h-5v13h-4V7H5V4Z"/></svg>',
    spacing: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h16"/><path d="M2 3v18" opacity=".5"/></svg>',
    motion: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="9"/><rect x="9" y="9" width="6" height="6" fill="currentColor" stroke="none"/></svg>',
  };

  function build() {
    const btn = document.createElement("button");
    btn.className = "a11y-btn";
    btn.type = "button";
    btn.setAttribute("aria-label", "פתיחת תפריט נגישות");
    btn.setAttribute("aria-expanded", "false");
    btn.setAttribute("aria-controls", "a11y-panel");
    btn.innerHTML = ICONS.person;

    const panel = document.createElement("div");
    panel.className = "a11y-panel";
    panel.id = "a11y-panel";
    panel.setAttribute("role", "dialog");
    panel.setAttribute("aria-label", "הגדרות נגישות");
    panel.dataset.open = "false";
    panel.innerHTML = `
<h2>נגישות</h2>
<p class="sub">ההגדרות נשמרות בדפדפן שלך.</p>
<button type="button" class="a11y-opt" data-a11y="mode" aria-pressed="false"
        style="width:100%;flex-direction:row;justify-content:center;min-height:52px;margin-bottom:8px;font-size:14px">
  ${ICONS.contrast}<span>מצב נגיש מלא — הכול בלחיצה אחת</span>
</button>
<div class="a11y-grid">
  <button type="button" class="a11y-opt" data-a11y="fs" aria-pressed="false">
    ${ICONS.text}<span>גודל טקסט<br><span id="a11y-fs-label">רגיל</span></span>
  </button>
  <button type="button" class="a11y-opt" data-a11y="contrast" aria-pressed="false">
    ${ICONS.contrast}<span>ניגודיות גבוהה</span>
  </button>
  <button type="button" class="a11y-opt" data-a11y="links" aria-pressed="false">
    ${ICONS.link}<span>הדגשת קישורים</span>
  </button>
  <button type="button" class="a11y-opt" data-a11y="readable" aria-pressed="false">
    ${ICONS.font}<span>גופן קריא</span>
  </button>
  <button type="button" class="a11y-opt" data-a11y="spacing" aria-pressed="false">
    ${ICONS.spacing}<span>ריווח מוגדל</span>
  </button>
  <button type="button" class="a11y-opt" data-a11y="nomotion" aria-pressed="false">
    ${ICONS.motion}<span>עצירת אנימציות</span>
  </button>
</div>
<button type="button" class="btn btn-out btn-sm" data-a11y="reset">איפוס הכול</button>
<p class="note">
  האתר נבנה לפי ת"י 5568 (WCAG 2.0 AA).<br>
  <a href="accessibility.html">הצהרת הנגישות המלאה</a>
</p>`;

    document.body.appendChild(btn);
    document.body.appendChild(panel);

    function setOpen(open) {
      panel.dataset.open = String(open);
      btn.setAttribute("aria-expanded", String(open));
      btn.setAttribute("aria-label", open ? "סגירת תפריט נגישות" : "פתיחת תפריט נגישות");
      if (open) panel.querySelector(".a11y-opt").focus();
    }

    btn.addEventListener("click", () => setOpen(panel.dataset.open !== "true"));

    panel.addEventListener("click", (e) => {
      const b = e.target.closest("[data-a11y]");
      if (!b) return;
      const k = b.dataset.a11y;
      if (k === "reset") state = { ...DEFAULTS };
      else if (k === "fs") state.fs = (state.fs + 1) % 4;
      else state[k] = !state[k];
      persist();
      apply();
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && panel.dataset.open === "true") { setOpen(false); btn.focus(); }
    });
    document.addEventListener("click", (e) => {
      if (panel.dataset.open === "true" && !panel.contains(e.target) && !btn.contains(e.target)) setOpen(false);
    });
  }

  function skipLink() {
    if (document.querySelector(".skip")) return;
    const a = document.createElement("a");
    a.className = "skip";
    a.href = "#app";
    a.textContent = "דילוג לתוכן הראשי";
    document.body.insertBefore(a, document.body.firstChild);
    const main = document.getElementById("app");
    if (main) { main.setAttribute("tabindex", "-1"); main.setAttribute("role", "main"); }
  }

  document.addEventListener("click", (e) => {
    if (!e.target.closest("[data-a11y-mode]")) return;
    state.mode = !state.mode;
    persist();
    apply();
  });

  function start() {
    skipLink();
    build();
    apply();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();

  window.A11y = { get state() { return { ...state }; }, apply };
})();
