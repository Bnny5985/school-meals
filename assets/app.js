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
  const mealImg = (id) => IMG.mealDir + id + IMG.ext;
  const heroImg = (n) => IMG.heroDir + n + IMG.ext;

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

  /* ---------- תפריט נייד ---------- */
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
    return `
<header class="hdr">
  <div class="hdr-in">
    <a class="logo" href="index.html">
      <span class="logo-mark">${ico("box")}</span>
      <span>${esc(CFG.siteName || "הקופסה")}<small>${esc(CFG.schoolName || "")}</small></span>
    </a>
    <span class="hdr-spacer"></span>
    <nav class="nav" id="mainNav" aria-label="ניווט ראשי">
      <a href="index.html"${active === "home" ? ' aria-current="page"' : ""}>ראשי</a>
      ${(CFG.categories || []).map((c) => `<a href="category.html?cat=${c.id}"${active === c.id ? ' aria-current="page"' : ""}>${esc(c.name)}</a>`).join("")}
      <a href="admin.html"${active === "admin" ? ' aria-current="page"' : ""}>ניהול</a>
    </nav>
    <button class="icon-btn" data-theme-toggle aria-label="החלף ערכת נושא">${ico("moon")}</button>
    <button class="icon-btn nav-toggle" data-nav-toggle aria-label="תפריט" aria-expanded="false" aria-controls="mainNav">
      <span class="ic-open">${ico("menu")}</span><span class="ic-close">${ico("x")}</span>
    </button>
  </div>
</header>
<div class="allergy-bar" role="region" aria-label="אלרגנים אסורים בבית הספר">
  <div class="allergy-bar-in"><b>אסור בבית הספר:</b>${chips}${ok}</div>
</div>`;
  }

  function footer() {
    return `
<footer class="ftr">
  <div class="ftr-in">
    <div class="ftr-grid">
      <div>
        <div class="logo"><span class="logo-mark">${ico("box")}</span><span>${esc(CFG.siteName)}</span></div>
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
      <a href="admin.html">עריכת התוכן</a>
    </div>
  </div>
</footer>`;
  }

  function pips(level) {
    let h = `<span class="pips d${level}">`;
    for (let i = 1; i <= 5; i++) h += `<span class="pip${i <= level ? " on" : ""}"></span>`;
    return h + "</span>";
  }

  function titleArea(sub, h2, p) {
    return `<div class="title-area rise">
      <div class="sub-title">${esc(sub)}</div>
      <h2>${esc(h2)}</h2>${p ? `<p>${esc(p)}</p>` : ""}
    </div>`;
  }

  /* ---------- כרטיס מנה ---------- */
  function mealCard(m) {
    const d = diffByLevel(m.difficulty);
    const n = NUTRI[m.id];
    const ph = `<span class="ph">${ico(m.icon)}</span>`;
    return `
<a class="dish rise" href="meal.html?id=${encodeURIComponent(m.id)}">
  <span class="dish-badge${m.difficulty >= 4 ? " b2" : ""}">${esc(d.name)}</span>
  <span class="dish-thumb">${img(mealImg(m.id), ph)}</span>
  <h3>${esc(m.name)}</h3>
  <p>${esc(m.short)}</p>
  <span class="dish-meta">
    ${pips(m.difficulty)}
    <span class="dot"></span><span>${esc(m.prepTime)} דק׳</span>
    <span class="dot"></span><span>${esc(m.kosher)}</span>
    ${n ? `<span class="dot"></span><span>${n.protein} גר׳ חלבון</span>` : ""}
  </span>
</a>`;
  }

  /* ============================================================
     עמוד ראשי
     ============================================================ */
  function renderHome() {
    const cats = (CFG.categories || [])
      .map((c) => {
        const n = MEALS.filter((m) => m.cat === c.id).length;
        /* האייקון העגול כבר מציג את הסמל, אז כאן מראים איזה קובץ חסר */
        const ph = `<span class="ph"><span class="ph-path">${esc(heroImg("cat-" + c.id))}</span></span>`;
        return `
<a class="cat rise" href="category.html?cat=${encodeURIComponent(c.id)}">
  <span class="cat-top">${img(heroImg("cat-" + c.id), ph)}</span>
  <span class="cat-ico">${ico(c.icon)}</span>
  <span class="cat-body">
    <h3>${esc(c.name)}</h3>
    <p>${esc(c.desc)}</p>
    <span class="cat-count">${n} מנות ${ico("arrow-l")}</span>
  </span>
</a>`;
      })
      .join("");

    const bannerPh = `<div class="ph"><div><b>כאן נכנסת תמונת הבאנר</b><span>${esc(heroImg("banner"))}</span></div></div>`;

    document.body.insertAdjacentHTML("afterbegin", header("home"));
    $("#app").innerHTML = `
<section class="banner">
  <div class="banner-in">
    <div class="rise">
      <div class="sub-title">ארוחות לבית הספר</div>
      <h1>מה שמים היום <em>בקופסה</em>?</h1>
      <p class="lede">${esc(CFG.tagline || "")} — ${MEALS.length} מנות מעשיות להורים עובדים, עם רשימת קניות, רמת קושי וערכים תזונתיים לכל אחת.</p>
      <div class="btn-row">
        <a class="btn" href="category.html?cat=breakfast">${ico("sun")}התחל מארוחת בוקר</a>
        <a class="btn btn-out" href="#how">איך זה עובד</a>
      </div>
      <div class="banner-stats">
        ${(CFG.categories || []).map((c) => `<div class="bstat"><b>${MEALS.filter((m) => m.cat === c.id).length}</b><span>${esc(c.name)}</span></div>`).join("")}
        <div class="bstat"><b>${activeAllergens().length}</b><span>אלרגנים מנוטרים</span></div>
      </div>
    </div>
    <div class="banner-media rise">${img(heroImg("banner"), bannerPh, "", "קופסת אוכל פתוחה וארוזה לבית הספר — כריך, ירקות ופירות")}</div>
  </div>
</section>

<section class="sec">
  <div class="wrap">
    ${titleArea("שלוש קטגוריות", "מה מחפשים היום?", "כל קטגוריה מחולקת לכריכים ולמנות שאינן כריך — עשר מכל סוג.")}
    <div class="cats">${cats}</div>
  </div>
</section>

<section class="sec sec-cream" id="how">
  <div class="wrap">
    ${titleArea("רמות קושי", "מ״ילד בגן״ ועד ״כוכב מישלן״", "כל המנות מעשיות להורים עובדים. הסולם מתאר כמה תשומת לב הן דורשות.")}
    <div class="meals" style="grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:18px">
      ${(CFG.difficulties || [])
        .map(
          (d) => `
      <div class="card rise" style="margin:0;text-align:center;padding:26px 20px">
        <div style="display:flex;justify-content:center;margin-bottom:12px">${pips(d.level)}</div>
        <h3 style="font-size:18px;margin-bottom:4px">${esc(d.name)}</h3>
        <div style="color:var(--theme);font-weight:800;font-size:13px;margin-bottom:9px">${esc(d.short)}</div>
        <p style="font-size:14px;margin:0;color:var(--text)">${esc(d.desc)}</p>
      </div>`
        )
        .join("")}
    </div>
  </div>
</section>

<section class="sec">
  <div class="wrap">
    ${titleArea("מדריך קניות", "איפה האלרגנים מסתתרים", "הקטגוריות בסופר שדורשות תשומת לב מיוחדת.")}
    <div class="prods rise" style="grid-template-columns:repeat(auto-fit,minmax(min(300px,100%),1fr))">
      ${PRODUCTS.filter((p) => p.status !== "ok")
        .slice(0, 9)
        .map(
          (p) => `
      <div class="prod">
        <div class="prod-b"><b>${esc(p.name)}</b><span>${esc(p.status === "avoid" ? p.avoid : p.look)}</span></div>
        <span class="badge ${p.status === "avoid" ? "badge-no" : "badge-warn"}">${p.status === "avoid" ? "להימנע" : "בדוק תווית"}</span>
      </div>`
        )
        .join("")}
    </div>
    <div class="btn-row rise" style="justify-content:center;margin-top:32px"><a class="btn btn-out" href="admin.html#products">המדריך המלא</a></div>
  </div>
</section>

<section class="sec sec-cream">
  <div class="wrap"><div class="cta rise">
    <h2>ילד חדש הצטרף לכיתה?</h2>
    <p>מוסיפים את האלרגן שלו בפאנל הניהול — וכל 60 המנות, כל רשימות הקניות וסורק המוצרים מתעדכנים מיד.</p>
    <a class="btn" href="admin.html">${ico("settings")}לפאנל הניהול</a>
  </div></div>
</section>`;
    document.body.insertAdjacentHTML("beforeend", footer());
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
<section class="crumb-hero" style="--crumb-img:url('${esc(heroImg("head-" + cid))}')">
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
<section class="crumb-hero compact" style="--crumb-img:url('${esc(heroImg("head-" + m.cat))}')">
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
        <button class="btn" id="copyList">${ico("list")}העתקת רשימת קניות</button>
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
    header, footer, mealCard, pips, titleArea, initRise,
  };

  document.addEventListener("DOMContentLoaded", () => {
    initTheme();
    initNav();
    const page = document.body.dataset.page;
    if (page === "home") renderHome();
    else if (page === "category") renderCategory();
    else if (page === "meal") renderMeal();
  });
})();
