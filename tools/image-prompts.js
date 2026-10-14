/* ============================================================
   הקופסה — פרומפטים ליצירת התמונות
   ------------------------------------------------------------
   סגנון אחיד לפי תמונת הייחוס: צלחת קרמיקה לבנה, רקע אפור בהיר
   חלק, תאורת סטודיו רכה משמאל למעלה, צל עדין, זווית מוגבהת
   שלושת־רבעי, פוקוס חד, צילום מוצר מסחרי.

   ⚠️  ה-NEGATIVE כאן הוא לא קישוט — הוא שכבת הבטיחות.
   מודלים ליצירת תמונות מוסיפים שומשום ללחם כמעט אוטומטית,
   ואגוזים לקינוחים. בלי הרשימה הזו יתקבלו תמונות שסותרות
   את כל מטרת האתר.
   ============================================================ */

/* הרקע תואם ל-var(--bg2) של האתר: #F4F1EA — קרם חמים.
   כך התמונות מתמזגות בכרטיסים העגולים במקום ליצור ריבוע אפור בולט. */
const STYLE =
  "editorial food photography, photorealistic, shot on Canon EOS R5 with 100mm macro lens, " +
  "served on a plain white ceramic plate, " +
  "soft neutral off-white cream backdrop with a very subtle gradient, desaturated warm ivory, " +
  "soft directional window light from the upper left, gentle falloff, realistic soft shadow under the plate, " +
  "slightly elevated three-quarter camera angle, shallow depth of field, crisp texture detail, " +
  "appetizing, fresh, clean minimal food styling, natural realistic food colors, f/4, high resolution";

/* ⚠️ ממצא חשוב מהריצה הראשונה:
   Flux schnell מחייב cfg=1.0, ובערך הזה המודל *מתעלם מה-negative prompt*.
   הרשימה למטה כמעט חסרת השפעה — היא נשארת רק למקרה שתעבור למודל
   שתומך ב-CFG (למשל Flux dev ב-cfg 3.5).
   שכבת הבטיחות האמיתית היא CLEAN למטה, שנכנסת לפרומפט החיובי. */
const NEG =
  "sesame seeds, poppy seeds, seeded bread, seeded crust, seeds on top, grains on crust, " +
  "nuts, almonds, walnuts, pecans, hazelnuts, pistachios, cashews, macadamia, chopped nuts, " +
  "nut topping, nutella, tahini, hummus, halva, kiwi, kiwi slices, "
  + "cold blue tint, grey background, stark white background, " +
  "text, letters, words, watermark, logo, signature, hands, people, fingers, " +
  "cluttered, messy, crumbs everywhere, dark, moody, blurry, out of focus, " +
  "cartoon, illustration, drawing, 3d render, plastic, artificial, low quality, deformed";

/* תיאור הנושא לכל מנה. זה החלק שמשתנה — הסגנון קבוע. */
/* הערה: pasta-broccoli-cream נבחר ידנית מ-seed 333 — המודל נטה
   להוסיף גרנישׁ חום לרוטב הלבן בסידים אחרים. אם תייצר מחדש, בדוק את התוצאה. */
const SUBJECTS = {
  /* ---------- ארוחת בוקר — כריכים ---------- */
  "tuna-sandwich": "a tuna salad sandwich made with two square slices of smooth plain white sandwich bread with crisp green lettuce and tomato slices, filling visible at the edge",
  "tuna-corn-sandwich": "a sandwich cut in half made with two square slices of smooth plain white sandwich bread, filled with creamy tuna salad mixed with bright yellow sweet corn kernels, a crisp green lettuce leaf, the yellow corn clearly visible in the filling at the cut edge",
  "tuna-toast": "a pressed grilled toast sandwich cut diagonally in half, golden brown crispy plain white bread with grill marks, filled with tuna salad and thin tomato slices visible at the cut edge",
  "cheese-corn-toast": "a pressed grilled toast sandwich cut diagonally in half, golden brown crispy plain white bread with grill marks, filled with melted gooey yellow cheese and bright yellow sweet corn kernels oozing at the cut edge",
  "cheese-cucumber": "an open sandwich on smooth soft white bread spread with thick white cheese, topped with thin cucumber slices",
  "hard-egg-sandwich": "an egg salad sandwich on smooth plain white bread, creamy yellow egg filling with green onion visible",
  "avocado-sandwich": "an open sandwich on smooth plain bread with thick mashed green avocado and two tomato slices, sprinkled with salt",
  "yellow-cheese-sandwich": "a sandwich on smooth plain white bread with two slices of yellow cheese and a green lettuce leaf",
  "bagel-cream-cheese": "a plain smooth bagel with no seeds, sliced open, thick cream cheese and tomato slices, dill sprinkled",
  "pb-banana": "a sandwich on smooth plain bread with peanut butter and neat banana slices in a single layer",
  "pita-cottage": "a plain smooth pita pocket filled with white cottage cheese and diced cucumber and tomato",
  "toast-cheese": "a golden grilled cheese toastie on smooth plain bread, cut diagonally, melted cheese stretching",
  "jam-butter-roll": "a soft smooth plain bread roll sliced open with butter and red strawberry jam",

  /* ---------- ארוחת בוקר — לא כריכים ---------- */
  "egg-muffins": "three small baked egg muffins with red pepper and green onion, golden tops, in paper cups",
  "banana-pancakes": "a small stack of three golden banana pancakes, dusted lightly, no toppings",
  "yogurt-granola": "a glass cup of white yogurt layered with fresh strawberries and blueberries, plain oat clusters on the side",
  "omelette-roll": "sliced rolled omelette pinwheels showing green and red vegetable specks, arranged in a row",
  "cracker-bento": "a bento box with plain smooth crackers, yellow cheese cubes, green grapes, baby carrots and cherry tomatoes in separate compartments",
  "mini-burekas": "two golden puff pastry triangles filled with white cheese, smooth glazed tops with no seeds",
  "oat-shake": "a tall glass of creamy pale banana oat smoothie with a straw",
  "corn-fritters": "three golden corn fritters with visible yellow corn kernels and green onion",
  "pizza-buns": "two mini pizzas on smooth plain bun halves with melted cheese and tomato sauce, oregano sprinkled",
  "fruit-cheese-cubes": "a bowl of cubed melon, watermelon, green grapes and white cheese cubes, fresh mint leaf",

  /* ---------- צהריים — כריכים ---------- */
  "schnitzel-sandwich": "a breaded golden chicken schnitzel sandwich in a smooth plain bun with lettuce, tomato and pickle",
  "chicken-breast-sandwich": "a sandwich on smooth plain bread with sliced roasted chicken breast, lettuce and tomato",
  "turkey-pastrami": "a sandwich on smooth plain bread with folded turkey pastrami slices, mustard and pickle spears",
  "chicken-patty-pita": "a plain smooth pita filled with two golden chicken patties and chopped fresh vegetable salad",
  "chicken-wrap": "a tortilla wrap cut diagonally showing sliced chicken, lettuce, tomato and cucumber filling",
  "caprese-sandwich": "a smooth ciabatta sandwich with fresh white mozzarella slices, red tomato and green basil leaves, drizzled olive oil",
  "meatball-pita": "a plain smooth pita filled with browned beef meatballs and chopped vegetable salad",
  "omelette-sandwich": "a smooth plain bread roll filled with a folded vegetable omelette, lettuce and tomato",
  "tuna-corn-baguette": "a smooth plain baguette sliced open and filled with tuna salad mixed with yellow corn, lettuce underneath",
  "cheese-veggie-wrap": "a tortilla wrap cut into pinwheel slices showing cream cheese, yellow cheese, grated carrot and red pepper",

  /* ---------- צהריים — מנות חמות ---------- */
  "pasta-tomato": "a bowl of short penne pasta in rich red tomato sauce, fresh basil leaf on top",
  "pasta-broccoli-cream": "a simple bowl of plain penne pasta and steamed green broccoli florets lightly coated in a pure white cream sauce, the dish is completely plain and unseasoned, a perfectly smooth white sauce with no specks and no garnish whatsoever",
  "fried-rice-chicken": "a bowl of fried rice with diced chicken, green peas, carrot and scrambled egg, spring onion on top",
  "chicken-patties-mash": "two golden chicken patties beside a mound of creamy mashed potato, parsley sprinkled",
  "lentil-soup": "a bowl of thick orange lentil soup, steam rising, a swirl on the surface",
  "schnitzelim-rice": "golden breaded chicken nuggets beside fluffy white rice on a plate",
  "baked-pasta": "a square slice of baked pasta casserole with melted golden cheese crust, red sauce visible inside",
  "mini-lasagna": "two small individual lasagna cups with layers of pasta, red sauce and melted cheese, green spinach visible",
  "couscous-veg": "a plate of fluffy yellow couscous topped with stewed carrot, zucchini, pumpkin and chickpeas",
  "mujadara": "a plate of rice and brown lentils topped with golden crispy fried onions",

  /* ---------- יום שישי — פרוסות מתוקות ---------- */
  "cornflake-chocolate-slice": "a slice of smooth plain white bread spread thickly with glossy chocolate spread, golden cornflakes pressed on top",
  "choco-banana-slice": "a slice of smooth plain white bread with chocolate spread and neat banana slices arranged on top",
  "dulce-coconut-slice": "a slice of smooth plain bread spread with caramel dulce de leche and sprinkled with white shredded coconut",
  "pb-honey-slice": "a slice of smooth plain bread with peanut butter and a honey drizzle zigzag on top",
  "challah-cinnamon": "two slices of smooth glazed challah bread with butter and cinnamon sugar, no seeds on crust",
  "white-choco-strawberry": "a slice of smooth plain white bread with white chocolate spread and fresh sliced strawberries",
  "french-toast": "two golden slices of french toast dusted with powdered sugar, lightly caramelized surface",
  "cheese-honey-slice": "a slice of smooth plain bread with thick white cheese spread and a honey drizzle, cinnamon dusted",
  "brioche-choc-chips": "a warm smooth brioche slice with melting chocolate chips scattered on top",
  "jam-butter-slice": "a slice of smooth plain white bread with butter and glossy red strawberry jam",

  /* ---------- יום שישי — פינוקים ---------- */
  "choc-chip-cookies": "three golden chocolate chip cookies with melted chocolate chips, soft chewy centers",
  "banana-choc-muffins": "two banana chocolate chip muffins in paper cups with domed golden tops",
  "sweet-popcorn": "a bowl of glossy caramel coated popcorn, golden and airy",
  "choco-balls": "four round chocolate biscuit balls coated in white shredded coconut and colorful sprinkles",
  "brownies": "two dark fudgy brownie squares with a crackly top, cut cleanly",
  "fruit-choc-skewers": "three fruit skewers with strawberries, banana and grapes half dipped in dark chocolate with colorful sprinkles",
  "yogurt-cup-cake": "a small golden yogurt cupcake in a paper cup, soft domed top",
  "cornflake-clusters": "four golden honey cornflake clusters, glossy and crunchy, in paper cups",
  "marshmallow-pops": "three marshmallows on sticks half dipped in chocolate with colorful sprinkles",
  "butter-cookies": "four decorated butter cookies in star and heart shapes with colorful sprinkles",
};

/* ---------- תמונות ראשיות ---------- */
const HERO = {
  "banner": {
    w: 1216, h: 912, out: [1200, 900],
    subject:
      "an open school lunchbox neatly packed with a sandwich on smooth plain white bread, " +
      "cherry tomatoes, cucumber sticks and green grapes, arranged tidily, " +
      "standing alone on a completely clean bare light wooden table, the table around the box is " +
      "spotless and empty with absolutely nothing else on it, seen from a slightly elevated angle",
  },
  "cat-breakfast": {
    w: 1216, h: 684, out: [800, 450],
    subject: "an overhead flat lay of three finished sandwiches on smooth plain white bread with cucumber, tomato and white cheese, arranged neatly and filling the frame, morning light",
  },
  "cat-lunch": {
    w: 1216, h: 684, out: [800, 450],
    subject: "an open stainless steel food thermos filled with pasta in tomato sauce beside a packed lunch container, warm light",
  },
  "cat-friday": {
    w: 1216, h: 684, out: [800, 450],
    subject: "a slice of smooth plain bread with glossy chocolate spread and golden cornflakes on top beside small homemade cookies",
  },
  "head-breakfast": {
    w: 1536, h: 400, out: [1920, 500],
    subject: "a wide clean banner of a bright empty white kitchen counter, one glass of orange juice standing far on the right edge and three whole red tomatoes on the far left edge, the entire centre of the frame is an empty clean bare counter surface, completely spotless with nothing scattered anywhere, very shallow depth of field",
  },
  "head-lunch": {
    w: 1536, h: 400, out: [1920, 500],
    subject: "a wide clean banner of a kitchen counter with a closed stainless steel thermos far on the right, large empty space in the centre, a bare uncluttered counter surface, very shallow depth of field",
  },
  "head-friday": {
    w: 1536, h: 400, out: [1920, 500],
    subject: "a wide clean banner of a kitchen counter with two plain round chocolate chip cookies far on the right and fresh strawberries on the left, large empty space in the centre, a bare uncluttered counter, very shallow depth of field",
  },
};

/* ============================================================
   שכבת הבטיחות האמיתית — נכנסת לפרומפט החיובי של *כל* תמונה.
   נוסחה בשפה חיובית ("completely plain and bare") כי מודלים
   מתמודדים גרוע עם שלילה ("no nuts") ומצוין עם תיאור חיובי.
   ============================================================ */
const CLEAN =
  "the food is completely plain and bare with a smooth clean surface, " +
  "absolutely nothing scattered on top or around it, no garnish, no toppings, " +
  "no seeds, no grains, no nuts of any kind, nothing sprinkled on the plate or the table";

/* מאפים מתוקים — המקום שבו המודל הכי נוטה להוסיף אגוזים */
const SWEET_EXTRA =
  ", a bare untopped surface, nothing decorating the top";

/* לחמים — המקום שבו המודל הכי נוטה להוסיף זרעים */
const BREAD_EXTRA =
  ", the bread is soft plain white sandwich bread with a completely smooth bare crust";

function buildAll() {
  const jobs = [];

  for (const [id, subject] of Object.entries(SUBJECTS)) {
    const sweet = /slice|cookie|muffin|brownie|popcorn|choco|marshmallow|cornflake|cake|skewer|french-toast|challah|granola|dulce/.test(id);
    const bready = /sandwich|slice|toast|bagel|pita|roll|baguette|challah|brioche|wrap/.test(id);
    jobs.push({
      id,
      file: `assets/img/meals/${id}.jpg`,
      w: 1024, h: 1024, out: [800, 800],
      positive:
        `${subject}${sweet ? SWEET_EXTRA : ""}${bready ? BREAD_EXTRA : ""}, ` +
        `${CLEAN}, ${STYLE}`,
      negative: NEG,
    });
  }

  for (const [name, h] of Object.entries(HERO)) {
    jobs.push({
      id: name,
      file: `assets/img/hero/${name}.jpg`,
      w: h.w, h: h.h, out: h.out,
      positive: `${h.subject}, ${CLEAN}, ${STYLE}`,
      negative: NEG,
    });
  }

  return jobs;
}

module.exports = { STYLE, NEG, SUBJECTS, HERO, buildAll };
