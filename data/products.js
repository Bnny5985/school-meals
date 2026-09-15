/* ============================================================
   הקופסה — מדריך מוצרים
   ------------------------------------------------------------
   ⚠️  חשוב שתבין מה זה הקובץ הזה ומה הוא לא:
   זה מדריך *קטגוריות* מוצרים — מה לחפש ומה להימנע ממנו בסופר.
   זה לא רשימת מוצרים ספציפיים מאושרים, כי יצרנים משנים מתכונים
   בלי הודעה, וכל אישור כזה היה מתיישן תוך חודשיים.

   שדה barcode ריק בכוונה. אם תמלא ברקוד של מוצר שבדקת בעצמך,
   הסקריפט tools/refresh-prices.mjs יוכל למשוך אליו מחיר מעודכן,
   והאתר יציג קישור לבדיקת הרכיבים ב-Open Food Facts.

   status:
     "ok"    – הקטגוריה בדרך כלל בטוחה
     "check" – חייב לקרוא תווית, יש גרסאות מסוכנות
     "avoid" – הימנע לגמרי
   ============================================================ */

window.PRODUCTS = [
  /* ---------- לחמים ומאפים ---------- */
  {
    id: "bread-white", name: "לחם לבן פרוס", category: "לחמים",
    status: "check", barcode: "", price: null,
    look: "לחם אחיד לבן או לחם טוסט — בדרך כלל ללא ציפוי.",
    avoid: "לחמים כהים, כוסמין, מולטי־גריין ו׳לחם בריאות׳ — רבים מהם מפוזרים בשומשום או פשתן מעורבב בשומשום.",
    allergenRisk: ["sesame"],
  },
  {
    id: "bread-roll", name: "לחמניות רכות", category: "לחמים",
    status: "check", barcode: "", price: null,
    look: "לחמנייה חלקה, בלי זרעים על הקרום.",
    avoid: "לחמניות המבורגר מצופות שומשום — זו ברירת המחדל בישראל.",
    allergenRisk: ["sesame"],
  },
  {
    id: "pita", name: "פיתות", category: "לחמים",
    status: "check", barcode: "", price: null,
    look: "פיתה לבנה חלקה, ארוזה עם תווית רכיבים.",
    avoid: "פיתה עיראקית, לאפה עם זעתר, וכל פיתה עם ציפוי זרעים.",
    allergenRisk: ["sesame"],
  },
  {
    id: "bagel", name: "בייגל", category: "לחמים",
    status: "check", barcode: "", price: null,
    look: "׳בייגל חלק׳ או ׳בייגל רגיל׳ בלבד.",
    avoid: "בייגל מסורתי — מפוזר בשומשום כמעט תמיד. גם ׳בייגלה׳ ירושלמי.",
    allergenRisk: ["sesame"],
  },
  {
    id: "challah", name: "חלה", category: "לחמים",
    status: "check", barcode: "", price: null,
    look: "חלה חלקה בלי ציפוי, או בריוש כתחליף.",
    avoid: "חלה עם שומשום או פרג — הציפוי הסטנדרטי.",
    allergenRisk: ["sesame"],
  },
  {
    id: "tortilla", name: "טורטיות", category: "לחמים",
    status: "ok", barcode: "", price: null,
    look: "טורטיית חיטה רגילה — בדרך כלל נקייה.",
    avoid: "טורטיות ׳מולטי־גריין׳ עם זרעים.",
    allergenRisk: ["sesame"],
  },
  {
    id: "crackers", name: "קרקרים", category: "לחמים",
    status: "check", barcode: "", price: null,
    look: "קרקר מלוח קלאסי או ׳קרקר חלק׳.",
    avoid: "קרקרים עם זרעים, ׳קרקר בריאות׳ ומיני־בייגלה — מקור נפוץ מאוד לשומשום.",
    allergenRisk: ["sesame"],
  },
  {
    id: "breadcrumbs", name: "פירורי לחם", category: "לחמים",
    status: "check", barcode: "", price: null,
    look: "פירורי לחם לבנים רגילים, בלי תוספות.",
    avoid: "׳פירורים לשניצל מתובלים׳, פנקו בטעמים, ותערובות עם זעתר.",
    allergenRisk: ["sesame"],
  },

  /* ---------- ממרחים ---------- */
  {
    id: "spread-choc", name: "ממרח שוקולד", category: "ממרחים",
    status: "check", barcode: "", price: null,
    look: "ממרח שוקולד־קקאו שמצהיר במפורש ׳ללא אגוזים׳. קיימים כאלה בישראל.",
    avoid: "❌ נוטלה וכל ממרח על בסיס אגוזי לוז — אסורים לחלוטין. גם ממרחי פיסטוק ושקדים.",
    allergenRisk: ["hazelnut", "nutspread", "almond", "cashew", "pistachio", "walnut", "pecan"],
  },
  {
    id: "spread-pb", name: "חמאת בוטנים", category: "ממרחים",
    status: "ok", barcode: "", price: null,
    look: "׳חמאת בוטנים׳ עם רשימת רכיבים קצרה — בוטנים, מלח, אולי שמן. בוטנים מותרים.",
    avoid: "׳ממרח אגוזים משולב׳ שנראה כמעט זהה על המדף ומכיל שקדים, לוז, קשיו או אגוזי מלך.",
    allergenRisk: ["almond", "hazelnut", "cashew", "walnut", "pistachio", "nutspread"],
  },
  {
    id: "spread-tahini", name: "טחינה וממרחי שומשום", category: "ממרחים",
    status: "avoid", barcode: "", price: null,
    look: "—",
    avoid: "אסור לחלוטין. כולל טחינה גולמית, טחינה מוכנה, סילאן־טחינה וממרחי חלבה.",
    allergenRisk: ["tahini", "sesame", "halva"],
  },
  {
    id: "spread-hummus", name: "חומוס מוכן", category: "ממרחים",
    status: "avoid", barcode: "", price: null,
    look: "רק חומוס ביתי שהוכן ללא טחינה.",
    avoid: "כל חומוס מסחרי — טחינה היא מרכיב סטנדרטי בו.",
    allergenRisk: ["tahini", "sesame"],
  },
  {
    id: "spread-jam", name: "ריבות", category: "ממרחים",
    status: "ok", barcode: "", price: null,
    look: "ריבת פירות רגילה.",
    avoid: "ריבות ׳פרימיום׳ עם תוספת אגוזים או שקדים.",
    allergenRisk: ["almond", "walnut", "pecan"],
  },
  {
    id: "spread-cream", name: "גבינת שמנת וקרם צ׳יז", category: "ממרחים",
    status: "ok", barcode: "", price: null,
    look: "גבינת שמנת רגילה או בטעם עשבי תיבול.",
    avoid: "גבינות בטעם זעתר — תערובות זעתר מכילות שומשום כמעט תמיד.",
    allergenRisk: ["sesame"],
  },

  /* ---------- חלב וביצים ---------- */
  {
    id: "dairy-cheese", name: "גבינות לבנות וצהובות", category: "מוצרי חלב",
    status: "ok", barcode: "", price: null,
    look: "גבינה לבנה, קוטג׳, בולגרית, מוצרלה, גבינה צהובה.",
    avoid: "גבינות בשמן זית עם תערובת זעתר.",
    allergenRisk: ["sesame"],
  },
  {
    id: "dairy-yogurt", name: "יוגורט", category: "מוצרי חלב",
    status: "ok", barcode: "", price: null,
    look: "יוגורט טבעי, ביו או בטעם פירות.",
    avoid: "יוגורטים עם תוספת גרנולה, שקדים או אגוזים בכיסוי הנפרד.",
    allergenRisk: ["almond", "walnut", "pecan", "cashew", "hazelnut"],
  },
  {
    id: "eggs", name: "ביצים", category: "מוצרי חלב",
    status: "ok", barcode: "", price: null,
    look: "כל ביצה.",
    avoid: "—",
    allergenRisk: [],
  },

  /* ---------- דגנים וחטיפים ---------- */
  {
    id: "cereal-cornflakes", name: "קורנפלקס", category: "דגנים",
    status: "check", barcode: "", price: null,
    look: "קורנפלקס קלאסי — תירס, סוכר, מלח.",
    avoid: "׳קורנפלקס דבש ואגוזים׳, מוזלי וכל גרסה ׳בטעמים׳ — שקדים נפוצים בהן מאוד.",
    allergenRisk: ["almond", "walnut", "pecan", "cashew", "sesame"],
  },
  {
    id: "cereal-granola", name: "גרנולה", category: "דגנים",
    status: "avoid", barcode: "", price: null,
    look: "רק גרנולה שמצהירה במפורש ׳ללא אגוזים וללא שומשום׳ — נדיר מאוד.",
    avoid: "כמעט כל גרנולה מסחרית מכילה שקדים, לוז, אגוזי מלך, פקאן, קשיו או שומשום. שקדים הם המרכיב הנפוץ ביותר.",
    allergenRisk: ["almond", "hazelnut", "walnut", "pecan", "cashew", "pistachio", "sesame"],
  },
  {
    id: "cereal-oats", name: "שיבולת שועל (קוואקר)", category: "דגנים",
    status: "ok", barcode: "", price: null,
    look: "קוואקר רגיל — מרכיב יחיד.",
    avoid: "׳דייסה אינסטנט בטעמים׳ עם אגוזים או שקדים.",
    allergenRisk: ["almond", "walnut", "pecan"],
  },
  {
    id: "snack-bars", name: "חטיפי אנרגיה ובריאות", category: "חטיפים",
    status: "avoid", barcode: "", price: null,
    look: "—",
    avoid: "כמעט כולם מכילים שקדים, אגוזים, טחינה או שומשום. עדיף פינוק ביתי מהאתר.",
    allergenRisk: ["almond", "hazelnut", "walnut", "pecan", "cashew", "pistachio", "sesame", "tahini", "halva"],
  },
  {
    id: "snack-bamba", name: "במבה וחטיפי בוטנים", category: "חטיפים",
    status: "ok", barcode: "", price: null,
    look: "בוטנים מותרים בבית הספר שלכם.",
    avoid: "׳במבה ממולאת׳ בטעמים — בדוק תווית.",
    allergenRisk: [],
  },
  {
    id: "snack-bissli", name: "ביסלי ומלוחים", category: "חטיפים",
    status: "check", barcode: "", price: null,
    look: "טעמים בסיסיים.",
    avoid: "׳ביסלי בגריל׳ וטעמים מזרחיים — חלקם מכילים שומשום.",
    allergenRisk: ["sesame"],
  },

  /* ---------- שימורים ורטבים ---------- */
  {
    id: "canned-tuna", name: "טונה", category: "שימורים",
    status: "ok", barcode: "", price: null,
    look: "טונה בשמן, במים או בשמן זית.",
    avoid: "׳טונה בתיבול מזרחי׳ — עלולה להכיל שמן שומשום.",
    allergenRisk: ["sesame"],
  },
  {
    id: "canned-corn", name: "תירס", category: "שימורים",
    status: "ok", barcode: "", price: null,
    look: "תירס גרעינים במים.",
    avoid: "—",
    allergenRisk: [],
  },
  {
    id: "sauce-soy", name: "רוטב סויה", category: "רטבים",
    status: "check", barcode: "", price: null,
    look: "רוטב סויה בסיסי — סויה, חיטה, מלח, מים.",
    avoid: "׳טריאקי׳, ׳סויה מתובל׳, ׳רוטב לאורז מוקפץ׳ — מכילים שמן שומשום לעיתים קרובות.",
    allergenRisk: ["sesame"],
  },
  {
    id: "sauce-pesto", name: "פסטו", category: "רטבים",
    status: "check", barcode: "", price: null,
    look: "פסטו שמצהיר על צנוברים בלבד.",
    avoid: "פסטו זול — יצרנים רבים מחליפים צנוברים בקשיו או בשקדים.",
    allergenRisk: ["cashew", "almond"],
  },
  {
    id: "sauce-mayo", name: "מיונז וחרדל", category: "רטבים",
    status: "ok", barcode: "", price: null,
    look: "מיונז וחרדל רגילים.",
    avoid: "׳רוטב לסלט מזרחי׳ ורטבים על בסיס טחינה.",
    allergenRisk: ["tahini", "sesame"],
  },
  {
    id: "oil-cooking", name: "שמן לבישול", category: "רטבים",
    status: "check", barcode: "", price: null,
    look: "שמן קנולה, חמניות או זית.",
    avoid: "❌ שמן שומשום — נפוץ במטבחים ואסור לחלוטין.",
    allergenRisk: ["sesame"],
  },

  /* ---------- תבלינים ---------- */
  {
    id: "spice-zaatar", name: "זעתר ותערובות מזרחיות", category: "תבלינים",
    status: "avoid", barcode: "", price: null,
    look: "—",
    avoid: "זעתר מכיל שומשום כרכיב עיקרי. גם ׳תבלין לפלאפל׳ ו׳בהרט׳ מסוימים.",
    allergenRisk: ["sesame"],
  },
  {
    id: "spice-basic", name: "תבלינים בסיסיים", category: "תבלינים",
    status: "ok", barcode: "", price: null,
    look: "פפריקה, כמון, כורכום, אורגנו, קינמון, אגוז מוסקט.",
    avoid: "—",
    allergenRisk: [],
    note: "׳אגוז מוסקט׳ הוא תבלין מקליפת פרי, לא אגוז עץ. הוא בטוח לחלוטין.",
  },

  /* ---------- שוקולד ואפייה ---------- */
  {
    id: "choc-bar", name: "שוקולד וטבלאות", category: "אפייה",
    status: "check", barcode: "", price: null,
    look: "שוקולד מריר או חלב פשוט, בלי מילוי.",
    avoid: "טבלאות עם שקדים או לוז (נפוצות מאוד), ומוצרים ששורת ׳עלול להכיל׳ מזכירה אגוזי עץ.",
    allergenRisk: ["almond", "hazelnut", "cashew", "pistachio", "walnut", "pecan"],
  },
  {
    id: "choc-chips", name: "שוקולד צ׳יפס", category: "אפייה",
    status: "check", barcode: "", price: null,
    look: "שוקולד צ׳יפס רגיל.",
    avoid: "בדוק תמיד את שורת ׳עלול להכיל׳ — פסי ייצור משותפים עם שקדים ולוז נפוצים מאוד.",
    allergenRisk: ["almond", "hazelnut", "cashew", "pistachio", "walnut", "pecan"],
  },
  {
    id: "coconut", name: "קוקוס טחון", category: "אפייה",
    status: "ok", barcode: "", price: null,
    look: "קוקוס טחון רגיל.",
    avoid: "—",
    allergenRisk: [],
    note: "קוקוס אינו קשור בוטנית לשקדים, לוז, פיסטוק, קשיו, אגוזי מלך, פקאן או מקדמיה.",
  },
  {
    id: "nuts-mix", name: "פיצוחים ותערובות אגוזים", category: "אפייה",
    status: "avoid", barcode: "", price: null,
    look: "—",
    avoid: "כל תערובת פיצוחים — היא מכילה כמעט תמיד שקדים, קשיו, פיסטוק, אגוזי מלך, פקאן או מקדמיה.",
    allergenRisk: ["almond", "macadamia", "cashew", "pistachio", "walnut", "pecan", "hazelnut"],
  },

  /* ---------- פירות ---------- */
  {
    id: "fruit-fresh", name: "פירות טריים", category: "פירות",
    status: "check", barcode: "", price: null,
    look: "תפוח, בננה, ענבים, מלון, אבטיח, תות, אגס, אפרסק — כולם בטוחים.",
    avoid: "❌ קיווי אסור. היזהר גם מסלטי פירות מוכנים וממנות פרי קצוצות בסופר — קיווי הוא מרכיב נפוץ בהם.",
    allergenRisk: ["kiwi"],
  },
  {
    id: "fruit-dried", name: "פירות יבשים ומיובשים", category: "פירות",
    status: "check", barcode: "", price: null,
    look: "צימוקים, משמש מיובש ותמרים כשהם ארוזים לבד.",
    avoid: "תערובות ׳פירות יבשים ואגוזים׳, וחטיפי פרי שמיוצרים בפס משותף עם שקדים.",
    allergenRisk: ["almond", "cashew", "walnut", "hazelnut"],
  },

  /* ---------- משקאות ---------- */
  {
    id: "milk-alt", name: "משקאות צמחיים", category: "מוצרי חלב",
    status: "check", barcode: "", price: null,
    look: "משקה שיבולת שועל, אורז או סויה.",
    avoid: "❌ חלב שקדים, חלב לוז וחלב קשיו — אסורים. הם נראים על המדף בדיוק כמו השאר.",
    allergenRisk: ["almond", "hazelnut", "cashew", "macadamia"],
  },
];
