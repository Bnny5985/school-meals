/* ============================================================
   הקופסה — פאנל ניהול
   עורך מנות ואלרגנים בדפדפן, שומר טיוטה מקומית,
   ומייצא קבצים מוכנים להחלפה בתיקיית data/
   ============================================================ */
(function () {
  "use strict";

  const A = window.App;
  const { $, $$, esc, ico } = A;
  const CFG = A.CFG;

  const DRAFT = "kupsa-draft";
  let meals = [];
  let allergens = [];
  let nutri = {};
  let sel = null;
  let tab = "meals";

  /* ---------- טעינה ---------- */
  function load() {
    let d = null;
    try {
      d = JSON.parse(localStorage.getItem(DRAFT) || "null");
    } catch (e) {
      d = null;
    }
    if (d && Array.isArray(d.meals) && d.meals.length) {
      meals = d.meals;
      allergens = d.allergens || JSON.parse(JSON.stringify(CFG.allergens));
      nutri = d.nutri || JSON.parse(JSON.stringify(A.NUTRI || {}));
      return true;
    }
    meals = JSON.parse(JSON.stringify(A.MEALS));
    allergens = JSON.parse(JSON.stringify(CFG.allergens));
    nutri = JSON.parse(JSON.stringify(A.NUTRI || {}));
    return false;
  }

  function save() {
    try {
      localStorage.setItem(DRAFT, JSON.stringify({ meals, allergens, nutri }));
      A.toast("הטיוטה נשמרה בדפדפן");
    } catch (e) {
      A.toast("לא ניתן לשמור — האחסון בדפדפן חסום");
    }
  }

  function discard() {
    if (!confirm("לבטל את כל השינויים ולחזור לקבצים המקוריים?")) return;
    try {
      localStorage.removeItem(DRAFT);
    } catch (e) {}
    load();
    sel = meals[0] ? meals[0].id : null;
    render();
    A.toast("הטיוטה נמחקה");
  }

  /* ---------- המרות טקסט <-> נתונים ---------- */
  const linesToArr = (s) =>
    String(s || "")
      .split("\n")
      .map((x) => x.trim())
      .filter(Boolean);

  const prepToText = (prep) =>
    (prep || [])
      .map((p) => [p.name, p.qty || "", p.note || "", p.warn || ""].join(" | ").replace(/\s*\|\s*$/g, ""))
      .join("\n");

  function textToPrep(s) {
    return linesToArr(s).map((line) => {
      const [name, qty, note, warn] = line.split("|").map((x) => (x || "").trim());
      const o = { name: name || "", qty: qty || "" };
      if (note) o.note = note;
      if (warn) o.warn = warn;
      return o;
    });
  }

  /* ---------- ייצוא ---------- */
  function jsonLine(v) {
    return JSON.stringify(v);
  }

  function mealToSource(m) {
    const L = [];
    L.push("{");
    L.push(`  id: ${jsonLine(m.id)},`);
    L.push(`  name: ${jsonLine(m.name)},`);
    L.push(`  cat: ${jsonLine(m.cat)}, type: ${jsonLine(m.type)}, icon: ${jsonLine(m.icon)},`);
    L.push(`  difficulty: ${Number(m.difficulty)}, prepTime: ${Number(m.prepTime)}, kosher: ${jsonLine(m.kosher)},`);
    L.push(`  tags: ${jsonLine(m.tags || [])},`);
    L.push(`  short: ${jsonLine(m.short || "")},`);
    L.push(`  makeAhead: ${jsonLine(m.makeAhead || "")},`);
    L.push("  prep: [");
    (m.prep || []).forEach((p) => {
      const parts = [`name: ${jsonLine(p.name)}`, `qty: ${jsonLine(p.qty || "")}`];
      if (p.note) parts.push(`note: ${jsonLine(p.note)}`);
      if (p.warn) parts.push(`warn: ${jsonLine(p.warn)}`);
      L.push(`    { ${parts.join(", ")} },`);
    });
    L.push("  ],");
    L.push("  steps: [");
    (m.steps || []).forEach((s) => L.push(`    ${jsonLine(s)},`));
    L.push("  ],");
    L.push("  tips: [");
    (m.tips || []).forEach((s) => L.push(`    ${jsonLine(s)},`));
    L.push("  ],");
    L.push("  allergen: [");
    (m.allergen || []).forEach((s) => L.push(`    ${jsonLine(s)},`));
    L.push("  ],");
    L.push("}");
    return L.join("\n");
  }

  function exportCategory(catId) {
    const c = A.catById(catId) || { name: catId };
    const list = meals.filter((m) => m.cat === catId);
    const body = list.map(mealToSource).join(",\n\n");
    return `/* ============================================================
   ${c.name} — יוצא מפאנל הניהול בתאריך ${new Date().toLocaleDateString("he-IL")}
   ${list.length} מנות
   ============================================================ */

(window.MEALS = window.MEALS || []).push(

${body}

);
`;
  }

  function exportNutrition() {
    const byCat = (CFG.categories || [])
      .map((c) => {
        const rows = meals
          .filter((m) => m.cat === c.id)
          .map((m) => {
            const n = nutri[m.id] || { kcal: 0, protein: 0, sugar: 0, serving: "מנה אחת" };
            return `  ${JSON.stringify(m.id).padEnd(30)}: { kcal: ${Number(n.kcal) || 0}, protein: ${Number(n.protein) || 0}, sugar: ${Number(n.sugar) || 0}, serving: ${jsonLine(n.serving || "מנה אחת")} },`;
          })
          .join("\n");
        return `  /* ---------- ${c.name} ---------- */\n${rows}`;
      })
      .join("\n\n");

    return `/* ============================================================
   הקופסה — ערכים תזונתיים
   יוצא מפאנל הניהול בתאריך ${new Date().toLocaleDateString("he-IL")}
   ------------------------------------------------------------
   הערכים הם הערכה מחושבת לפי כמויות המרכיבים, לא בדיקת מעבדה.
   ערכי הייחוס היומיים נמצאים ב-data/config.js תחת nutritionRef.
   ============================================================ */

window.NUTRITION = {
${byCat}
};
`;
  }

  function exportConfig() {
    const rows = allergens
      .map(
        (a) =>
          `    { id: ${jsonLine(a.id)}, name: ${jsonLine(a.name)}, aliases: ${jsonLine(a.aliases || [])}, active: ${a.active ? "true" : "false"} },`
      )
      .join("\n");
    return `/* מערך האלרגנים — הדבק את הבלוק הזה במקום מערך allergens בקובץ data/config.js */

  allergens: [
${rows}
  ],
`;
  }

  function download(name, text) {
    const b = new Blob([text], { type: "text/plain;charset=utf-8" });
    const u = URL.createObjectURL(b);
    const a = document.createElement("a");
    a.href = u;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(u), 1000);
  }

  /* ---------- תצוגה ---------- */
  function render() {
    const app = $("#app");
    app.innerHTML = `
<section class="crumb-hero">
  <div class="wrap">
    <h1>פאנל ניהול</h1>
    <div class="crumb-nav"><a href="index.html">ראשי</a><span class="cur">ניהול</span></div>
  </div>
</section>
<div class="wrap" style="padding-top:40px;padding-bottom:80px">

  <div class="toolbar">
    <div class="seg" id="tabs">
      <button data-t="meals" aria-pressed="${tab === "meals"}">מנות (${meals.length})</button>
      <button data-t="allergens" aria-pressed="${tab === "allergens"}">אלרגנים</button>
      <button data-t="products" aria-pressed="${tab === "products"}">מדריך מוצרים</button>
      <button data-t="export" aria-pressed="${tab === "export"}">ייצוא</button>
    </div>
    <span class="hdr-spacer" style="flex:1"></span>
    <button class="btn btn-sm" id="saveBtn">${ico("check")}שמור טיוטה</button>
    <button class="btn btn-out btn-sm" id="discardBtn">בטל שינויים</button>
  </div>

  <div id="tabBody"></div>
</div>`;

    $("#tabs").addEventListener("click", (e) => {
      const b = e.target.closest("button");
      if (!b) return;
      tab = b.dataset.t;
      render();
    });
    $("#saveBtn").addEventListener("click", save);
    $("#discardBtn").addEventListener("click", discard);

    if (tab === "meals") drawMeals();
    else if (tab === "allergens") drawAllergens();
    else if (tab === "products") drawProducts();
    else drawExport();
  }

  /* ---------- לשונית מנות ---------- */
  function drawMeals() {
    if (!sel || !meals.find((m) => m.id === sel)) sel = meals[0] ? meals[0].id : null;

    const groups = (CFG.categories || [])
      .map((c) => {
        const list = meals.filter((m) => m.cat === c.id);
        return (
          `<div class="adm-grp">${esc(c.name)} · ${list.length}</div>` +
          list
            .map(
              (m) =>
                `<button class="adm-item" data-id="${esc(m.id)}" aria-current="${m.id === sel}">
                   ${esc(m.name)}<small>${esc(m.type === "sandwich" ? c.sandwichLabel : c.otherLabel)} · רמה ${m.difficulty} · ${m.prepTime} דק׳</small>
                 </button>`
            )
            .join("")
        );
      })
      .join("");

    $("#tabBody").innerHTML = `
<div class="adm-grid">
  <div>
    <div class="btn-row" style="margin-bottom:12px">
      <button class="btn btn-sm" id="addMeal">+ מנה חדשה</button>
    </div>
    <div class="adm-list" id="mealList">${groups}</div>
  </div>
  <div id="editor"></div>
</div>`;

    $("#mealList").addEventListener("click", (e) => {
      const b = e.target.closest(".adm-item");
      if (!b) return;
      sel = b.dataset.id;
      drawMeals();
    });

    $("#addMeal").addEventListener("click", () => {
      const id = "meal-" + Date.now().toString(36);
      meals.push({
        id,
        name: "מנה חדשה",
        cat: (CFG.categories[0] || {}).id,
        type: "sandwich",
        icon: "sandwich",
        difficulty: 2,
        prepTime: 10,
        kosher: "פרווה",
        tags: [],
        short: "",
        makeAhead: "",
        prep: [],
        steps: [],
        tips: [],
        allergen: [],
      });
      sel = id;
      drawMeals();
    });

    drawEditor();
  }

  function drawEditor() {
    const m = meals.find((x) => x.id === sel);
    const box = $("#editor");
    if (!m) {
      box.innerHTML = `<div class="empty">בחר מנה מהרשימה, או צור מנה חדשה.</div>`;
      return;
    }

    const nut = nutri[m.id] || { kcal: 0, protein: 0, sugar: 0, serving: "מנה אחת" };
    const iconOpts = (window.Icons ? window.Icons.names : [])
      .map((n) => `<option value="${esc(n)}"${n === m.icon ? " selected" : ""}>${esc(n)}</option>`)
      .join("");

    box.innerHTML = `
<div class="card">
  <h2>${ico(m.icon)}עריכת מנה</h2>

  <div class="fld">
    <label>שם המנה</label>
    <input id="f-name" value="${esc(m.name)}">
  </div>

  <div class="fld-row">
    <div class="fld">
      <label>קטגוריה</label>
      <select id="f-cat">
        ${(CFG.categories || [])
          .map((c) => `<option value="${esc(c.id)}"${c.id === m.cat ? " selected" : ""}>${esc(c.name)}</option>`)
          .join("")}
      </select>
    </div>
    <div class="fld">
      <label>סוג</label>
      <select id="f-type">
        <option value="sandwich"${m.type === "sandwich" ? " selected" : ""}>כריך / פרוסה</option>
        <option value="other"${m.type === "other" ? " selected" : ""}>לא כריך</option>
      </select>
    </div>
    <div class="fld">
      <label>כשרות</label>
      <select id="f-kosher">
        ${(CFG.kosherTypes || []).map((k) => `<option${k === m.kosher ? " selected" : ""}>${esc(k)}</option>`).join("")}
      </select>
    </div>
  </div>

  <div class="fld-row">
    <div class="fld">
      <label>רמת קושי</label>
      <select id="f-diff">
        ${(CFG.difficulties || [])
          .map((d) => `<option value="${d.level}"${d.level === m.difficulty ? " selected" : ""}>${d.level} — ${esc(d.name)}</option>`)
          .join("")}
      </select>
    </div>
    <div class="fld">
      <label>זמן הכנה (דקות)</label>
      <input id="f-time" type="number" min="1" value="${Number(m.prepTime)}">
    </div>
    <div class="fld">
      <label>איור</label>
      <select id="f-icon">${iconOpts}</select>
    </div>
  </div>

  <div class="fld">
    <label>תיאור קצר</label>
    <textarea id="f-short" style="min-height:60px">${esc(m.short || "")}</textarea>
    <div class="hint">מופיע ברשימת המנות ובראש דף המנה.</div>
  </div>

  <div class="fld">
    <label>תגיות</label>
    <input id="f-tags" value="${esc((m.tags || []).join(", "))}">
    <div class="hint">מופרדות בפסיק. לדוגמה: מהיר, חלבון גבוה, מקפיא יפה</div>
  </div>

  <div class="fld">
    <label>הכנה מראש</label>
    <input id="f-ahead" value="${esc(m.makeAhead || "")}">
  </div>

  <div class="card" style="margin:0 0 20px;background:var(--bg3);box-shadow:none;padding:20px">
    <h2 style="font-size:16px;margin-bottom:14px">${ico("chart")}ערכים תזונתיים למנה</h2>
    <div class="fld-row">
      <div class="fld"><label>קלוריות (קק״ל)</label><input id="f-kcal" type="number" min="0" value="${Number(nut.kcal) || 0}"></div>
      <div class="fld"><label>חלבון (גר׳)</label><input id="f-protein" type="number" min="0" value="${Number(nut.protein) || 0}"></div>
      <div class="fld"><label>סוכר (גר׳)</label><input id="f-sugar" type="number" min="0" value="${Number(nut.sugar) || 0}"></div>
    </div>
    <div class="fld" style="margin-bottom:0">
      <label>מה נחשב מנה אחת</label>
      <input id="f-serving" value="${esc(nut.serving || "מנה אחת")}">
      <div class="hint">
        מוצג בראש טבלת הערכים. לדוגמה: ״כריך שלם״, ״2 עוגיות״, ״תרמוס״.<br>
        האחוזים מחושבים מול: ${(CFG.nutritionRef || []).map((r) => `${esc(r.name)} ${r.daily} ${esc(r.unit)}`).join(" · ")} ליום.
      </div>
    </div>
  </div>

  <div class="fld">
    <label>מוצרים להכין מראש</label>
    <textarea id="f-prep" style="min-height:170px">${esc(prepToText(m.prep))}</textarea>
    <div class="hint">שורה לכל מוצר, בפורמט: <b>שם | כמות | הערה | אזהרת אלרגן</b><br>
    שדות הערה ואזהרה אופציונליים. האזהרה מופיעה כמשולש כתום.</div>
  </div>

  <div class="fld">
    <label>שלבי הכנה</label>
    <textarea id="f-steps" style="min-height:150px">${esc((m.steps || []).join("\n"))}</textarea>
    <div class="hint">שורה לכל שלב. המספור נוצר אוטומטית.</div>
  </div>

  <div class="fld">
    <label>טיפים</label>
    <textarea id="f-tips">${esc((m.tips || []).join("\n"))}</textarea>
    <div class="hint">שורה לכל טיפ.</div>
  </div>

  <div class="fld">
    <label>הערות אלרגנים</label>
    <textarea id="f-allergen">${esc((m.allergen || []).join("\n"))}</textarea>
    <div class="hint">שורה לכל הערה. שורה שמתחילה ב-❌ תוצג באדום, שורה שמתחילה ב-⚠️ תוצג בכתום.</div>
  </div>

  <div class="btn-row">
    <button class="btn" id="applyBtn">${ico("check")}עדכן מנה</button>
    <a class="btn btn-out" href="meal.html?id=${encodeURIComponent(m.id)}" target="_blank">תצוגה מקדימה</a>
    <button class="btn btn-out" id="dupBtn">שכפל</button>
    <button class="btn btn-out" id="delBtn" style="color:var(--danger);border-color:var(--danger)">מחק</button>
  </div>
</div>`;

    $("#applyBtn").addEventListener("click", () => {
      m.name = $("#f-name").value.trim() || m.name;
      m.cat = $("#f-cat").value;
      m.type = $("#f-type").value;
      m.kosher = $("#f-kosher").value;
      m.difficulty = Number($("#f-diff").value);
      m.prepTime = Number($("#f-time").value) || 10;
      m.icon = $("#f-icon").value;
      m.short = $("#f-short").value.trim();
      m.makeAhead = $("#f-ahead").value.trim();
      m.tags = $("#f-tags").value.split(",").map((x) => x.trim()).filter(Boolean);
      m.prep = textToPrep($("#f-prep").value);
      m.steps = linesToArr($("#f-steps").value);
      m.tips = linesToArr($("#f-tips").value);
      m.allergen = linesToArr($("#f-allergen").value);
      nutri[m.id] = {
        kcal: Number($("#f-kcal").value) || 0,
        protein: Number($("#f-protein").value) || 0,
        sugar: Number($("#f-sugar").value) || 0,
        serving: $("#f-serving").value.trim() || "מנה אחת",
      };
      save();
      drawMeals();
    });

    $("#dupBtn").addEventListener("click", () => {
      const copy = JSON.parse(JSON.stringify(m));
      copy.id = m.id + "-copy-" + Date.now().toString(36).slice(-4);
      copy.name = m.name + " (עותק)";
      nutri[copy.id] = JSON.parse(JSON.stringify(nut));
      meals.push(copy);
      sel = copy.id;
      save();
      drawMeals();
    });

    $("#delBtn").addEventListener("click", () => {
      if (!confirm(`למחוק את "${m.name}"?`)) return;
      meals = meals.filter((x) => x.id !== m.id);
      sel = null;
      save();
      drawMeals();
    });
  }

  /* ---------- לשונית אלרגנים ---------- */
  function drawAllergens() {
    $("#tabBody").innerHTML = `
<div class="card" style="margin-top:20px">
  <h2>${ico("alert")}אלרגנים אסורים</h2>
  <p style="color:var(--ink-2);font-size:14.5px;margin:0 0 18px">
    כשילד חדש מצטרף לכיתה — הוסף כאן את האלרגן שלו. כל האתר יתעדכן מיד.<br>
    אם ילד עזב, עדיף לכבות את האלרגן ולא למחוק אותו, כדי לשמור על ההיסטוריה.
  </p>

  <ul class="prods" id="algList">
    ${allergens
      .map(
        (a, i) => `
    <li class="prod">
      <label style="display:flex;align-items:center;gap:9px;cursor:pointer;flex:0 0 auto">
        <input type="checkbox" data-i="${i}" class="alg-on" ${a.active ? "checked" : ""} style="width:18px;height:18px">
        <span style="font-size:13px;font-weight:700;color:var(--ink-3)">פעיל</span>
      </label>
      <div class="prod-b">
        <b>${esc(a.name)}</b>
        <span>מילים נרדפות: ${esc((a.aliases || []).join(", "))}</span>
      </div>
      <span class="badge ${a.active ? "badge-no" : "badge-ok"}">${a.active ? "אסור" : "מבוטל"}</span>
      <button class="btn btn-out btn-sm alg-del" data-i="${i}" style="color:var(--danger)">מחק</button>
    </li>`
      )
      .join("")}
  </ul>

  <div class="card" style="margin:22px 0 0;background:var(--bg-sunk)">
    <h2 style="font-size:16px">הוספת אלרגן חדש</h2>
    <div class="fld-row">
      <div class="fld">
        <label>שם בעברית</label>
        <input id="na-name" placeholder="לדוגמה: אגוזי לוז">
      </div>
      <div class="fld">
        <label>מזהה באנגלית</label>
        <input id="na-id" placeholder="hazelnut">
      </div>
    </div>
    <div class="fld">
      <label>מילים נרדפות</label>
      <input id="na-alias" placeholder="אגוז לוז, לוז, hazelnut">
      <div class="hint">מופרדות בפסיק. האתר סורק לפיהן טקסט של מוצרים בחיפוש.</div>
    </div>
    <button class="btn btn-sm" id="na-add">הוסף אלרגן</button>
  </div>
</div>`;

    $("#algList").addEventListener("change", (e) => {
      const cb = e.target.closest(".alg-on");
      if (!cb) return;
      allergens[cb.dataset.i].active = cb.checked;
      save();
      drawAllergens();
    });

    $("#algList").addEventListener("click", (e) => {
      const b = e.target.closest(".alg-del");
      if (!b) return;
      const a = allergens[b.dataset.i];
      if (!confirm(`למחוק את "${a.name}" לגמרי? עדיף לכבות אותו במקום.`)) return;
      allergens.splice(b.dataset.i, 1);
      save();
      drawAllergens();
    });

    $("#na-add").addEventListener("click", () => {
      const name = $("#na-name").value.trim();
      const id = $("#na-id").value.trim();
      if (!name || !id) {
        A.toast("צריך גם שם וגם מזהה");
        return;
      }
      const aliases = $("#na-alias").value.split(",").map((x) => x.trim()).filter(Boolean);
      allergens.push({ id, name, aliases: aliases.length ? aliases : [name], active: true });
      save();
      drawAllergens();
    });
  }

  /* ---------- לשונית מוצרים ---------- */
  function drawProducts() {
    const byCat = {};
    A.PRODUCTS.forEach((p) => {
      (byCat[p.category] = byCat[p.category] || []).push(p);
    });

    $("#tabBody").innerHTML = `
<div class="card" style="margin-top:20px">
  <h2>${ico("cart")}מדריך קניות</h2>
  <p style="color:var(--ink-2);font-size:14.5px;margin:0 0 18px">
    זה מדריך קטגוריות ולא רשימת מוצרים מאושרים — יצרנים משנים מתכונים בלי הודעה.
    לעריכה: <code>data/products.js</code>
  </p>
  ${Object.entries(byCat)
    .map(
      ([cat, list]) => `
  <div class="sec-head" style="margin:22px 0 12px"><h2 style="font-size:17px">${esc(cat)}</h2></div>
  <ul class="prods">
    ${list
      .map(
        (p) => `
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
    </li>`
      )
      .join("")}
  </ul>`
    )
    .join("")}
</div>`;
  }

  /* ---------- לשונית ייצוא ---------- */
  function drawExport() {
    $("#tabBody").innerHTML = `
<div class="card" style="margin-top:20px">
  <h2>${ico("check")}ייצוא הקבצים</h2>
  <p style="color:var(--ink-2);font-size:14.5px">
    השינויים שעשית שמורים כרגע רק בדפדפן הזה. כדי שהם יופיעו באתר האמיתי:
    הורד את הקבצים, החלף אותם בתיקיית <code>data/</code>, והעלה ל-GitHub.
  </p>

  <ol class="steps" style="margin:18px 0">
    <li>לחץ על הכפתורים למטה — הקבצים יירדו לתיקיית ההורדות.</li>
    <li>העתק אותם לתיקיית <code>data/</code> של האתר, במקום הקבצים הישנים.</li>
    <li>העלה ל-GitHub. תוך דקה האתר החי מתעדכן.</li>
    <li>חזור לכאן ולחץ ״בטל שינויים״ — כדי שהטיוטה לא תסתיר את הקבצים החדשים.</li>
  </ol>

  <div class="btn-row">
    ${(CFG.categories || [])
      .map(
        (c) =>
          `<button class="btn btn-out" data-exp="${esc(c.id)}">
             ${esc(c.name)} (${meals.filter((m) => m.cat === c.id).length})
           </button>`
      )
      .join("")}
    <button class="btn btn-out" data-exp="__nut">ערכים תזונתיים</button>
    <button class="btn btn-out" data-exp="__cfg">מערך האלרגנים</button>
  </div>

  <div class="alert alert-warn" style="margin-top:20px">
    ${ico("alert")}
    <div>
      <b>שים לב</b>
      קובץ האלרגנים יורד כקטע קוד ולא כקובץ שלם — צריך להדביק אותו ידנית
      במקום מערך <code>allergens</code> בתוך <code>data/config.js</code>, כדי לא לדרוס את שאר ההגדרות.
    </div>
  </div>
</div>`;

    $("#tabBody").addEventListener("click", (e) => {
      const b = e.target.closest("[data-exp]");
      if (!b) return;
      const k = b.dataset.exp;
      if (k === "__cfg") {
        download("allergens-block.txt", exportConfig());
        A.toast("ירד קטע האלרגנים");
      } else if (k === "__nut") {
        download("nutrition.js", exportNutrition());
        A.toast("ירד קובץ הערכים התזונתיים");
      } else {
        download("meals-" + k + ".js", exportCategory(k));
        A.toast("ירד קובץ המנות");
      }
    });
  }

  /* ---------- אתחול ---------- */
  document.addEventListener("DOMContentLoaded", () => {
    document.body.insertAdjacentHTML("afterbegin", A.header("admin"));
    const hadDraft = load();
    sel = meals[0] ? meals[0].id : null;
    if (location.hash === "#products") tab = "products";
    render();
    document.body.insertAdjacentHTML("beforeend", A.footer());
    if (hadDraft) A.toast("נטענה טיוטה שמורה מהדפדפן");
  });
})();
