/* ============================================================
   הקופסה — מנוע האתר
   ============================================================ */
(function () {
  "use strict";

  const CFG = window.SITE_CONFIG || {};
  const MEALS = window.MEALS || [];
  const PRODUCTS = window.PRODUCTS || [];
  const NUTRI = window.NUTRITION || {};

  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const esc = (s) =>
    String(s == null ? "" : s).replace(/[&<>"']/g, (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])
    );
  const ico = (n, c) => (window.Icons ? window.Icons.use(n, c) : "");
  const qp = (k) => new URLSearchParams(location.search).get(k);

  const activeAllergens = () => (CFG.allergens || []).filter((a) => a.active);
  const catById = (id) => (CFG.categories || []).find((c) => c.id === id);
  const diffByLevel = (l) => (CFG.difficulties || []).find((d) => d.level === Number(l)) || { name: "—", desc: "" };
  const mealById = (id) => MEALS.find((m) => m.id === id);

  const IMG = CFG.images || { mealDir: "assets/img/meals/", heroDir: "assets/img/hero/", ext: ".jpg" };
  const mealImg = (id) => IMG.mealDir + id + (IMG.mealExt || IMG.ext);
  const heroImg = (n) => IMG.heroDir + n + IMG.ext;
  /* url() בתוך משתנה CSS נפתר יחסית לקובץ ה-CSS, לא לדף — לכן כתובת מלאה */
  const absUrl = (u) => new URL(u, location.href).href;


  /* ============================================================
     מאגרים מקומיים — מועדפים והשבוע
     הכול ב-localStorage, לא נשלח לשום שרת.
     ============================================================ */
  const FAV_KEY = "kupsa-favs";
  const WEEK_KEY = "kupsa-week";
  /* ימי שבוע הלימודים. פינוק שישי מוגבל ליום ו' בלבד. */
  const DAYS = [
    { id: "sun", name: "ראשון", short: "א׳" },
    { id: "mon", name: "שני", short: "ב׳" },
    { id: "tue", name: "שלישי", short: "ג׳" },
    { id: "wed", name: "רביעי", short: "ד׳" },
    { id: "thu", name: "חמישי", short: "ה׳" },
    { id: "fri", name: "שישי", short: "ו׳" },
  ];
  /* משבצת לכל קטגוריה. friday ננעל ליום שישי. */
  const SLOTS = { breakfast: "בוקר", lunch: "צהריים", friday: "פינוק" };

  function readJSON(k, fallback) {
    try { return JSON.parse(localStorage.getItem(k)) || fallback; }
    catch (e) { return fallback; }
  }
  function writeJSON(k, v) {
    try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {}
  }

  const Favs = {
    all: () => readJSON(FAV_KEY, []),
    has: (id) => Favs.all().indexOf(id) >= 0,
    toggle(id) {
      const a = Favs.all(); const i = a.indexOf(id);
      if (i >= 0) a.splice(i, 1); else a.push(id);
      writeJSON(FAV_KEY, a);
      document.dispatchEvent(new CustomEvent("kupsa:favs"));
      return i < 0;
    },
  };

  /* ============================================================
     תכנון שבועי לכמה ילדים
     plan = {
       v: 2,
       kids: [{ id:"k_…", name:"…" }],          ← הסדר במערך = סדר השורות בטבלה
       plan: { kidId: { sun:{breakfast:"id",lunch:"id"}, …, fri:{…, friday:"id"} } },
       week: "",                                ← טקסט חופשי לכותרת "שבוע:"
       have: { "שם מוצר|יחידה": true }          ← "יש בבית" ברשימת המצרכים
     }
     המזהה של ילד קבוע ואינו תלוי בשם, כך ששינוי שם לא נוגע בשיבוצים.
     תכנון ישן (kupsa-week, לפני שהיו ילדים) לא נמחק: הוא נשאר עד שההורה
     משייך אותו לילד — ראו Week.legacy() / Week.adoptLegacy().
     ============================================================ */
  const PLAN_KEY = "kupsa-plan";
  const emptyPlan = () => ({ v: 2, kids: [], plan: {}, week: "", have: {} });
  const newKidId = () => "k_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  const countDays = (p) => {
    let n = 0;
    Object.keys(p || {}).forEach((d) => { n += Object.keys(p[d] || {}).length; });
    return n;
  };

  const Week = {
    read() {
      const p = readJSON(PLAN_KEY, null);
      if (!p || p.v !== 2) return emptyPlan();
      return { ...emptyPlan(), ...p };
    },
    write(p, silent) {
      writeJSON(PLAN_KEY, p);
      if (!silent) document.dispatchEvent(new CustomEvent("kupsa:week"));
    },
    /* --- ילדים --- */
    kids: () => Week.read().kids,
    kid: (id) => Week.read().kids.find((k) => k.id === id) || null,
    addKid(name) {
      name = String(name || "").trim();
      if (!name) return null;
      const p = Week.read();
      const k = { id: newKidId(), name };
      p.kids.push(k);
      Week.write(p);
      return k;
    },
    renameKid(id, name) {
      name = String(name || "").trim();
      const p = Week.read(); const k = p.kids.find((x) => x.id === id);
      if (!k || !name) return false;
      k.name = name; Week.write(p); return true;
    },
    moveKid(id, dir) {
      const p = Week.read(); const i = p.kids.findIndex((x) => x.id === id); const j = i + dir;
      if (i < 0 || j < 0 || j >= p.kids.length) return;
      [p.kids[i], p.kids[j]] = [p.kids[j], p.kids[i]];
      Week.write(p);
    },
    removeKid(id) {
      const p = Week.read();
      p.kids = p.kids.filter((x) => x.id !== id);
      delete p.plan[id];
      Week.write(p);
    },
    kidMealCount: (id) => countDays(Week.read().plan[id]),
    /* --- שיבוצים --- */
    get: (kid, day, slot) => (((Week.read().plan[kid] || {})[day]) || {})[slot] || null,
    cell: (kid, day) => ({ ...(((Week.read().plan[kid] || {})[day]) || {}) }),
    set(kid, day, slot, mealId, silent) {
      const p = Week.read();
      const k = (p.plan[kid] = p.plan[kid] || {});
      k[day] = k[day] || {};
      if (mealId) k[day][slot] = mealId; else delete k[day][slot];
      if (!Object.keys(k[day]).length) delete k[day];
      Week.write(p, silent);
    },
    clear() {
      const p = Week.read(); p.plan = {}; Week.write(p);
    },
    mealCount() {
      const p = Week.read(); let n = 0;
      p.kids.forEach((k) => { n += countDays(p.plan[k.id]); });
      return n;
    },
    /* --- כותרת השבוע וסימוני "יש בבית" --- */
    weekLabel: () => Week.read().week || "",
    setWeekLabel(t) { const p = Week.read(); p.week = String(t || "").slice(0, 60); Week.write(p, true); },
    have: (key) => !!Week.read().have[key],
    setHave(key, on) {
      const p = Week.read();
      if (on) p.have[key] = true; else delete p.have[key];
      Week.write(p, true);
    },
    /* --- תאימות לתכנון הישן --- */
    legacy() {
      const w = readJSON(WEEK_KEY, null);
      return w && typeof w === "object" && countDays(w) ? w : null;
    },
    adoptLegacy(kidId) {
      const w = Week.legacy();
      if (!w) return 0;
      const p = Week.read();
      if (!p.kids.some((k) => k.id === kidId)) return 0;
      const k = (p.plan[kidId] = p.plan[kidId] || {});
      let n = 0;
      Object.keys(w).forEach((d) => {
        if (!DAYS.some((x) => x.id === d)) return;
        Object.keys(w[d] || {}).forEach((s) => {
          if (!SLOTS[s] || !mealById(w[d][s])) return;
          k[d] = k[d] || {};
          k[d][s] = w[d][s]; n++;
        });
      });
      /* קודם מוחקים את הישן, כדי שהציור מחדש כבר לא יציג את ההודעה */
      try { localStorage.removeItem(WEEK_KEY); } catch (e) {}
      Week.write(p);
      return n;
    },
    dismissLegacy() { try { localStorage.removeItem(WEEK_KEY); } catch (e) {} },
  };

  /* משבצת לפי קטגוריית המנה. פינוק שישי — רק ביום שישי. */
  const slotOf = (m) => (m.cat === "lunch" ? "lunch" : m.cat === "friday" ? "friday" : "breakfast");
  const daysFor = (slot) => (slot === "friday" ? DAYS.filter((d) => d.id === "fri") : DAYS);
  const dayById = (id) => DAYS.find((d) => d.id === id);
  /* "מגן", "מגן ונגב", "מגן, נגב ותמר" */
  const joinNames = (a) => (a.length < 2 ? a.join("") : a.slice(0, -1).join(", ") + " ו" + a[a.length - 1]);

  /* ---------- תמונה עם נפילה חלקה לאיור ---------- */
  /* אם קובץ התמונה לא קיים, האיור הווקטורי מוצג במקומו. */
  /* האיור מרונדר תמיד *מתחת* לתמונה. אם קובץ התמונה קיים הוא מכסה אותו,
     ואם לא — התמונה השבורה מוסרת והאיור פשוט נשאר. כך אין רגע של ריבוע ריק,
     וזה עובד גם עם loading="lazy". */
  /* alt ריק = תמונה דקורטיבית. זה *נכון* כשהשם כבר מופיע כטקסט
     בתוך אותו קישור — אחרת קורא מסך יקריא את השם פעמיים (WCAG 1.1.1). */
  function img(src, phHtml, cls, alt) {
    return phHtml + `<img src="${esc(src)}" alt="${esc(alt || "")}" class="${cls || ""}" loading="lazy" data-fb="1">`;
  }
  document.addEventListener(
    "error",
    (e) => {
      const t = e.target;
      if (t && t.tagName === "IMG" && t.dataset.fb) t.remove();
    },
    true
  );

  /* ---------- סריקת אלרגנים ---------- */
  function scanText(text) {
    const t = String(text || "").toLowerCase();
    return activeAllergens().filter((a) =>
      (a.aliases || [a.name]).some((w) => t.includes(String(w).toLowerCase()))
    );
  }

  /* ---------- ערכת נושא ---------- */
  function initTheme() {
    let saved = null;
    try { saved = localStorage.getItem("kupsa-theme"); } catch (e) {}
    if (saved === "dark" || saved === "light") document.documentElement.setAttribute("data-theme", saved);
    document.addEventListener("click", (e) => {
      if (!e.target.closest("[data-theme-toggle]")) return;
      const cur = document.documentElement.getAttribute("data-theme");
      const isDark = cur === "dark" || (!cur && matchMedia("(prefers-color-scheme: dark)").matches);
      const next = isDark ? "light" : "dark";
      document.documentElement.setAttribute("data-theme", next);
      try { localStorage.setItem("kupsa-theme", next); } catch (e) {}
    });
  }

  /* ---------- נטייה תלת-ממדית ----------
     רק בעכבר/משטח מגע, לא במסך מגע, לא במצב נגיש ולא בהעדפת הפחתת תנועה. */
  function initTilt() {
    if (!matchMedia("(hover:hover) and (pointer:fine)").matches) return;
    const off = () =>
      document.documentElement.hasAttribute("data-a11ymode") ||
      document.body.classList.contains("a11y-nomotion") ||
      matchMedia("(prefers-reduced-motion: reduce)").matches;
    const SEL = ".dish,.cat,.daycard,.pc";
    const MAX = 7;
    document.addEventListener("pointermove", (e) => {
      const el = e.target.closest(SEL);
      if (!el || off()) return;
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
      el.style.setProperty("--ry", ((px - 0.5) * MAX * 2).toFixed(2) + "deg");
      el.style.setProperty("--rx", ((0.5 - py) * MAX * 2).toFixed(2) + "deg");
      el.style.setProperty("--gx", (px * 100).toFixed(1) + "%");
      el.style.setProperty("--gy", (py * 100).toFixed(1) + "%");
      el.classList.add("tilting");
    }, { passive: true });
    document.addEventListener("pointerout", (e) => {
      const el = e.target.closest(SEL);
      if (!el || el.contains(e.relatedTarget)) return;
      el.classList.remove("tilting");
      el.style.setProperty("--rx", "0deg"); el.style.setProperty("--ry", "0deg");
    }, { passive: true });
  }

  /* ---------- תפריט נייד ---------- */
  function initAllergyBar() {
    if (matchMedia("(max-width:760px)").matches) {
      $$(".allergy-det").forEach((d) => d.removeAttribute("open"));
    }
  }

  function initNav() {
    document.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-nav-toggle]");
      const nav = $("#mainNav");
      if (!nav) return;
      if (btn) {
        const open = nav.classList.toggle("open");
        btn.setAttribute("aria-expanded", String(open));
        return;
      }
      /* סגירה בלחיצה על קישור או מחוץ לתפריט */
      if (nav.classList.contains("open") && (e.target.closest("#mainNav a") || !e.target.closest("#mainNav"))) {
        nav.classList.remove("open");
        const b = $("[data-nav-toggle]");
        if (b) b.setAttribute("aria-expanded", "false");
      }
    });
    document.addEventListener("keydown", (e) => {
      if (e.key !== "Escape") return;
      const nav = $("#mainNav");
      if (nav && nav.classList.contains("open")) {
        nav.classList.remove("open");
        const b = $("[data-nav-toggle]");
        if (b) { b.setAttribute("aria-expanded", "false"); b.focus(); }
      }
    });
  }

  /* ---------- אנימציית כניסה ---------- */
  function initRise() {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
      $$(".rise").forEach((el) => el.classList.add("in"));
      return;
    }
    const io = new IntersectionObserver(
      (rows) => rows.forEach((r) => { if (r.isIntersecting) { r.target.classList.add("in"); io.unobserve(r.target); } }),
      { threshold: 0.08, rootMargin: "0px 0px -40px 0px" }
    );
    $$(".rise").forEach((el, i) => { el.style.transitionDelay = Math.min(i % 8, 6) * 60 + "ms"; io.observe(el); });
  }

  /* ---------- שלד ---------- */
  function header(active) {
    const chips = activeAllergens().map((a) => `<span class="chip chip-x">${esc(a.name)}</span>`).join("");
    const ok = (CFG.allowed || []).length ? `<span class="chip chip-ok">מותר: ${esc(CFG.allowed.join(", "))}</span>` : "";
    /* כפתורי הארוחות בראש העמוד (בטלפון — במקום הלוגו) */
    const QUICK = { breakfast: "ארוחת בוקר", lunch: "צהריים", friday: "פינוק לשישי" };
    const CAT_IDS = (CFG.categories || []).map((c) => c.id);
    const nav = [
      ["index.html", "ראשי", "home"],
      ...(CFG.categories || []).map((c) => [`category.html?cat=${c.id}`, c.id === "friday" ? "פינוק לשישי" : c.name, c.id]),
      ["planner.html", "השבוע שלי", "planner"],
      ["favorites.html", "מועדפים", "favorites"],
      ["products.html", "מדריך קניות", "products"],
      ["suggest.html", "הציעו מתכון", "suggest"],
    ];
    return `
<header class="hdr">
  <div class="hdr-in">
    <nav class="quick-cats" aria-label="סוגי ארוחות">
      ${(CFG.categories || []).map((c) => `<a href="category.html?cat=${c.id}"${active === c.id ? ' aria-current="page"' : ""}>${esc(QUICK[c.id] || c.name)}</a>`).join("")}
    </nav>
    <nav class="nav" id="mainNav" aria-label="ניווט ראשי">
      ${nav.map(([href, label, key]) => `<a href="${href}"${active === key ? ' aria-current="page"' : ""}${CAT_IDS.includes(key) ? ' class="nav-cat"' : ""}>${esc(label)}</a>`).join("")}
      <button class="nav-theme" type="button" data-theme-toggle>${ico("moon")}מצב בהיר / כהה</button>
    </nav>
    <span class="hdr-spacer"></span>
    <button class="a11y-mode-btn" type="button" data-a11y-mode aria-pressed="false">
      ${ico("access")}<span class="lbl">מצב נגיש</span>
    </button>
    <button class="icon-btn hdr-theme" data-theme-toggle aria-label="החלף ערכת נושא">${ico("moon")}</button>
    <button class="icon-btn nav-toggle" data-nav-toggle aria-label="תפריט" aria-expanded="false" aria-controls="mainNav">
      <span class="ic-open">${ico("menu")}</span><span class="ic-close">${ico("x")}</span>
    </button>
  </div>
</header>
<div class="allergy-bar" role="region" aria-label="כללי בית הספר">
  <div class="allergy-bar-in">
    <details class="allergy-det">
      <summary>${ico("shield")}<b>כללי בית הספר</b><span class="cnt">${activeAllergens().length} אלרגנים אסורים</span><span class="tog" aria-hidden="true"></span></summary>
      <div class="allergy-chips"><b>אסור בבית הספר:</b>${chips}${ok}</div>
    </details>
    <span class="rule-sep" aria-hidden="true"></span>
    <a class="rule-link" href="products.html">בדקו תמיד את תווית המוצר</a>
  </div>
</div>`;
  }

  /* ---------- סרגל ניווט תחתון (נייד) ---------- */
  function tabbar(active) {
    const n = Week.mealCount();
    const items = [
      ["index.html", "בית", "home", "home", 0],
      ["favorites.html", "מועדפים", "heart", "favorites", Favs.all().length],
      ["planner.html", "השבוע שלי", "calendar", "planner", n],
      ["products.html", "קניות", "cart", "products", 0],
    ];
    return `
<nav class="tabbar" aria-label="ניווט מהיר">
  ${items.map(([href, label, icon, key, count]) => `
  <a href="${href}"${active === key ? ' aria-current="page"' : ""}>
    ${ico(icon)}<span>${esc(label)}</span>
    ${count ? `<span class="badge-dot" aria-label="${count} פריטים">${count}</span>` : ""}
  </a>`).join("")}
</nav>`;
  }

  function footer() {
    return `
<footer class="ftr">
  <div class="ftr-in">
    <div class="ftr-grid">
      <div>
        <h3 style="font-size:17px">${esc(CFG.siteName)}</h3>
        <p class="ftr-note">${esc(CFG.tagline || "")}</p>
      </div>
      <div>
        <h3 style="font-size:17px">קטגוריות</h3>
        <ul>${(CFG.categories || []).map((c) => `<li><a href="category.html?cat=${c.id}">${esc(c.name)}</a></li>`).join("")}</ul>
      </div>
      <div>
        <h3 style="font-size:17px">אלרגנים אסורים</h3>
        <ul>${activeAllergens().map((a) => `<li>${esc(a.name)}</li>`).join("")}</ul>
      </div>
      <div>
        <h3 style="font-size:17px">חשוב לדעת</h3>
        <p class="ftr-note">${esc(CFG.disclaimer || "")}</p>
      </div>
    </div>
    <div class="ftr-bot">
      <span>${esc(CFG.siteName)} · עודכן ${esc(CFG.updated || "")}</span>
      <span class="hdr-spacer" style="flex:1"></span>
      <a href="accessibility.html">הצהרת נגישות</a>
      <a href="accessibility.html#privacy">פרטיות</a>
      <a href="products.html">מדריך קניות</a>
      <a href="suggest.html">הציעו מתכון</a>
    </div>
    <div class="ftr-brand">
      <a class="logo ftr-logo" href="index.html"><span class="logo-mark">${ico("box")}</span><span>${esc(CFG.siteName)}</span></a>
    </div>
  </div>
</footer>`;
  }

  function pips(level) {
    let h = `<span class="pips d${level}">`;
    for (let i = 1; i <= 5; i++) h += `<span class="pip${i <= level ? " on" : ""}"></span>`;
    return h + "</span>";
  }

  /* lvl=1 כשזו כותרת העמוד הראשית (עמוד חייב h1 אחד) */
  function titleArea(sub, title, p, lvl) {
    const T = lvl === 1 ? "h1" : "h2";
    return `<div class="title-area rise">
      <div class="sub-title">${esc(sub)}</div>
      <${T}>${esc(title)}</${T}>${p ? `<p>${esc(p)}</p>` : ""}
    </div>`;
  }

  /* ---------- תגיות בריאות ----------
     נגזרות מ-nutrition.js בלבד. ספים שמרניים:
     חלבון ≥ 15 גר׳ ≈ 43% מהצורך היומי; סוכר ≤ 6 גר׳ למנה. */
  function healthTags(m) {
    const n = NUTRI[m.id];
    if (!n) return "";
    const t = [];
    if (n.protein >= 15) t.push(`<span class="health-tag">${ico("leaf")}חלבון גבוה</span>`);
    if (n.sugar <= 6) t.push(`<span class="health-tag">${ico("leaf")}דל סוכר</span>`);
    return t.length ? `<div class="dish-health">${t.join("")}</div>` : "";
  }

  /* ---------- כרטיס מנה — לפי ההדמיה: תמונה, שם, זמן, כפתור ---------- */
  function mealCard(m, opts) {
    opts = opts || {};
    const ph = `<span class="ph">${ico(m.icon)}</span>`;
    const faved = Favs.has(m.id);
    const href = `meal.html?id=${encodeURIComponent(m.id)}`;
    return `
<article class="dish rise">
  <button class="fav" type="button" data-fav="${esc(m.id)}" aria-pressed="${faved}"
          aria-label="${faved ? "הסרה מהמועדפים" : "הוספה למועדפים"}: ${esc(m.name)}">${ico("heart")}</button>
  <a class="dish-thumb" href="${href}" tabindex="-1" aria-hidden="true">${img(mealImg(m.id), ph)}</a>
  <div class="dish-body">
    <h3><a href="${href}">${esc(m.name)}</a></h3>
    <div class="dish-meta">${ico("clock")}<span>${esc(m.prepTime)} דקות</span><span class="dot"></span><span>${esc(m.kosher)}</span></div>
  </div>
  <div class="dish-foot">
    <button class="dish-add" type="button" data-add="${esc(m.id)}">
      <span class="plus-c" aria-hidden="true">${ico("plus")}</span>${opts.addLabel || "הוסף לטבלה"}
    </button>
  </div>
</article>`;
  }

  /* ---------- חלונית כללית: פוקוס כלוא, Esc סוגר, הפוקוס חוזר למקום ---------- */
  const FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea,[tabindex]:not([tabindex="-1"])';
  function openModal(inner, opts) {
    opts = opts || {};
    const ret = document.activeElement;
    const back = document.createElement("div");
    back.className = "modal-back";
    back.innerHTML = `<div class="modal ${opts.cls || ""}" role="dialog" aria-modal="true" aria-labelledby="${opts.labelId}">${inner}</div>`;
    document.body.appendChild(back);
    const modal = back.firstElementChild;
    const onKey = (e) => {
      if (e.key === "Escape") { e.preventDefault(); close(); return; }
      if (e.key !== "Tab") return;
      const f = $$(FOCUSABLE, modal).filter((x) => x.offsetParent !== null);
      if (!f.length) return;
      if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
      else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
    };
    function close() {
      back.remove();
      document.removeEventListener("keydown", onKey);
      if (opts.onClose) opts.onClose();
      /* אם הכפתור המקורי נבנה מחדש בינתיים — מחפשים את התחליף שלו */
      const again = opts.returnSel ? $(opts.returnSel) : null;
      const t = again || (ret && document.contains(ret) ? ret : null);
      if (t && t.focus) t.focus();
    }
    document.addEventListener("keydown", onKey);
    back.addEventListener("mousedown", (e) => { if (e.target === back) close(); });
    modal.addEventListener("click", (e) => { if (e.target.closest("[data-close]")) close(); });
    return { back, modal, close };
  }

  /* ---------- "הוסף לטבלה": מנה → ילד אחד או כמה → יום ---------- */
  function openAddToTable(mealId) {
    const m = mealById(mealId);
    if (!m) return;
    const slot = slotOf(m);
    const days = daysFor(slot);
    let picked = { kids: null, day: days.length === 1 ? days[0].id : null };
    let armed = false; /* אישור החלפה ממתין */

    const ui = openModal(`
<h2 id="addT">הוספה לטבלה</h2>
<p class="add-meal"><span class="add-ico" aria-hidden="true">${ico(m.icon)}</span><b>${esc(m.name)}</b><span class="slot-tag">${esc(SLOTS[slot])}</span></p>
${slot === "friday" ? `<p class="modal-sub">פינוק שישי נכנס ליום שישי בלבד.</p>` : ""}
<div id="addBody"></div>`, { labelId: "addT", cls: "modal-add" });

    function kidsPart() {
      const kids = Week.kids();
      if (!kids.length) {
        return `
<fieldset class="pick">
  <legend>לאיזה ילד?</legend>
  <p class="pick-hint">עוד לא הוגדרו ילדים. מוסיפים שם — וממשיכים עם המנה.</p>
  <div class="kid-add">
    <label class="sr-only" for="addKidName">שם הילד או הילדה</label>
    <input id="addKidName" type="text" maxlength="30" autocomplete="off" placeholder="שם הילד או הילדה">
    <button class="btn btn-sm" type="button" data-addkid>${ico("plus")}הוסף ילד</button>
  </div>
</fieldset>`;
      }
      if (picked.kids === null) picked.kids = kids.length === 1 ? [kids[0].id] : [];
      return `
<fieldset class="pick">
  <legend>לאיזה ילד? <span class="pick-hint">אפשר לבחור כמה</span></legend>
  <div class="kid-checks">
    ${kids.map((k) => `
    <label class="kchk">
      <input type="checkbox" value="${esc(k.id)}" data-kid${picked.kids.includes(k.id) ? " checked" : ""}>
      <span>${esc(k.name)}</span>
    </label>`).join("")}
  </div>
  <details class="kid-more">
    <summary>${ico("plus")}ילד נוסף</summary>
    <div class="kid-add">
      <label class="sr-only" for="addKidName">שם הילד או הילדה</label>
      <input id="addKidName" type="text" maxlength="30" autocomplete="off" placeholder="שם הילד או הילדה">
      <button class="btn btn-sm" type="button" data-addkid>הוסף</button>
    </div>
  </details>
</fieldset>`;
    }

    function daysPart() {
      return `
<fieldset class="pick">
  <legend>באיזה יום?</legend>
  <div class="daygrid">
    ${days.map((d) => `
    <label class="daybtn${picked.day === d.id ? " on" : ""}">
      <input type="radio" name="addDay" value="${d.id}" class="sr-only"${picked.day === d.id ? " checked" : ""}>
      <b>${esc(d.short)}</b><span>${esc(d.name)}</span>
    </label>`).join("")}
  </div>
</fieldset>`;
    }

    /* מה יקרה אם נלחץ עכשיו: חדש / כבר קיים / החלפה */
    function plan() {
      const out = { add: [], dup: [], swap: [] };
      if (!picked.day || !picked.kids) return out;
      picked.kids.forEach((kid) => {
        const k = Week.kid(kid); if (!k) return;
        const cur = Week.get(kid, picked.day, slot);
        if (cur === m.id) out.dup.push(k);
        else if (cur) out.swap.push({ k, old: mealById(cur) });
        else out.add.push(k);
      });
      return out;
    }

    function statusPart() {
      const p = plan();
      const day = picked.day ? dayById(picked.day).name : "";
      let h = "";
      if (p.dup.length) h += `<p class="st st-info">${ico("check")}<span>אצל ${esc(joinNames(p.dup.map((k) => k.name)))} המנה כבר משובצת ביום ${esc(day)}. לא נוסיף אותה שוב.</span></p>`;
      if (p.swap.length) h += `<p class="st st-warn">${ico("alert")}<span>${p.swap.map((s) =>
        `אצל ${esc(s.k.name)} ביום ${esc(day)} כבר משובץ: <b>${esc(s.old ? s.old.name : "מנה אחרת")}</b>.`).join(" ")}
        ${armed ? " <b>ללחוץ שוב כדי לאשר את ההחלפה.</b>" : " היא תוחלף — נבקש אישור."}</span></p>`;
      return h;
    }

    function draw(focusSel) {
      const p = plan();
      const label = armed ? "כן, להחליף" : p.swap.length ? "הוספה והחלפה" : "הוספה לטבלה";
      $("#addBody", ui.modal).innerHTML = `
${kidsPart()}
${daysPart()}
<div id="addMsg" role="status" aria-live="polite">${statusPart()}</div>
<div class="btn-row" style="margin-top:18px">
  <button class="btn" type="button" data-go>${ico("calendar")}${label}</button>
  <button class="btn btn-out btn-sm" type="button" data-close>ביטול</button>
</div>`;
      const f = focusSel && $(focusSel, ui.modal);
      if (f) f.focus();
    }

    function done(p) {
      const day = dayById(picked.day).name;
      const names = [...p.add, ...p.swap.map((s) => s.k)].map((k) => k.name);
      const msg = names.length
        ? `${m.name} נוסף לטבלה של ${joinNames(names)} ביום ${day}.`
        : `${m.name} כבר היה משובץ ביום ${day}. לא שינינו כלום.`;
      $("#addBody", ui.modal).innerHTML = `
<div class="add-done" role="status">
  <span class="add-done-ico" aria-hidden="true">${ico("check")}</span>
  <p><b>${esc(msg)}</b></p>
  ${p.swap.length ? `<p class="pick-hint">הוחלף: ${p.swap.map((s) => esc(`${s.old ? s.old.name : "מנה"} אצל ${s.k.name}`)).join(", ")}.</p>` : ""}
  ${names.length && p.dup.length ? `<p class="pick-hint">אצל ${esc(joinNames(p.dup.map((k) => k.name)))} היא כבר הייתה משובצת.</p>` : ""}
</div>
<div class="btn-row" style="margin-top:18px">
  ${document.body.dataset.page === "planner" ? "" : `<a class="btn" href="planner.html">${ico("calendar")}לטבלה</a>`}
  <button class="btn btn-out btn-sm" type="button" data-close>סגירה</button>
</div>`;
      $(".add-done", ui.modal).setAttribute("tabindex", "-1");
      $(".add-done", ui.modal).focus();
      toast(msg);
    }

    function addKidFromInput() {
      const inp = $("#addKidName", ui.modal);
      const name = inp && inp.value.trim();
      if (!name) { if (inp) inp.focus(); return; }
      const k = Week.addKid(name);
      picked.kids = (picked.kids || []).concat(k.id);
      armed = false;
      draw(`[data-kid][value="${k.id}"]`);
      $("#addMsg", ui.modal).insertAdjacentHTML("afterbegin", `<p class="st st-info">${ico("check")}<span>${esc(name)} נוסף ונבחר.</span></p>`);
    }

    ui.modal.addEventListener("change", (e) => {
      if (e.target.matches("[data-kid]")) {
        picked.kids = $$("[data-kid]", ui.modal).filter((x) => x.checked).map((x) => x.value);
      } else if (e.target.name === "addDay") {
        picked.day = e.target.value;
        $$(".daybtn", ui.modal).forEach((l) => l.classList.toggle("on", l.contains(e.target)));
      } else return;
      armed = false;
      $("#addMsg", ui.modal).innerHTML = statusPart();
      const p = plan();
      $("[data-go]", ui.modal).innerHTML = `${ico("calendar")}${p.swap.length ? "הוספה והחלפה" : "הוספה לטבלה"}`;
    });
    ui.modal.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && e.target.id === "addKidName") { e.preventDefault(); addKidFromInput(); }
    });
    ui.modal.addEventListener("click", (e) => {
      if (e.target.closest("[data-addkid]")) return addKidFromInput();
      if (!e.target.closest("[data-go]")) return;
      const msg = $("#addMsg", ui.modal);
      if (!Week.kids().length) { msg.innerHTML = `<p class="st st-warn">${ico("alert")}<span>קודם מוסיפים שם של ילד.</span></p>`; return $("#addKidName", ui.modal).focus(); }
      if (!picked.kids || !picked.kids.length) { msg.innerHTML = `<p class="st st-warn">${ico("alert")}<span>בחרו לפחות ילד אחד.</span></p>`; return; }
      if (!picked.day) { msg.innerHTML = `<p class="st st-warn">${ico("alert")}<span>בחרו יום.</span></p>`; return; }
      const p = plan();
      if (p.swap.length && !armed) { armed = true; draw("[data-go]"); return; }
      [...p.add, ...p.swap.map((s) => s.k)].forEach((k) => Week.set(k.id, picked.day, slot, m.id, true));
      document.dispatchEvent(new CustomEvent("kupsa:week"));
      done(p);
    });

    draw();
    const first = $("#addKidName", ui.modal) || $("[data-kid]", ui.modal);
    (first || $("[data-go]", ui.modal)).focus();
  }
  /* שם ישן — נשאר לתאימות */
  const openDayPicker = openAddToTable;

  /* ---------- עריכת תא בטבלה: בחירה, החלפה או הסרה ---------- */
  function openCellEditor(kidId, dayId) {
    const k = Week.kid(kidId), d = dayById(dayId);
    if (!k || !d) return;
    const cur = Week.cell(kidId, dayId);
    const slots = Object.keys(SLOTS).filter((s) => s !== "friday" || dayId === "fri");
    const catOf = { breakfast: "breakfast", lunch: "lunch", friday: "friday" };
    const optList = (slot) => {
      const list = MEALS.filter((x) => x.cat === catOf[slot]);
      const grp = (t, arr) => arr.length ? `<optgroup label="${t}">${arr.map((x) =>
        `<option value="${esc(x.id)}"${cur[slot] === x.id ? " selected" : ""}>${esc(x.name)}</option>`).join("")}</optgroup>` : "";
      return `<option value="">— בלי ${esc(SLOTS[slot])} —</option>` +
        grp("כריכים", list.filter((x) => x.type === "sandwich")) + grp("מנות נוספות", list.filter((x) => x.type !== "sandwich"));
    };
    const ui = openModal(`
<h2 id="cellT">${esc(k.name)} · יום ${esc(d.name)}</h2>
<p class="modal-sub">בוחרים מנה לכל ארוחה. "בלי" מסיר אותה מהיום.</p>
${slots.map((s) => `
<div class="fld cell-fld">
  <label for="cs-${s}">${esc(SLOTS[s])}</label>
  <div class="cell-row">
    <select id="cs-${s}" data-slot="${s}">${optList(s)}</select>
    ${cur[s] ? `<button class="btn btn-out btn-sm" type="button" data-clear="${s}" aria-label="הסרת ה${esc(SLOTS[s])} מיום ${esc(d.name)}">${ico("trash")}הסרה</button>` : ""}
  </div>
</div>`).join("")}
<div class="btn-row" style="margin-top:8px">
  <button class="btn" type="button" data-save>${ico("check")}שמירה</button>
  <button class="btn btn-out btn-sm" type="button" data-close>ביטול</button>
</div>`, { labelId: "cellT", returnSel: `[data-cell="${kidId}|${dayId}"]` });

    ui.modal.addEventListener("click", (e) => {
      const c = e.target.closest("[data-clear]");
      if (c) { const sel = $(`#cs-${c.dataset.clear}`, ui.modal); sel.value = ""; sel.focus(); c.remove(); return; }
      if (!e.target.closest("[data-save]")) return;
      let changed = 0;
      $$("select[data-slot]", ui.modal).forEach((sel) => {
        const s = sel.dataset.slot, v = sel.value || null;
        if ((cur[s] || null) !== v) { Week.set(kidId, dayId, s, v, true); changed++; }
      });
      /* קודם מציירים מחדש ואז סוגרים — כך הפוקוס חוזר לתא החדש */
      if (changed) { document.dispatchEvent(new CustomEvent("kupsa:week")); toast(`הטבלה של ${k.name} עודכנה ליום ${d.name}`); }
      ui.close();
    });
    $("select", ui.modal).focus();
  }

  /* ---------- ניהול הילדים ---------- */
  function openKidsManager() {
    const ui = openModal(`
<h2 id="kidsT">ניהול הילדים</h2>
<p class="modal-sub">כל ילד מקבל שורה בטבלה. אפשר לשנות שם וסדר — השיבוצים נשמרים.</p>
<div id="kidsBody"></div>
<p class="store-note">${ico("shield")}השמות והתכנון נשמרים רק בדפדפן הזה, במכשיר הזה. הם לא נשלחים לשום מקום.</p>
<div class="btn-row" style="margin-top:12px"><button class="btn btn-out btn-sm" type="button" data-close>סיום</button></div>`,
      { labelId: "kidsT", returnSel: "#kidsBtn" });

    function draw(focusSel) {
      const kids = Week.kids();
      $("#kidsBody", ui.modal).innerHTML = `
${kids.length ? `<ol class="kid-list">${kids.map((k, i) => `
  <li>
    <label class="sr-only" for="kn-${esc(k.id)}">שם ילד ${i + 1}</label>
    <input id="kn-${esc(k.id)}" type="text" maxlength="30" value="${esc(k.name)}" data-rename="${esc(k.id)}" autocomplete="off">
    <button class="icon-btn sm" type="button" data-move="${esc(k.id)}|-1"${i === 0 ? " disabled" : ""} aria-label="להזיז את ${esc(k.name)} למעלה">${ico("up")}</button>
    <button class="icon-btn sm" type="button" data-move="${esc(k.id)}|1"${i === kids.length - 1 ? " disabled" : ""} aria-label="להזיז את ${esc(k.name)} למטה">${ico("down")}</button>
    <button class="icon-btn sm danger" type="button" data-del="${esc(k.id)}" aria-label="מחיקת ${esc(k.name)}">${ico("trash")}</button>
  </li>`).join("")}</ol>` : `<p class="pick-hint">עוד אין ילדים ברשימה.</p>`}
<div class="kid-add">
  <label class="sr-only" for="newKid">שם ילד חדש</label>
  <input id="newKid" type="text" maxlength="30" autocomplete="off" placeholder="שם הילד או הילדה">
  <button class="btn btn-sm" type="button" data-addkid>${ico("plus")}הוסף ילד</button>
</div>
<div role="status" aria-live="polite" class="sr-only" id="kidsLive"></div>`;
      const f = focusSel && $(focusSel, ui.modal);
      if (f) f.focus();
    }
    const say = (t) => { const l = $("#kidsLive", ui.modal); if (l) l.textContent = t; };
    const add = () => {
      const inp = $("#newKid", ui.modal); const k = Week.addKid(inp.value);
      if (!k) return inp.focus();
      draw("#newKid"); say(`${k.name} נוסף`);
    };
    const rename = (inp) => {
      const id = inp.dataset.rename; const old = (Week.kid(id) || {}).name;
      if (!inp.value.trim()) { inp.value = old; return; }
      if (inp.value.trim() !== old && Week.renameKid(id, inp.value)) say(`השם עודכן ל${inp.value.trim()}`);
    };
    ui.modal.addEventListener("change", (e) => { if (e.target.matches("[data-rename]")) rename(e.target); });
    ui.modal.addEventListener("keydown", (e) => {
      if (e.key !== "Enter") return;
      if (e.target.id === "newKid") { e.preventDefault(); add(); }
      else if (e.target.matches("[data-rename]")) { e.preventDefault(); rename(e.target); }
    });
    ui.modal.addEventListener("click", (e) => {
      if (e.target.closest("[data-addkid]")) return add();
      const mv = e.target.closest("[data-move]");
      if (mv) {
        const [id, dir] = mv.dataset.move.split("|");
        Week.moveKid(id, Number(dir));
        draw(`[data-move="${id}|${dir}"]:not([disabled]), [data-rename="${id}"]`);
        say("הסדר עודכן");
        return;
      }
      const del = e.target.closest("[data-del]");
      if (del) {
        const k = Week.kid(del.dataset.del); if (!k) return;
        const n = Week.kidMealCount(k.id);
        const q = n
          ? `למחוק את ${k.name}?\nגם ${n} המנות ששובצו ל${k.name} יוסרו מהטבלה.`
          : `למחוק את ${k.name}?`;
        if (!confirm(q)) return;
        Week.removeKid(k.id);
        draw("#newKid"); say(`${k.name} נמחק`); toast(`${k.name} הוסר מהטבלה`);
      }
    });
    draw();
    ($("[data-rename]", ui.modal) || $("#newKid", ui.modal)).focus();
  }

  /* ============================================================
     רשימת מצרכים — מאחדים רק מה שבאמת זהה
     שם מוצר זהה + אותה יחידה ⇒ מחברים. בלי המרות בין יחידות.
     מה שאי אפשר לחשב ("לפי הטעם", "8–10 יחידות") נשאר כטקסט.
     ============================================================ */
  const FRAC_WORDS = [["שלושת רבעי", 0.75], ["חצי", 0.5], ["שליש", 1 / 3], ["רבע", 0.25]];
  /* יחיד/רבים של אותה יחידה — זו לא המרה, זו אותה יחידה */
  const UNIT_ONE = { "כוסות": "כוס", "כפות": "כף", "כפיות": "כפית", "פרוסות": "פרוסה", "עלים": "עלה", "ביצים": "ביצה", "שיניים": "שן" };
  const UNIT_MANY = { "כוס": "כוסות", "כף": "כפות", "כפית": "כפיות", "פרוסה": "פרוסות", "עלה": "עלים", "ביצה": "ביצים", "שן": "שיניים" };
  function parseQty(raw) {
    let s = String(raw || "").trim();
    if (!s || /[–\-\/()]|וחצי/.test(s)) return null;
    s = s.split(",")[0].trim();
    let n = null, rest = "";
    const mm = s.match(/^(\d+(?:\.\d+)?)\s*(.*)$/);
    if (mm) { n = Number(mm[1]); rest = mm[2]; }
    else {
      for (const [w, v] of FRAC_WORDS) if (s === w || s.startsWith(w + " ")) { n = v; rest = s.slice(w.length).trim(); break; }
      if (n == null && /^(כוס|כף|כפית)$/.test(s)) { n = 1; rest = s; }
    }
    if (n == null || !isFinite(n)) return null;
    /* מנרמלים יחיד/רבים רק כשהיחידה היא מילה אחת ("2 ביצים קשות" נשאר כמו שהוא) */
    const words = rest.split(/\s+/).filter(Boolean);
    const unit = words.length === 1 ? UNIT_ONE[words[0]] || words[0] : words.join(" ");
    return { n, unit };
  }
  function fmtNum(n) {
    const w = Math.floor(n + 1e-9), f = n - w;
    const fr = [[0.5, "½"], [0.25, "¼"], [0.75, "¾"], [1 / 3, "⅓"], [2 / 3, "⅔"]].find(([v]) => Math.abs(f - v) < 0.01);
    if (Math.abs(f) < 0.01) return String(w);
    if (fr) return (w ? w : "") + fr[1];
    return String(Math.round(n * 100) / 100);
  }
  const fmtQty = (n, unit) => {
    const u = n > 1 && UNIT_MANY[unit] ? UNIT_MANY[unit] : unit;
    return u ? `${fmtNum(n)} ${u}` : fmtNum(n);
  };
  function groceries() {
    const p = Week.read();
    const uses = {}; /* mealId → כמה פעמים שובצה, בכל הילדים ובכל הימים */
    p.kids.forEach((k) => {
      const kp = p.plan[k.id] || {};
      Object.keys(kp).forEach((d) => Object.values(kp[d]).forEach((id) => { uses[id] = (uses[id] || 0) + 1; }));
    });
    const items = new Map();
    Object.keys(uses).forEach((id) => {
      const m = mealById(id); if (!m) return;
      const times = uses[id];
      (m.prep || []).forEach((pr) => {
        const name = String(pr.name || "").trim(); if (!name) return;
        if (!items.has(name)) items.set(name, { name, sums: new Map(), texts: new Map(), meals: new Set() });
        const it = items.get(name);
        it.meals.add(m.name);
        const q = parseQty(pr.qty);
        if (q) it.sums.set(q.unit, (it.sums.get(q.unit) || 0) + q.n * times);
        else if (pr.qty) it.texts.set(pr.qty, (it.texts.get(pr.qty) || 0) + times);
      });
    });
    return [...items.values()]
      .map((it) => ({
        key: it.name,
        name: it.name,
        qty: [
          ...[...it.sums].map(([u, n]) => fmtQty(n, u)),
          ...[...it.texts].map(([t, c]) => (c > 1 ? `${t} (×${c})` : t)),
        ].join(" + "),
        meals: [...it.meals],
      }))
      .sort((a, b) => a.name.localeCompare(b.name, "he"));
  }

  /* ---------- חיווט גלובלי: לב + הוספה לשבוע ---------- */
  function initCards() {
    document.addEventListener("click", (e) => {
      const fav = e.target.closest("[data-fav]");
      if (fav) {
        const on = Favs.toggle(fav.dataset.fav);
        fav.setAttribute("aria-pressed", String(on));
        const nm = (mealById(fav.dataset.fav) || {}).name || "";
        fav.setAttribute("aria-label", `${on ? "הסרה מהמועדפים" : "הוספה למועדפים"}: ${nm}`);
        toast(on ? "נוסף למועדפים" : "הוסר מהמועדפים");
        return;
      }
      const add = e.target.closest("[data-add]");
      if (add) openAddToTable(add.dataset.add);
    });
    /* עדכון מוני הסרגל התחתון */
    const refresh = () => {
      const bar = $(".tabbar");
      if (!bar) return;
      bar.outerHTML = tabbar(document.body.dataset.tab || "");
    };
    document.addEventListener("kupsa:favs", refresh);
    document.addEventListener("kupsa:week", refresh);
  }

  /* ============================================================
     עמוד ראשי
     ============================================================ */
  function renderHome() {
    /* צ'יפים לפי ההדמיה: סוג ארוחה (אחד) + מסננים (כמה יחד) */
    const CAT_CHIPS = { breakfast: ["בוקר", "sun"], lunch: ["צהריים", "sun"], friday: ["שישי", "moon"] };
    const FILTERS = [
      { id: "quick", label: "עד 10 דקות", icon: "clock", test: (m) => Number(m.prepTime) <= 10 },
      { id: "nocook", label: "בלי בישול", icon: "nocook", test: (m) => (m.tags || []).some((t) => t === "בלי בישול" || t === "בלי אפייה") },
      { id: "ahead", label: "להכנה בערב", icon: "moon", test: (m) => (m.tags || []).includes("מכינים מראש") },
    ];
    const st = { cat: "breakfast", f: new Set(), q: "" };

    document.body.insertAdjacentHTML("afterbegin", header("home"));
    $("#app").innerHTML = `
<section class="hero3">
  <div class="hero3-in">
    <picture class="hero3-img" aria-hidden="true">
      <source media="(max-width:760px)" srcset="${esc(IMG.heroDir)}hero-home-sm.jpg">
      <img src="${esc(IMG.heroDir)}hero-home.jpg" alt="" width="1920" height="832" fetchpriority="high">
    </picture>
    <div class="hero3-card rise">
      <h1><span class="l1">מה שמים היום</span> <em>בקופסה?<span class="spark" aria-hidden="true"></span></em></h1>
      <p>רעיונות טעימים לבוקר פשוט יותר</p>
      <a class="btn btn-xl" href="#ideas">בוחרים ארוחה${ico("arrow-l")}</a>
    </div>
  </div>
</section>

<section class="finder" aria-label="חיפוש וסינון מנות">
  <div class="finder-in rise">
    <label class="bigsearch-in">
      <span class="sr-only">חיפוש מנה</span>
      ${ico("search")}
      <input type="search" id="homeQ" placeholder="מה מכינים היום?" autocomplete="off">
    </label>
    <div class="finder-chips">
      <div class="chipgrp" role="group" aria-label="סוג ארוחה">
        ${Object.entries(CAT_CHIPS).map(([id, [label, icon]]) =>
          `<button type="button" class="fchip" data-cat="${id}" aria-pressed="${id === st.cat}">${ico(icon)}${label}</button>`).join("")}
      </div>
      <div class="chipgrp" role="group" aria-label="סינון">
        ${FILTERS.map((f) => `<button type="button" class="fchip" data-f="${f.id}" aria-pressed="false">${ico(f.icon)}${f.label}</button>`).join("")}
      </div>
    </div>
  </div>
</section>

<section class="sec ideas" id="ideas" aria-labelledby="ideasT" tabindex="-1">
  <div class="wrap">
    <div class="ideas-head">
      <h2 id="ideasT"></h2>
      <a class="btn btn-out btn-sm" id="ideasAll" href="#"></a>
    </div>
    <p class="sr-only" id="ideasLive" role="status" aria-live="polite"></p>
    <div class="meals" id="homeResults"></div>
  </div>
</section>

<section class="sec" style="padding-top:0">
  <div class="wrap">
    <div class="weekcta2 rise">
      <div class="wk-txt">
        <h2>השבוע כבר מסודר<span class="spark" aria-hidden="true"></span></h2>
        <p>שומרים את המתכונים שאוהבים ומתכננים את השבוע בקלות</p>
      </div>
      <a class="btn wk-btn" href="planner.html">${ico("calendar")}לתכנון השבוע</a>
      <div class="wk-note" aria-hidden="true">
        <div class="wk-paper">
          <div class="wk-grid">${["א", "ב", "ג", "ד", "ה"].map((d) => `<b>${d}׳</b>`).join("")}${Array.from({ length: 10 }, (_, i) => `<i>${i === 1 ? ico("box") : ""}</i>`).join("")}</div>
        </div>
      </div>
    </div>
  </div>
</section>

<section class="sec" style="padding-top:0">
  <div class="wrap">
    <div class="suggest-cta rise">
      <span class="sg-ico" aria-hidden="true">${ico("bulb")}</span>
      <div><h2>יש לכם מתכון מנצח?</h2><p>מתכון שהילדים אוהבים ומתאים לכללי בית הספר — הציעו אותו לאתר.</p></div>
      <a class="btn" href="suggest.html">הציעו מתכון${ico("arrow-l")}</a>
    </div>
  </div>
</section>`;

    const catName = (id) => ({ breakfast: "לבוקר", lunch: "לצהריים", friday: "לשישי" }[id]);
    function draw() {
      const q = st.q.trim().toLowerCase();
      let list;
      if (q) {
        list = MEALS.filter((m) => [m.name, m.short, (m.tags || []).join(" "), (m.prep || []).map((p) => p.name).join(" ")]
          .join(" ").toLowerCase().includes(q));
      } else list = MEALS.filter((m) => m.cat === st.cat);
      FILTERS.forEach((f) => { if (st.f.has(f.id)) list = list.filter(f.test); });
      const c = catById(st.cat) || {};
      $("#ideasT").innerHTML = q ? `${list.length} תוצאות ל״${esc(st.q.trim())}״` : `רעיונות ${catName(st.cat)}<span class="spark" aria-hidden="true"></span>`;
      const all = $("#ideasAll");
      all.href = `category.html?cat=${st.cat}`; all.textContent = `לכל ה${c.name || "מנות"}`; all.hidden = !!q;
      $("#homeResults").innerHTML = list.length
        ? list.slice(0, 8).map((m) => mealCard(m)).join("")
        : `<div class="empty">לא נמצאו מנות שמתאימות לבחירה. <button type="button" class="btn btn-out btn-sm" id="clearF">ניקוי הסינון</button></div>`;
      $("#ideasLive").textContent = `${list.length} מנות מוצגות`;
      initRise();
    }

    $(".finder").addEventListener("click", (e) => {
      const c = e.target.closest("[data-cat]"), f = e.target.closest("[data-f]");
      if (c) {
        st.cat = c.dataset.cat;
        $$("[data-cat]").forEach((b) => b.setAttribute("aria-pressed", String(b === c)));
      } else if (f) {
        const on = !st.f.has(f.dataset.f);
        if (on) st.f.add(f.dataset.f); else st.f.delete(f.dataset.f);
        f.setAttribute("aria-pressed", String(on));
      } else return;
      draw();
    });
    $("#homeQ").addEventListener("input", (e) => { st.q = e.target.value; draw(); });
    $("#ideas").addEventListener("click", (e) => {
      if (!e.target.closest("#clearF")) return;
      st.f.clear(); st.q = ""; $("#homeQ").value = "";
      $$("[data-f]").forEach((b) => b.setAttribute("aria-pressed", "false"));
      draw();
    });

    draw();
    document.body.insertAdjacentHTML("beforeend", footer());
    document.body.insertAdjacentHTML("beforeend", tabbar("home"));
    initRise();
  }

  /* ============================================================
     עמוד קטגוריה
     ============================================================ */
  function renderCategory() {
    const cid = qp("cat") || "breakfast";
    const c = catById(cid);
    if (!c) {
      document.body.insertAdjacentHTML("afterbegin", header());
      $("#app").innerHTML = `<div class="wrap sec"><div class="empty">קטגוריה לא נמצאה.</div></div>`;
      return;
    }
    document.title = `${c.name} · ${CFG.siteName}`;
    document.body.insertAdjacentHTML("afterbegin", header(cid));

    const all = MEALS.filter((m) => m.cat === cid);
    const state = { q: "", type: "all", diff: "all", sort: "default" };

    $("#app").innerHTML = `
<section class="crumb-hero" style="--crumb-img:url('${esc(absUrl(heroImg("head-" + cid)))}')">
  <div class="wrap">
    <h1>${esc(c.name)}</h1>
    <div class="crumb-nav"><a href="index.html">ראשי</a>${ico("arrow-l")}<span class="cur">${esc(c.name)}</span></div>
  </div>
</section>

<section class="sec">
  <div class="wrap">
    <div class="title-area"><p style="font-size:18px">${esc(c.desc)}</p></div>
    <div class="toolbar">
      <label class="search">${ico("search")}<input type="search" id="q" placeholder="חיפוש מנה, מרכיב או תגית…" aria-label="חיפוש"></label>
      <div class="seg" id="typeSeg">
        <button data-v="all" aria-pressed="true">הכול</button>
        <button data-v="sandwich" aria-pressed="false">${esc(c.sandwichLabel)}</button>
        <button data-v="other" aria-pressed="false">${esc(c.otherLabel)}</button>
      </div>
      <select class="sel" id="diff" aria-label="רמת קושי">
        <option value="all">כל רמות הקושי</option>
        ${(CFG.difficulties || []).map((d) => `<option value="${d.level}">${esc(d.name)}</option>`).join("")}
      </select>
      <select class="sel" id="sort" aria-label="מיון">
        <option value="default">מיון מומלץ</option>
        <option value="time">הכי מהיר</option>
        <option value="easy">הכי קל</option>
        <option value="protein">הכי הרבה חלבון</option>
        <option value="sugar">הכי מעט סוכר</option>
        <option value="name">לפי שם</option>
      </select>
    </div>
    <p id="resCount" class="sr" role="status" aria-live="polite"></p>
    <div id="results"></div>
  </div>
</section>`;

    function grp(t, n) {
      return `<div class="grp-head rise"><h2>${esc(t)}</h2><span>${n}</span><span class="ln"></span></div>`;
    }

    function draw() {
      let list = all.slice();
      if (state.type !== "all") list = list.filter((m) => m.type === state.type);
      if (state.diff !== "all") list = list.filter((m) => m.difficulty === Number(state.diff));
      if (state.q.trim()) {
        const q = state.q.trim().toLowerCase();
        list = list.filter((m) =>
          [m.name, m.short, (m.tags || []).join(" "), (m.prep || []).map((p) => p.name).join(" ")]
            .join(" ").toLowerCase().includes(q)
        );
      }
      const nv = (m, k) => (NUTRI[m.id] ? NUTRI[m.id][k] : 0);
      if (state.sort === "time") list.sort((a, b) => a.prepTime - b.prepTime);
      else if (state.sort === "easy") list.sort((a, b) => a.difficulty - b.difficulty);
      else if (state.sort === "protein") list.sort((a, b) => nv(b, "protein") - nv(a, "protein"));
      else if (state.sort === "sugar") list.sort((a, b) => nv(a, "sugar") - nv(b, "sugar"));
      else if (state.sort === "name") list.sort((a, b) => a.name.localeCompare(b.name, "he"));

      const out = $("#results");
      const live = $("#resCount");
      if (live) live.textContent = list.length ? `נמצאו ${list.length} מנות` : "לא נמצאו מנות שמתאימות לסינון";
      if (!list.length) { out.innerHTML = `<div class="empty">לא נמצאו מנות שמתאימות לסינון.</div>`; return; }

      const plain = state.type === "all" && state.sort === "default" && !state.q.trim() && state.diff === "all";
      if (plain) {
        const s = list.filter((m) => m.type === "sandwich");
        const o = list.filter((m) => m.type === "other");
        out.innerHTML =
          (s.length ? grp(c.sandwichLabel, s.length) + `<div class="meals">${s.map(mealCard).join("")}</div>` : "") +
          (o.length ? `<div style="height:56px"></div>` + grp(c.otherLabel, o.length) + `<div class="meals">${o.map(mealCard).join("")}</div>` : "");
      } else {
        out.innerHTML = `<div class="meals">${list.map(mealCard).join("")}</div>`;
      }
      initRise();
    }

    $("#q").addEventListener("input", (e) => { state.q = e.target.value; draw(); });
    $("#typeSeg").addEventListener("click", (e) => {
      const b = e.target.closest("button"); if (!b) return;
      $$("#typeSeg button").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
      state.type = b.dataset.v; draw();
    });
    $("#diff").addEventListener("change", (e) => { state.diff = e.target.value; draw(); });
    $("#sort").addEventListener("change", (e) => { state.sort = e.target.value; draw(); });

    draw();
    document.body.insertAdjacentHTML("beforeend", footer());
    document.body.insertAdjacentHTML("beforeend", tabbar(""));
    initRise();
  }

  /* ============================================================
     ערכים תזונתיים
     ============================================================ */
  function nutritionCard(m) {
    const n = NUTRI[m.id];
    const refs = CFG.nutritionRef || [];
    if (!n || !refs.length) return "";

    const rows = refs
      .map((r) => {
        const v = Number(n[r.key] || 0);
        const pct = Math.round((v / r.daily) * 100);
        const w = Math.min(pct, 100);
        let tone;
        if (r.key === "sugar") tone = pct <= 20 ? "n-good" : pct <= 60 ? "n-mid" : "n-high";
        else if (r.goodHigh) tone = pct >= 25 ? "n-good" : pct >= 12 ? "n-mid" : "";
        else tone = "";
        const word = r.key === "sugar"
          ? (pct <= 20 ? "כמות סבירה" : pct <= 60 ? "לא מעט — שים לב" : "גבוה, שמור ליום שישי")
          : r.key === "protein"
          ? (pct >= 25 ? "מנה טובה של חלבון" : pct >= 12 ? "תרומה בינונית" : "מעט חלבון")
          : "מהצריכה היומית";
        return `
<div class="nrow ${tone}">
  <div class="nrow-top">
    <span class="nm">${esc(r.name)}</span>
    <span class="val">${v}</span><span class="un">${esc(r.unit)}</span>
  </div>
  <div class="nbar"><i style="width:${w}%"></i></div>
  <div class="nfoot">
    <span class="npct">${pct}%</span>
    <span>מתוך ${r.daily} ${esc(r.unit)} ליום · ${esc(word)}</span>
  </div>
  <div class="nbasis">${esc(r.basis)}</div>
</div>`;
      })
      .join("");

    return `
<div class="card">
  <h2>${ico("chart")}ערכים תזונתיים</h2>
  <div class="nserve">${ico("box")}<span>המספרים הם ל<b>${esc(n.serving || "מנה אחת")}</b></span></div>
  <div class="nutri">${rows}</div>
  <div class="alert alert-info" style="margin-top:16px">${ico("bulb")}<div>${esc(CFG.nutritionNote || "")}</div></div>
</div>`;
  }

  /* ============================================================
     עמוד מנה
     ============================================================ */
  function renderMeal() {
    const m = mealById(qp("id"));
    if (!m) {
      document.body.insertAdjacentHTML("afterbegin", header());
      $("#app").innerHTML = `<div class="wrap sec"><div class="empty">המנה לא נמצאה. <a href="index.html">חזרה לעמוד הראשי</a></div></div>`;
      return;
    }
    const c = catById(m.cat) || {};
    const d = diffByLevel(m.difficulty);
    document.title = `${m.name} · ${CFG.siteName}`;
    document.body.insertAdjacentHTML("afterbegin", header(m.cat));

    const prepHtml = (m.prep || [])
      .map((p, i) => `
<li data-done="0">
  <button class="shop-cb" role="checkbox" aria-checked="false" data-i="${i}" aria-label="סמן כנקנה">${ico("check")}</button>
  <span class="shop-txt">
    <b>${esc(p.name)}</b> <span class="q">— ${esc(p.qty || "")}</span>
    ${p.note ? `<span class="note">${esc(p.note)}</span>` : ""}
    ${p.warn ? `<span class="flag">${ico("alert")}<span>${esc(p.warn)}</span></span>` : ""}
  </span>
</li>`).join("");

    const scale = (CFG.difficulties || [])
      .map((x) => `<span class="dstep${x.level <= m.difficulty ? " on" : ""}"></span>`).join("");

    const figPh = `<div class="ph">${ico(m.icon)}<span>${esc(mealImg(m.id))}</span></div>`;
    const figAlt = `${m.name} — ${m.short}`;

    $("#app").innerHTML = `
<section class="crumb-hero compact" style="--crumb-img:url('${esc(absUrl(heroImg("head-" + m.cat)))}')">
  <div class="wrap">
    <div class="crumb-nav">
      <a href="index.html">ראשי</a>${ico("arrow-l")}
      <a href="category.html?cat=${encodeURIComponent(m.cat)}">${esc(c.name || "")}</a>${ico("arrow-l")}
      <span class="cur">${esc(m.name)}</span>
    </div>
  </div>
</section>

<div class="wrap">
  <div class="meal-top">
    <div class="meal-figure rise">${img(mealImg(m.id), figPh, "", figAlt)}</div>
    <div class="rise">
      <div class="sub-title">${esc(c.name || "")}</div>
      <h1>${esc(m.name)}</h1>
      <p class="lede">${esc(m.short)}</p>
      <div class="tag-row">${(m.tags || []).map((t) => `<span class="tag">${esc(t)}</span>`).join("")}</div>
      <div class="stats">
        <div class="stat">${ico("clock")}<span><b>${esc(m.prepTime)} דקות</b><span>זמן הכנה</span></span></div>
        <div class="stat">${ico("gauge")}<span><b>${esc(d.name)}</b><span>רמת קושי</span></span></div>
        <div class="stat">${ico("box")}<span><b>${esc(m.kosher)}</b><span>כשרות</span></span></div>
      </div>
      <div class="btn-row">
        <button class="btn" type="button" data-add="${esc(m.id)}">${ico("calendar")}הוסף לטבלה</button>
        <button class="btn btn-out" id="copyList">${ico("list")}העתקת רשימת קניות</button>
        <button class="btn btn-out" onclick="window.print()">${ico("print")}הדפסה</button>
      </div>
    </div>
  </div>

  <div class="grid2">
    <div>
      <div class="card">
        <h2>${ico("cart")}מוצרים להכין מראש</h2>
        <ul class="shop">${prepHtml}</ul>
        <div class="btn-row" style="margin-top:22px"><button class="btn btn-out btn-sm" id="clearList">נקה סימונים</button></div>
      </div>
      <div class="card">
        <h2>${ico("steps")}שלבי ההכנה</h2>
        <ol class="steps">${(m.steps || []).map((s) => `<li>${esc(s)}</li>`).join("")}</ol>
      </div>
      ${(m.tips || []).length ? `<div class="card"><h2>${ico("bulb")}טיפים</h2><ul class="tips">${m.tips.map((t) => `<li>${esc(t)}</li>`).join("")}</ul></div>` : ""}
    </div>

    <div>
      ${nutritionCard(m)}

      <div class="card">
        <h2>${ico("alert")}אלרגנים — מה לבדוק</h2>
        <div class="alert alert-danger">${ico("alert")}<div><b>אסור בבית הספר</b>${activeAllergens().map((a) => esc(a.name)).join(" · ")}</div></div>
        ${(m.allergen || []).map((t) => {
          const cls = t.startsWith("❌") ? "alert-danger" : t.startsWith("⚠️") ? "alert-warn" : "alert-info";
          return `<div class="alert ${cls}">${ico("alert")}<div>${esc(t)}</div></div>`;
        }).join("")}
        <div class="alert alert-info">${ico("bulb")}<div>${esc(CFG.disclaimer || "")}</div></div>
      </div>

      <div class="card">
        <h2>${ico("gauge")}רמת קושי</h2>
        <div class="dscale d${m.difficulty}">${scale}</div>
        <p class="dlabel"><b>${esc(d.name)}</b> — ${esc(d.desc)}</p>
        ${m.makeAhead ? `<div class="alert alert-info" style="margin-top:14px">${ico("clock")}<div><b>הכנה מראש</b>${esc(m.makeAhead)}</div></div>` : ""}
      </div>

      <div class="card">
        <h2>${ico("search")}בדיקת מוצר בסופר</h2>
        <p style="font-size:14.5px">חפש מוצר לפי שם או ברקוד. הנתונים מגיעים מ-Open Food Facts — מאגר פתוח שמכיל רשימות רכיבים. התוצאות נסרקות אוטומטית מול האלרגנים האסורים.</p>
        <label class="search">${ico("search")}<input type="search" id="offQ" placeholder="לדוגמה: לחם אחיד, ממרח שוקולד…" aria-label="חיפוש מוצר"></label>
        <div class="btn-row" style="margin-top:14px"><button class="btn btn-sm" id="offGo">חפש</button></div>
        <div id="offOut" style="margin-top:18px"></div>
      </div>
    </div>
  </div>
</div>

<section class="sec sec-cream">
  <div class="wrap">
    ${titleArea("עוד רעיונות", "מנות דומות ב" + (c.name || ""), "")}
    <div class="meals">
      ${MEALS.filter((x) => x.cat === m.cat && x.type === m.type && x.id !== m.id).slice(0, 4).map(mealCard).join("")}
    </div>
  </div>
</section>`;

    /* רשימת קניות */
    const KEY = "kupsa-list-" + m.id;
    let done = {};
    try { done = JSON.parse(localStorage.getItem(KEY) || "{}"); } catch (e) { done = {}; }
    function paint() {
      $$(".shop li").forEach((li, i) => {
        const on = !!done[i];
        li.dataset.done = on ? "1" : "0";
        const b = $(".shop-cb", li);
        if (b) b.setAttribute("aria-checked", String(on));
      });
    }
    paint();
    $(".shop").addEventListener("click", (e) => {
      const b = e.target.closest(".shop-cb"); if (!b) return;
      done[b.dataset.i] = !done[b.dataset.i];
      try { localStorage.setItem(KEY, JSON.stringify(done)); } catch (e) {}
      paint();
    });
    $("#clearList").addEventListener("click", () => {
      done = {};
      try { localStorage.removeItem(KEY); } catch (e) {}
      paint();
    });
    $("#copyList").addEventListener("click", async () => {
      const n = NUTRI[m.id];
      const txt = `רשימת קניות — ${m.name}\n\n` +
        (m.prep || []).map((p) => `• ${p.name} — ${p.qty || ""}`).join("\n") +
        (n ? `\n\nלמנה: ${n.kcal} קק״ל · ${n.protein} גר׳ חלבון · ${n.sugar} גר׳ סוכר` : "") +
        `\n\nאסור בבית הספר: ${activeAllergens().map((a) => a.name).join(", ")}`;
      try { await navigator.clipboard.writeText(txt); toast("הרשימה הועתקה"); }
      catch (e) { toast("לא ניתן להעתיק בדפדפן הזה"); }
    });

    /* Open Food Facts */
    async function offSearch() {
      const q = $("#offQ").value.trim(); if (!q) return;
      const out = $("#offOut");
      out.innerHTML = `<div class="alert alert-info">${ico("clock")}<div>מחפש…</div></div>`;
      const api = (CFG.api && CFG.api.openFoodFacts) || {};
      if (!api.enabled) { out.innerHTML = `<div class="alert alert-info">${ico("bulb")}<div>חיפוש המוצרים מכובה בהגדרות.</div></div>`; return; }
      try {
        const isBarcode = /^\d{8,14}$/.test(q);
        const url = isBarcode ? api.byBarcode.replace("{barcode}", encodeURIComponent(q)) : api.search.replace("{q}", encodeURIComponent(q));
        const r = await fetch(url);
        if (!r.ok) throw new Error("HTTP " + r.status);
        const j = await r.json();
        const items = isBarcode ? (j.product ? [j.product] : []) : j.products || [];
        if (!items.length) { out.innerHTML = `<div class="alert alert-info">${ico("bulb")}<div>לא נמצאו תוצאות. נסה שם אחר או ברקוד.</div></div>`; return; }
        out.innerHTML = `<div class="prods">` + items.slice(0, 8).map((p) => {
          const name = p.product_name_he || p.product_name || "ללא שם";
          const ing = p.ingredients_text_he || p.ingredients_text || "";
          const tags = ((p.allergens_tags || []).concat(p.traces_tags || [])).join(" ");
          const hits = scanText(name + " " + ing + " " + tags);
          const known = !!ing || (p.allergens_tags || []).length;
          const badge = hits.length
            ? `<span class="badge badge-no">מכיל ${hits.map((h) => esc(h.name)).join(", ")}</span>`
            : known ? `<span class="badge badge-ok">לא נמצא אלרגן</span>` : `<span class="badge badge-warn">אין נתוני רכיבים</span>`;
          return `<div class="prod"><div class="prod-b"><b>${esc(name)}</b><span>${esc(p.brands || "")}${ing ? " · " + esc(ing.slice(0, 90)) + "…" : " · אין רשימת רכיבים במאגר"}</span></div>${badge}</div>`;
        }).join("") + `</div>
<div class="alert alert-warn" style="margin-top:14px">${ico("alert")}<div>המאגר פתוח ומבוסס תרומות משתמשים. הכיסוי של מוצרים ישראליים חלקי. <b style="display:inline">תמיד קרא את התווית על האריזה.</b></div></div>`;
      } catch (err) {
        out.innerHTML = `<div class="alert alert-warn">${ico("alert")}<div>החיפוש נכשל (${esc(err.message)}). ייתכן שאין חיבור, או שהאתר נפתח כקובץ מקומי במקום דרך שרת.</div></div>`;
      }
    }
    $("#offGo").addEventListener("click", offSearch);
    $("#offQ").addEventListener("keydown", (e) => { if (e.key === "Enter") offSearch(); });

    document.body.insertAdjacentHTML("beforeend", footer());
    document.body.insertAdjacentHTML("beforeend", tabbar(""));
    initRise();
  }


  /* ============================================================
     מועדפים
     ============================================================ */
  function renderFavorites() {
    document.title = `מועדפים · ${CFG.siteName}`;
    document.body.dataset.tab = "favorites";
    document.body.insertAdjacentHTML("afterbegin", header("favorites"));

    function draw() {
      const ids = Favs.all();
      const list = ids.map(mealById).filter(Boolean);
      $("#favBody").innerHTML = list.length
        ? `<div class="meals">${list.map((m) => mealCard(m)).join("")}</div>`
        : `<div class="empty">
             <p style="font-size:17px;margin-bottom:6px">עוד לא סימנת מנות אהובות.</p>
             <p>לחיצה על הלב בפינת כל מנה תשמור אותה כאן.</p>
             <div class="btn-row" style="justify-content:center;margin-top:18px">
               <a class="btn" href="index.html">לעיון במנות</a>
             </div>
           </div>`;
      initRise();
    }

    $("#app").innerHTML = `
<section class="crumb-hero compact">
  <div class="wrap"><div class="crumb-nav"><a href="index.html">ראשי</a><span class="cur">מועדפים</span></div></div>
</section>
<section class="sec" style="padding-top:34px">
  <div class="wrap">
    ${titleArea("שמור בצד", "המנות האהובות עליך", "נשמר בדפדפן שלך בלבד.", 1)}
    <div id="favBody"></div>
  </div>
</section>`;
    draw();
    document.addEventListener("kupsa:favs", draw);
    document.body.insertAdjacentHTML("beforeend", footer());
    document.body.insertAdjacentHTML("beforeend", tabbar("favorites"));
    initRise();
  }

  /* ============================================================
     השבוע שלי — טבלה: ימים בעמודות, ילדים בשורות
     ============================================================ */
  const SLOT_ORDER = ["breakfast", "lunch", "friday"];
  function kidsPhrase(kids) {
    if (kids.length === 1) return `מצרכים ל${kids[0].name}`;
    if (kids.length === 2) return "מצרכים לשני הילדים";
    return `מצרכים ל-${kids.length} הילדים`;
  }

  function allergyBand(forPrint) {
    const list = activeAllergens();
    return `
<section class="${forPrint ? "pv-allergy" : "allergy-band"}" aria-labelledby="${forPrint ? "pvAbT" : "abT"}">
  <h2 id="${forPrint ? "pvAbT" : "abT"}">${forPrint ? "" : `<span class="ab-ex" aria-hidden="true">!</span>`}אסור בבית הספר</h2>
  <ul class="ab-list">${list.map((a) => `<li>${esc(a.name)}</li>`).join("")}</ul>
  <p class="ab-note">בדקו תמיד את תווית המוצר.</p>
</section>`;
  }

  /* תצוגת ההדפסה: טקסט וטבלה אמיתיים, שחור על לבן. בלי סמלים ובלי כפתורים. */
  function printSheet() {
    const p = Week.read();
    const wk = (p.week || "").trim();
    const g = groceries();
    const rows = p.kids.map((k) => `
<tr>
  <th scope="row">${esc(k.name)}</th>
  ${DAYS.map((d) => {
    const c = ((p.plan[k.id] || {})[d.id]) || {};
    const ms = SLOT_ORDER.filter((s) => c[s] && mealById(c[s]));
    return `<td>${ms.map((s) => `<div class="pv-m"><span>${esc(SLOTS[s])}:</span> <b>${esc(mealById(c[s]).name)}</b></div>`).join("")}</td>`;
  }).join("")}
</tr>`).join("");
    return `
<header class="pv-head">
  <h1 id="pvT">השבוע שלנו</h1>
  <p class="pv-site">${esc(CFG.siteName || "הקופסה")} · מתכננים יחד שבוע טעים</p>
  ${wk ? `<p class="pv-week">שבוע: <b>${esc(wk)}</b></p>` : ""}
</header>
${p.kids.length ? `
<table class="pv-table">
  <caption class="sr-only">תכנון הארוחות לפי ילד ויום</caption>
  <thead><tr><th scope="col">הילדים</th>${DAYS.map((d) => `<th scope="col">${esc(d.short)} ${esc(d.name)}</th>`).join("")}</tr></thead>
  <tbody>${rows}</tbody>
</table>` : `<p>עוד לא הוגדרו ילדים בטבלה.</p>`}
<section class="pv-groc" aria-labelledby="pvGT">
  <h2 id="pvGT">מה צריך שיהיה בבית?</h2>
  ${g.length ? `
  <p class="pv-sub">${esc(kidsPhrase(p.kids))}, לכל הימים</p>
  <ul>${g.map((it) => `<li><span class="pv-box${p.have[it.key] ? " on" : ""}" aria-hidden="true"></span>${esc(it.name)}${it.qty ? ` — ${esc(it.qty)}` : ""}${p.have[it.key] ? " (יש בבית)" : ""}</li>`).join("")}</ul>`
  : `<p class="pv-sub">עוד לא נבחרו מנות.</p>`}
</section>
${allergyBand(true)}`;
  }

  function renderPlanner() {
    document.title = `השבוע שלי · ${CFG.siteName}`;
    document.body.dataset.tab = "planner";
    document.body.insertAdjacentHTML("afterbegin", header("planner"));

    function cellHtml(k, d, c) {
      const ms = SLOT_ORDER.filter((s) => c[s] && mealById(c[s]));
      const names = ms.map((s) => `${SLOTS[s]}: ${mealById(c[s]).name}`).join(", ");
      return `
<td>
  <button class="pc${ms.length ? "" : " empty"}" type="button" data-cell="${esc(k.id)}|${d.id}"
          aria-label="${esc(k.name)}, יום ${esc(d.name)}: ${esc(names || "ריק")}. לחצו כדי ${ms.length ? "לשנות" : "לבחור מנה"}">
    ${ms.length ? ms.map((s) => {
      const m = mealById(c[s]);
      return `<span class="pm"><span class="pm-tag">${esc(SLOTS[s])}</span><b class="pm-name">${esc(m.name)}</b><span class="pm-ico">${ico(m.icon)}</span></span>`;
    }).join("") : `<span class="pc-add">${ico("plus")}<span>בחירה</span></span>`}
  </button>
</td>`;
    }

    function tableHtml(p) {
      return `
<div class="plan-scroll" tabindex="0" role="region" aria-label="טבלת השבוע — אפשר לגלול לצדדים">
  <table class="plan-table">
    <caption class="sr-only">הארוחות של כל ילד לפי ימים. לחיצה על תא פותחת בחירה, החלפה או הסרה.</caption>
    <thead><tr>
      <th scope="col" class="kid-h">הילדים</th>
      ${DAYS.map((d) => `<th scope="col"><abbr title="יום ${esc(d.name)}">${esc(d.short)}</abbr></th>`).join("")}
    </tr></thead>
    <tbody>
      ${p.kids.map((k) => `<tr><th scope="row" class="kid">${esc(k.name)}</th>${DAYS.map((d) => cellHtml(k, d, ((p.plan[k.id] || {})[d.id]) || {})).join("")}</tr>`).join("")}
    </tbody>
  </table>
</div>`;
    }

    function legacyHtml(p) {
      const w = Week.legacy();
      if (!w) return "";
      const n = Object.keys(w).reduce((a, d) => a + Object.keys(w[d] || {}).length, 0);
      return `
<div class="alert alert-warn legacy" role="region" aria-label="תכנון קודם">
  ${ico("calendar")}
  <div>
    <b>נמצא תכנון קודם (${n} ארוחות) שנשמר לפני שהיו ילדים בטבלה.</b>
    ${p.kids.length ? `
    <div class="legacy-row">
      <label for="legKid">לשייך אותו ל:</label>
      <select id="legKid">${p.kids.map((k) => `<option value="${esc(k.id)}">${esc(k.name)}</option>`).join("")}</select>
      <button class="btn btn-sm" type="button" id="legGo">שיוך</button>
      <button class="btn btn-out btn-sm" type="button" id="legDrop">לא צריך, למחוק</button>
    </div>` : `<span>מוסיפים ילד — ואז אפשר לשייך אליו את התכנון בלי לאבד אותו.</span>`}
  </div>
</div>`;
    }

    function grocHtml(p) {
      const g = groceries();
      if (!g.length) return `<p class="pick-hint">כשתשבצו מנות, יופיעו כאן כל המצרכים לכל הילדים ולכל הימים.</p>`;
      const left = g.filter((it) => !p.have[it.key]).length;
      return `
<p class="groc-meta"><span>${esc(kidsPhrase(p.kids))}, לכל הימים</span><span>סמנו מה כבר יש בבית · נשאר לקנות <b>${left}</b> מתוך ${g.length}</span></p>
<ul class="groc-list">
  ${g.map((it) => `
  <li><label class="gi${p.have[it.key] ? " have" : ""}">
    <input type="checkbox" data-have="${esc(it.key)}"${p.have[it.key] ? " checked" : ""}>
    <span class="gi-t"><b>${esc(it.name)}</b>${it.qty ? ` <span class="gi-q">${esc(it.qty)}</span>` : ""}
      <small>${esc(it.meals.join(" · "))}</small></span>
  </label></li>`).join("")}
</ul>
<p class="pick-hint">כמויות מחוברות רק כשהיחידה זהה. מנה ששובצה לשני ילדים — נספרת פעמיים. המתכונים כתובים לרוב למנה אחת או לתבנית שלמה, אז כדאי להציץ במתכון.</p>`;
    }

    function draw() {
      const p = Week.read();
      const n = Week.mealCount();
      $("#planCount").innerHTML = !p.kids.length ? "" : n ? `<span>${n}</span> ארוחות בטבלה` : "הטבלה עוד ריקה";
      $("#planLegacy").innerHTML = legacyHtml(p);
      $("#planTable").innerHTML = p.kids.length ? tableHtml(p) : `
<div class="plan-start">
  <span class="ps-ico" aria-hidden="true">${ico("users")}</span>
  <h2 id="startT">נתחיל בשמות הילדים</h2>
  <p>כל ילד יקבל שורה משלו בטבלה. אפשר להוסיף כמה שרוצים.</p>
  <div class="kid-add">
    <label class="sr-only" for="startKid">שם הילד או הילדה</label>
    <input id="startKid" type="text" maxlength="30" autocomplete="off" placeholder="שם הילד או הילדה">
    <button class="btn" type="button" id="startAdd">${ico("plus")}הוסף ילד</button>
  </div>
</div>`;
      $("#grocBody").innerHTML = grocHtml(p);
      $("#printView .pv-sheet").innerHTML = printSheet();
    }

    $("#app").innerHTML = `
<section class="crumb-hero compact">
  <div class="wrap"><div class="crumb-nav"><a href="index.html">ראשי</a><span class="cur">השבוע שלי</span></div></div>
</section>
<section class="sec plan-sec">
  <div class="wrap">
    <div class="plan-card plan-top">
    <div class="plan-head">
      <div class="plan-title">
        <h1>השבוע שלנו<span class="spark" aria-hidden="true"></span></h1>
        <p>מתכננים יחד שבוע טעים</p>
      </div>
      <div class="plan-week fld">
        <label for="weekLbl">שבוע:</label>
        <input id="weekLbl" type="text" maxlength="60" autocomplete="off" placeholder="למשל 19–24 באוקטובר">
      </div>
    </div>

    <div class="plan-bar">
      <button class="btn" type="button" id="kidsBtn">${ico("users")}ניהול הילדים</button>
      <button class="btn btn-out" type="button" id="printBtn">${ico("print")}הדפס</button>
      <a class="btn btn-out btn-sm" href="index.html">${ico("plus")}להוסיף מנות</a>
      <span class="count" id="planCount"></span>
      <button class="btn btn-out btn-sm" type="button" id="planClear">ניקוי הטבלה</button>
    </div>
    <p class="store-note">${ico("shield")}השמות והתכנון נשמרים רק בדפדפן הזה, במכשיר הזה. הם לא נשלחים לשום מקום, ובמכשיר אחר הטבלה תהיה ריקה.</p>
    </div>

    <div id="planLegacy"></div>
    <div class="plan-card" id="planTable"></div>

    <section class="plan-card groc" aria-labelledby="grocT">
      <h2 id="grocT">מה צריך שיהיה בבית?<span class="spark" aria-hidden="true"></span></h2>
      <div id="grocBody"></div>
    </section>

    ${allergyBand(false)}
  </div>
</section>`;

    /* תצוגה מקדימה להדפסה — אלמנט ישיר של body, כדי שאפשר יהיה להסתיר את כל השאר */
    document.body.insertAdjacentHTML("beforeend", `
<section id="printView" aria-labelledby="pvT" hidden>
  <div class="pv-bar">
    <button class="btn" type="button" id="pvPrint">${ico("print")}הדפסה או שמירה כקובץ</button>
    <button class="btn btn-out" type="button" id="pvBack">חזרה לעריכה</button>
    <span class="pv-tip">A4 לרוחב · שחור-לבן. לשמירה כ-PDF בוחרים "שמירה כ-PDF" בחלון ההדפסה.</span>
  </div>
  <div class="pv-sheet"></div>
</section>`);

    const wk = $("#weekLbl");
    wk.value = Week.weekLabel();
    wk.addEventListener("input", () => { Week.setWeekLabel(wk.value); $("#printView .pv-sheet").innerHTML = printSheet(); });

    draw();
    document.addEventListener("kupsa:week", draw);

    const pv = $("#printView");
    function openPreview() {
      $("#printView .pv-sheet").innerHTML = printSheet();
      pv.hidden = false;
      document.body.classList.add("pv-on");
      window.scrollTo(0, 0);
      $("#pvPrint").focus();
    }
    function closePreview() {
      pv.hidden = true;
      document.body.classList.remove("pv-on");
      $("#printBtn").focus();
    }
    $("#pvPrint").addEventListener("click", () => window.print());
    $("#pvBack").addEventListener("click", closePreview);
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && document.body.classList.contains("pv-on") && !$(".modal-back")) closePreview();
    });
    /* הדפסה ישירה מהדפדפן (Ctrl+P) — גם היא מקבלת את הגרסה הנקייה */
    window.addEventListener("beforeprint", () => { $("#printView .pv-sheet").innerHTML = printSheet(); });

    $("#app").addEventListener("click", (e) => {
      const t = e.target;
      if (t.closest("#kidsBtn")) return openKidsManager();
      if (t.closest("#printBtn")) return openPreview();
      const cell = t.closest("[data-cell]");
      if (cell) { const [k, d] = cell.dataset.cell.split("|"); return openCellEditor(k, d); }
      if (t.closest("#startAdd")) {
        const inp = $("#startKid"); const k = Week.addKid(inp.value);
        if (!k) return inp.focus();
        toast(`${k.name} נוסף לטבלה`);
        const b = $("#kidsBtn"); if (b) b.focus();
        return;
      }
      if (t.closest("#legGo")) {
        const kid = $("#legKid").value; const name = (Week.kid(kid) || {}).name;
        const n = Week.adoptLegacy(kid);
        toast(`${n} ארוחות שויכו ל${name}`);
        return;
      }
      if (t.closest("#legDrop")) {
        if (confirm("למחוק את התכנון הקודם? אי אפשר לשחזר אותו.")) { Week.dismissLegacy(); draw(); toast("התכנון הקודם נמחק"); }
        return;
      }
      if (t.closest("#planClear")) {
        if (!Week.mealCount()) return toast("הטבלה כבר ריקה");
        if (confirm("לנקות את כל המנות מהטבלה? שמות הילדים יישארו.")) { Week.clear(); toast("הטבלה נוקתה"); }
      }
    });
    $("#app").addEventListener("keydown", (e) => {
      if (e.key === "Enter" && e.target.id === "startKid") { e.preventDefault(); $("#startAdd").click(); }
    });
    $("#app").addEventListener("change", (e) => {
      const h = e.target.closest("[data-have]");
      if (!h) return;
      Week.setHave(h.dataset.have, h.checked);
      h.closest(".gi").classList.toggle("have", h.checked);
      const p = Week.read(); const g = groceries();
      const meta = $(".groc-meta b"); if (meta) meta.textContent = g.filter((it) => !p.have[it.key]).length;
      $("#printView .pv-sheet").innerHTML = printSheet();
    });

    document.body.insertAdjacentHTML("beforeend", footer());
    document.body.insertAdjacentHTML("beforeend", tabbar("planner"));
    initRise();
  }

  /* ============================================================
     הציעו מתכון — כפתור שפותח את Google Forms.
     הטופס לא מוטמע ולא נטען מראש: גוגל מקבלת מידע רק ממי שלחץ.
     ============================================================ */
  function renderSuggest() {
    document.title = `הציעו מתכון · ${CFG.siteName}`;
    document.body.dataset.tab = "suggest";
    document.body.insertAdjacentHTML("afterbegin", header("suggest"));
    const url = CFG.suggestForm || "";
    $("#app").innerHTML = `
<section class="crumb-hero">
  <div class="wrap">
    <h1>הציעו מתכון</h1>
    <div class="crumb-nav"><a href="index.html">ראשי</a><span class="cur">הציעו מתכון</span></div>
  </div>
</section>
<section class="sec" style="padding-top:clamp(20px,3vw,34px)">
  <div class="wrap" style="max-width:820px">
    <div class="plan-card suggest-card rise">
      <h2>יש לכם מתכון שהילדים אוהבים?</h2>
      <p class="lede">שתפו אותו עם שאר ההורים. כל הצעה נבדקת לפני שהיא עולה לאתר — כולל בדיקה מול רשימת האלרגנים.</p>
      <h3>מה כדאי לכתוב</h3>
      <ul class="sg-list">
        <li>${ico("check")}<span>שם המתכון ולאיזו ארוחה הוא מתאים — בוקר, צהריים או פינוק לשישי</span></li>
        <li>${ico("check")}<span>רשימת מצרכים עם כמויות</span></li>
        <li>${ico("check")}<span>שלבי הכנה קצרים, ואם אפשר להכין מראש בערב</span></li>
      </ul>
      <div class="alert alert-danger sg-rules">
        ${ico("alert")}
        <div><b>המתכון חייב להיות בלי:</b>${activeAllergens().map((a) => esc(a.name)).join(" · ")}
        <span style="display:block;margin-top:6px">בדקו תמיד את תווית המוצר — גם את שורת ׳עלול להכיל׳.</span></div>
      </div>
      ${url ? `
      <div class="sg-go">
        <a class="btn btn-xl" href="${esc(url)}" target="_blank" rel="noopener noreferrer">
          לטופס הצעת מתכון${ico("arrow-l")}<span class="sr-only"> (נפתח בחלון חדש, באתר של Google Forms)</span>
        </a>
        <p class="sg-note">${ico("shield")}הטופס נפתח באתר של Google Forms. אין צורך במייל או בטלפון.
          <a href="accessibility.html#privacy">פרטיות</a></p>
      </div>` : `<p class="pick-hint">הטופס עדיין לא הוגדר.</p>`}
    </div>
  </div>
</section>`;
    document.body.insertAdjacentHTML("beforeend", footer());
    document.body.insertAdjacentHTML("beforeend", tabbar("suggest"));
    initRise();
  }

  /* ============================================================
     מדריך קניות — ציבורי
     ============================================================ */
  function renderProducts() {
    document.title = `מדריך קניות · ${CFG.siteName}`;
    document.body.dataset.tab = "products";
    document.body.insertAdjacentHTML("afterbegin", header("products"));

    const byCat = {};
    PRODUCTS.forEach((p) => { (byCat[p.category] = byCat[p.category] || []).push(p); });
    const order = { avoid: 0, check: 1, ok: 2 };

    $("#app").innerHTML = `
<section class="crumb-hero compact">
  <div class="wrap"><div class="crumb-nav"><a href="index.html">ראשי</a><span class="cur">מדריך קניות</span></div></div>
</section>
<section class="sec" style="padding-top:34px">
  <div class="wrap" style="max-width:900px">
    ${titleArea("בסופר", "מה לחפש וממה להימנע", "מדריך קטגוריות — לא רשימת מוצרים מאושרים. יצרנים משנים מתכונים בלי הודעה.", 1)}

    <div class="alert alert-danger" style="margin-bottom:26px">
      ${ico("alert")}
      <div><b>אסור בבית הספר</b>${activeAllergens().map((a) => esc(a.name)).join(" · ")}</div>
    </div>

    ${Object.entries(byCat).map(([cat, list]) => `
    <div class="card">
      <h2>${ico("cart")}${esc(cat)}</h2>
      <ul class="prods">
        ${list.slice().sort((a, b) => order[a.status] - order[b.status]).map((p) => `
        <li class="prod" style="align-items:flex-start">
          <div class="prod-b">
            <b>${esc(p.name)}</b>
            ${p.look && p.look !== "—" ? `<span style="display:block;color:var(--ok)">✓ חפש: ${esc(p.look)}</span>` : ""}
            ${p.avoid && p.avoid !== "—" ? `<span style="display:block;color:var(--danger)">✗ הימנע: ${esc(p.avoid)}</span>` : ""}
            ${p.note ? `<span style="display:block;color:var(--ink-3);margin-top:3px">${esc(p.note)}</span>` : ""}
          </div>
          <span class="badge ${p.status === "avoid" ? "badge-no" : p.status === "check" ? "badge-warn" : "badge-ok"}">
            ${p.status === "avoid" ? "להימנע" : p.status === "check" ? "בדוק תווית" : "בדרך כלל בטוח"}
          </span>
        </li>`).join("")}
      </ul>
    </div>`).join("")}

    <div class="alert alert-warn">
      ${ico("alert")}
      <div><b>תמיד קרא את התווית</b>${esc(CFG.disclaimer || "")}</div>
    </div>
  </div>
</section>`;

    document.body.insertAdjacentHTML("beforeend", footer());
    document.body.insertAdjacentHTML("beforeend", tabbar("products"));
    initRise();
  }

  /* ---------- הודעה צפה ---------- */
  let toastEl;
  function toast(msg) {
    if (!toastEl) { toastEl = document.createElement("div"); toastEl.className = "toast"; document.body.appendChild(toastEl); }
    toastEl.textContent = msg;
    toastEl.classList.add("show");
    clearTimeout(toastEl._t);
    toastEl._t = setTimeout(() => toastEl.classList.remove("show"), 2400);
  }

  window.App = {
    $, $$, esc, ico, qp, toast, scanText, img, mealImg, heroImg,
    CFG, MEALS, PRODUCTS, NUTRI,
    catById, diffByLevel, mealById, activeAllergens,
    header, footer, tabbar, mealCard, pips, titleArea, initRise,
    Favs, Week, DAYS, SLOTS, initCards, openDayPicker, openAddToTable, groceries, parseQty, nutritionCard,
  };

  document.addEventListener("DOMContentLoaded", () => {
    initTheme();
    initNav();
    initCards();
    initTilt();
    const page = document.body.dataset.page;
    if (page === "home") renderHome();
    else if (page === "category") renderCategory();
    else if (page === "meal") renderMeal();
    else if (page === "favorites") renderFavorites();
    else if (page === "planner") renderPlanner();
    else if (page === "products") renderProducts();
    else if (page === "suggest") renderSuggest();
    initAllergyBar();
  });
})();
