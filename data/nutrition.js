/* ============================================================
   הקופסה — ערכים תזונתיים
   ------------------------------------------------------------
   ⚠️  קרא את זה לפני שאתה מסתמך על המספרים:
   הערכים הם *הערכה מחושבת* לפי כמויות המרכיבים במתכון וטבלאות
   תזונה מקובלות. הם לא בדיקת מעבדה, והם משתנים לפי המותג שקנית,
   גודל הפרוסה, וכמה נדיב אתה עם הממרח.
   התייחס אליהם כאל סדר גודל, לא כמספר מדויק.

   kcal    – קלוריות למנה
   protein – חלבון בגרמים
   sugar   – סוכר בגרמים (כולל סוכר טבעי מפירות ומחלב)
   serving – מה נחשב "מנה אחת"

   ✏️  לעריכה: שנה מספר ושמור. ערכי הייחוס היומיים נמצאים
   בקובץ data/config.js תחת nutritionRef.
   ============================================================ */

window.NUTRITION = {
  /* ---------- ארוחת בוקר — כריכים ---------- */
  "tuna-sandwich":          { kcal: 440, protein: 26, sugar: 3,  serving: "כריך שלם" },
  "cheese-cucumber":        { kcal: 255, protein: 15, sugar: 6,  serving: "כריך שלם" },
  "hard-egg-sandwich":      { kcal: 435, protein: 19, sugar: 3,  serving: "כריך שלם" },
  "avocado-sandwich":       { kcal: 330, protein: 8,  sugar: 3,  serving: "כריך שלם" },
  "yellow-cheese-sandwich": { kcal: 345, protein: 19, sugar: 3,  serving: "כריך שלם" },
  "bagel-cream-cheese":     { kcal: 375, protein: 12, sugar: 7,  serving: "בייגל שלם" },
  "pb-banana":              { kcal: 475, protein: 15, sugar: 23, serving: "כריך שלם" },
  "pita-cottage":           { kcal: 275, protein: 18, sugar: 6,  serving: "פיתה שלמה" },
  "toast-cheese":           { kcal: 350, protein: 19, sugar: 4,  serving: "טוסט שלם" },
  "jam-butter-roll":        { kcal: 265, protein: 6,  sugar: 14, serving: "לחמנייה שלמה" },

  /* ---------- ארוחת בוקר — לא כריכים ---------- */
  "egg-muffins":            { kcal: 220, protein: 17, sugar: 2,  serving: "2 מאפינס" },
  "banana-pancakes":        { kcal: 200, protein: 10, sugar: 12, serving: "3 פנקייקים קטנים" },
  "yogurt-granola":         { kcal: 270, protein: 12, sugar: 24, serving: "גביע עם תוספות" },
  "omelette-roll":          { kcal: 240, protein: 19, sugar: 2,  serving: "חביתה שלמה" },
  "cracker-bento":          { kcal: 330, protein: 13, sugar: 18, serving: "קופסה שלמה" },
  "mini-burekas":           { kcal: 410, protein: 13, sugar: 2,  serving: "2 בורקסים" },
  "oat-shake":              { kcal: 335, protein: 13, sugar: 26, serving: "כוס גדולה" },
  "corn-fritters":          { kcal: 260, protein: 8,  sugar: 6,  serving: "3 קציצות" },
  "pizza-buns":             { kcal: 380, protein: 18, sugar: 5,  serving: "2 חצאי לחמנייה" },
  "fruit-cheese-cubes":     { kcal: 280, protein: 13, sugar: 20, serving: "קופסה שלמה" },

  /* ---------- ארוחת צהריים — כריכים ---------- */
  "schnitzel-sandwich":     { kcal: 550, protein: 34, sugar: 4,  serving: "כריך שלם" },
  "chicken-breast-sandwich":{ kcal: 450, protein: 40, sugar: 3,  serving: "כריך שלם" },
  "turkey-pastrami":        { kcal: 295, protein: 24, sugar: 3,  serving: "כריך שלם" },
  "chicken-patty-pita":     { kcal: 430, protein: 31, sugar: 5,  serving: "פיתה שלמה" },
  "chicken-wrap":           { kcal: 520, protein: 37, sugar: 4,  serving: "רול שלם" },
  "caprese-sandwich":       { kcal: 590, protein: 29, sugar: 4,  serving: "באגט שלם" },
  "meatball-pita":          { kcal: 500, protein: 30, sugar: 5,  serving: "פיתה שלמה" },
  "omelette-sandwich":      { kcal: 350, protein: 18, sugar: 4,  serving: "כריך שלם" },
  "tuna-corn-baguette":     { kcal: 570, protein: 28, sugar: 7,  serving: "באגט שלם" },
  "cheese-veggie-wrap":     { kcal: 540, protein: 22, sugar: 6,  serving: "רול שלם" },

  /* ---------- ארוחת צהריים — מנות חמות ---------- */
  "pasta-tomato":           { kcal: 440, protein: 14, sugar: 9,  serving: "צלחת / תרמוס" },
  "pasta-broccoli-cream":   { kcal: 580, protein: 22, sugar: 6,  serving: "צלחת / תרמוס" },
  "fried-rice-chicken":     { kcal: 570, protein: 40, sugar: 4,  serving: "צלחת / תרמוס" },
  "chicken-patties-mash":   { kcal: 460, protein: 30, sugar: 3,  serving: "2 קציצות + פירה" },
  "lentil-soup":            { kcal: 280, protein: 15, sugar: 4,  serving: "תרמוס (1.5 כוסות)" },
  "schnitzelim-rice":       { kcal: 500, protein: 32, sugar: 2,  serving: "צלחת / תרמוס" },
  "baked-pasta":            { kcal: 480, protein: 24, sugar: 7,  serving: "ריבוע אחד" },
  "mini-lasagna":           { kcal: 420, protein: 24, sugar: 6,  serving: "2 יחידות" },
  "couscous-veg":           { kcal: 400, protein: 14, sugar: 8,  serving: "צלחת / תרמוס" },
  "mujadara":               { kcal: 450, protein: 14, sugar: 3,  serving: "צלחת / תרמוס" },

  /* ---------- יום שישי — פרוסות מתוקות ---------- */
  "cornflake-chocolate-slice": { kcal: 420, protein: 8,  sugar: 23, serving: "כריך שלם" },
  "choco-banana-slice":     { kcal: 465, protein: 8,  sugar: 35, serving: "כריך שלם" },
  "dulce-coconut-slice":    { kcal: 360, protein: 7,  sugar: 24, serving: "כריך שלם" },
  "pb-honey-slice":         { kcal: 415, protein: 14, sugar: 21, serving: "כריך שלם" },
  "challah-cinnamon":       { kcal: 460, protein: 8,  sugar: 30, serving: "2 פרוסות" },
  "white-choco-strawberry": { kcal: 435, protein: 8,  sugar: 28, serving: "כריך שלם" },
  "french-toast":           { kcal: 500, protein: 16, sugar: 14, serving: "2 פרוסות" },
  "cheese-honey-slice":     { kcal: 315, protein: 15, sugar: 20, serving: "כריך שלם" },
  "brioche-choc-chips":     { kcal: 485, protein: 10, sugar: 28, serving: "כריך שלם" },
  "jam-butter-slice":       { kcal: 270, protein: 6,  sugar: 19, serving: "כריך שלם" },

  /* ---------- יום שישי — פינוקים ---------- */
  "choc-chip-cookies":      { kcal: 220, protein: 3, sugar: 18, serving: "2 עוגיות" },
  "banana-choc-muffins":    { kcal: 280, protein: 4, sugar: 24, serving: "מאפין אחד" },
  "sweet-popcorn":          { kcal: 180, protein: 2, sugar: 12, serving: "2 כוסות" },
  "choco-balls":            { kcal: 240, protein: 3, sugar: 20, serving: "3 כדורים" },
  "brownies":               { kcal: 290, protein: 4, sugar: 26, serving: "ריבוע אחד" },
  "fruit-choc-skewers":     { kcal: 190, protein: 2, sugar: 22, serving: "2 שיפודים" },
  "yogurt-cup-cake":        { kcal: 240, protein: 4, sugar: 20, serving: "כוסית אחת" },
  "cornflake-clusters":     { kcal: 210, protein: 2, sugar: 22, serving: "3 גושים" },
  "marshmallow-pops":       { kcal: 180, protein: 1, sugar: 28, serving: "3 יחידות" },
  "butter-cookies":         { kcal: 230, protein: 3, sugar: 14, serving: "3 עוגיות" },
};
