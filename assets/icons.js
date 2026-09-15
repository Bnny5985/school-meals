/* ============================================================
   הקופסה — ספריית איורים וקטוריים (SVG sprite)
   נטען כ-JS כדי שיעבוד גם בפתיחה מקומית (file://) וגם ב-GitHub Pages.
   שימוש:  Icons.use('sandwich')  ->  מחזיר <svg><use .../></svg>
   ============================================================ */
(function () {
  const S = (id, body) => `<symbol id="i-${id}" viewBox="0 0 64 64">${body}</symbol>`;

  /* --- צבעים משותפים --- */
  const CRUST = '#e0a35c', BREAD = '#f7dfb0', BREAD2 = '#fbeed3';
  const CHEESE = '#fbbf24', TOM = '#ef4444', LET = '#5cc47c', LET2 = '#3ba05e';
  const CHOC = '#7b4a2d', CHOC2 = '#a56b43', CREAM = '#fff8ec';
  const MEAT = '#c97b4e', YOLK = '#f9c22e', PLATE = '#e8e2d6';

  const ICONS = {
    /* ---------- קטגוריות ---------- */
    sun: `<circle cx="32" cy="32" r="13" fill="${YOLK}"/>
      <g stroke="#f59e0b" stroke-width="4" stroke-linecap="round">
      <path d="M32 6v7M32 51v7M6 32h7M51 32h7M13.6 13.6l5 5M45.4 45.4l5 5M50.4 13.6l-5 5M18.6 45.4l-5 5"/></g>`,

    bowl: `<path d="M8 28h48c0 14-10.7 24-24 24S8 42 8 28z" fill="#4a90d9"/>
      <path d="M8 28h48v3a3 3 0 0 1-3 3H11a3 3 0 0 1-3-3z" fill="#357abd"/>
      <path d="M14 34h36c-1.5 8-8.8 14-18 14s-16.5-6-18-14z" fill="#7fb8ea"/>
      <path d="M22 20c0-4-4-4-4-8M32 18c0-4-4-4-4-8M42 20c0-4-4-4-4-8"
        stroke="#c7d9e8" stroke-width="3" stroke-linecap="round" fill="none"/>`,

    star: `<path d="M32 7l7.6 15.4 17 2.5-12.3 12 2.9 16.9L32 45.8 16.8 53.8l2.9-16.9-12.3-12 17-2.5z"
      fill="#a78bfa"/><path d="M32 14.5l5.2 10.6 11.7 1.7-8.5 8.3 2 11.6L32 41.2z" fill="#c4b5fd"/>`,

    /* ---------- כריכים ---------- */
    sandwich: `<path d="M8 40l24-26 24 26z" fill="${BREAD}"/>
      <path d="M8 40h48l-3.5 6a4 4 0 0 1-3.5 2H15a4 4 0 0 1-3.5-2z" fill="${CRUST}"/>
      <path d="M15 33h34l-3-3H18z" fill="${LET}"/>
      <path d="M19 27h26l-3.5-4h-19z" fill="${CHEESE}"/>`,

    'sandwich-fish': `<path d="M8 40l24-26 24 26z" fill="${BREAD}"/>
      <path d="M8 40h48l-3.5 6a4 4 0 0 1-3.5 2H15a4 4 0 0 1-3.5-2z" fill="${CRUST}"/>
      <path d="M15 33h34l-3-3H18z" fill="${LET}"/>
      <ellipse cx="30" cy="26" rx="9" ry="4.5" fill="#d9a273"/>
      <path d="M39 26l6-4v8z" fill="#c08a5c"/><circle cx="26" cy="25" r="1.3" fill="#5c4433"/>`,

    'sandwich-cheese': `<path d="M8 40l24-26 24 26z" fill="${BREAD}"/>
      <path d="M8 40h48l-3.5 6a4 4 0 0 1-3.5 2H15a4 4 0 0 1-3.5-2z" fill="${CRUST}"/>
      <path d="M16 33h32l-4-8H20z" fill="${CHEESE}"/>
      <circle cx="26" cy="29" r="2" fill="#e09612"/><circle cx="37" cy="30" r="1.6" fill="#e09612"/>
      <path d="M14 36h36l-2-3H16z" fill="${LET}"/>`,

    'sandwich-egg': `<path d="M8 40l24-26 24 26z" fill="${BREAD}"/>
      <path d="M8 40h48l-3.5 6a4 4 0 0 1-3.5 2H15a4 4 0 0 1-3.5-2z" fill="${CRUST}"/>
      <ellipse cx="26" cy="29" rx="7" ry="5.5" fill="${CREAM}"/>
      <circle cx="26" cy="29" r="3" fill="${YOLK}"/>
      <ellipse cx="39" cy="31" rx="6" ry="4.5" fill="${CREAM}"/>
      <circle cx="39" cy="31" r="2.4" fill="${YOLK}"/>`,

    'sandwich-avocado': `<path d="M8 40l24-26 24 26z" fill="${BREAD}"/>
      <path d="M8 40h48l-3.5 6a4 4 0 0 1-3.5 2H15a4 4 0 0 1-3.5-2z" fill="${CRUST}"/>
      <path d="M15 34h34l-4-9H19z" fill="#8fc866"/>
      <ellipse cx="32" cy="29" rx="5" ry="4" fill="#c8e6a0"/>
      <ellipse cx="32" cy="29" rx="2.2" ry="1.8" fill="#8b5e34"/>`,

    bagel: `<circle cx="32" cy="32" r="23" fill="${CRUST}"/>
      <circle cx="32" cy="32" r="23" fill="none" stroke="#c98a45" stroke-width="2"/>
      <circle cx="32" cy="32" r="8" fill="#fdf6e8"/>
      <path d="M14 32a18 18 0 0 1 36 0" fill="none" stroke="#eab77a" stroke-width="4" stroke-linecap="round"/>
      <circle cx="22" cy="22" r="1.6" fill="#fff3d6"/><circle cx="43" cy="24" r="1.6" fill="#fff3d6"/>
      <circle cx="32" cy="16" r="1.6" fill="#fff3d6"/><circle cx="46" cy="38" r="1.6" fill="#fff3d6"/>`,

    'sandwich-banana': `<path d="M8 40l24-26 24 26z" fill="${BREAD}"/>
      <path d="M8 40h48l-3.5 6a4 4 0 0 1-3.5 2H15a4 4 0 0 1-3.5-2z" fill="${CRUST}"/>
      <path d="M16 34h32l-3-7H19z" fill="#c98a5b"/>
      <circle cx="24" cy="30" r="3.4" fill="#fde68a"/><circle cx="32" cy="31" r="3.4" fill="#fde68a"/>
      <circle cx="40" cy="30" r="3.4" fill="#fde68a"/>`,

    pita: `<path d="M6 34a26 20 0 0 1 52 0v4a4 4 0 0 1-4 4H10a4 4 0 0 1-4-4z" fill="${BREAD}"/>
      <path d="M12 32a20 14 0 0 1 40 0z" fill="${CRUST}" opacity=".45"/>
      <path d="M14 30c4-5 10-7 18-7s14 2 18 7" fill="none" stroke="#e8c692" stroke-width="2.5" stroke-linecap="round"/>
      <circle cx="24" cy="34" r="3.4" fill="${LET}"/><circle cx="33" cy="35" r="3.4" fill="${TOM}"/>
      <circle cx="42" cy="34" r="3.4" fill="${CHEESE}"/>`,

    toast: `<path d="M14 22a8 8 0 0 1 16 0h4a8 8 0 0 1 16 0v24a4 4 0 0 1-4 4H18a4 4 0 0 1-4-4z" fill="${BREAD}"/>
      <path d="M20 26h24v18H20z" fill="${CHEESE}"/>
      <path d="M22 30h20M22 36h20" stroke="#e09612" stroke-width="2.5" stroke-linecap="round"/>`,

    jam: `<path d="M22 12h20v6l4 5v27a4 4 0 0 1-4 4H22a4 4 0 0 1-4-4V23l4-5z" fill="#f472b6"/>
      <path d="M18 24h28v6H18z" fill="#fff" opacity=".35"/>
      <rect x="20" y="8" width="24" height="6" rx="2" fill="#be185d"/>
      <circle cx="28" cy="38" r="3" fill="#fbcfe8"/><circle cx="37" cy="42" r="2.4" fill="#fbcfe8"/>`,

    wrap: `<path d="M18 10h22l10 12-10 32H22L14 22z" fill="${BREAD2}"/>
      <path d="M18 10h22l10 12H14z" fill="${BREAD}"/>
      <path d="M20 26h26l-2 8H21z" fill="${LET}"/>
      <path d="M22 36h22l-2 8H23z" fill="${MEAT}"/>
      <path d="M24 46h18l-1.5 6H25z" fill="${TOM}"/>`,

    baguette: `<path d="M10 46c-3-3-3-8 2-13L38 9c5-5 11-5 15-1s4 10-1 15L26 48c-5 5-13 3-16-2z" fill="${CRUST}"/>
      <g stroke="#fbeed3" stroke-width="3" stroke-linecap="round">
      <path d="M23 33l6 6M30 26l6 6M37 19l6 6"/></g>`,

    schnitzel: `<path d="M12 34c0-12 9-20 20-20s20 8 20 20-9 16-20 16-20-4-20-16z" fill="#e0a054"/>
      <path d="M17 34c0-9 7-15 15-15s15 6 15 15-7 12-15 12-15-3-15-12z" fill="#f0b96e"/>
      <g fill="#c98038"><circle cx="26" cy="28" r="1.7"/><circle cx="35" cy="26" r="1.7"/>
      <circle cx="31" cy="35" r="1.7"/><circle cx="40" cy="34" r="1.7"/><circle cx="22" cy="37" r="1.7"/></g>`,

    chicken: `<path d="M20 24c0-7 5-12 12-12s12 5 12 12v6H20z" fill="#f0c48a"/>
      <path d="M16 30h32v10c0 6-7 10-16 10s-16-4-16-10z" fill="${MEAT}"/>
      <path d="M22 34h20v5H22z" fill="#e09a6a" opacity=".6"/>`,

    deli: `<circle cx="32" cy="32" r="20" fill="#e57e7e"/>
      <circle cx="32" cy="32" r="20" fill="none" stroke="#c95f5f" stroke-width="2.5"/>
      <circle cx="25" cy="26" r="3" fill="#fbe3e3"/><circle cx="39" cy="30" r="2.4" fill="#fbe3e3"/>
      <circle cx="30" cy="39" r="2.8" fill="#fbe3e3"/><circle cx="40" cy="40" r="2" fill="#fbe3e3"/>`,

    meatball: `<circle cx="22" cy="38" r="10" fill="#8b5a3c"/>
      <circle cx="42" cy="38" r="10" fill="#8b5a3c"/>
      <circle cx="32" cy="24" r="10" fill="#a06844"/>
      <circle cx="29" cy="21" r="2.6" fill="#b87d55"/><circle cx="19" cy="35" r="2.2" fill="#9c6647"/>`,

    tomato: `<circle cx="32" cy="36" r="18" fill="${TOM}"/>
      <path d="M32 18c-6 0-10-2-12-5 4 0 6 1 8 3 1-3 2-5 4-7 2 2 3 4 4 7 2-2 4-3 8-3-2 3-6 5-12 5z" fill="${LET2}"/>
      <ellipse cx="25" cy="30" rx="4" ry="5" fill="#fca5a5" opacity=".6"/>`,

    /* ---------- לא כריכים ---------- */
    muffin: `<path d="M16 28h32l-4 22a4 4 0 0 1-4 3H24a4 4 0 0 1-4-3z" fill="#d9a05b"/>
      <path d="M22 28l-2 25M32 28v25M42 28l2 25" stroke="#c08a45" stroke-width="2"/>
      <path d="M14 28c0-8 8-14 18-14s18 6 18 14z" fill="#8b5a3c"/>
      <circle cx="24" cy="21" r="2.2" fill="#5c3a24"/><circle cx="36" cy="19" r="2.2" fill="#5c3a24"/>
      <circle cx="42" cy="24" r="2" fill="#5c3a24"/>`,

    pancake: `<ellipse cx="32" cy="44" rx="22" ry="7" fill="${CRUST}"/>
      <ellipse cx="32" cy="38" rx="22" ry="7" fill="#f0b96e"/>
      <ellipse cx="32" cy="32" rx="22" ry="7" fill="${CRUST}"/>
      <ellipse cx="32" cy="26" rx="22" ry="7" fill="#f0b96e"/>
      <path d="M32 19c8 0 12 2 12 5s-6 4-9 6" fill="none" stroke="#e0a35c" stroke-width="0"/>
      <path d="M20 24c4-3 8-2 10 0s6 3 10 0" fill="none" stroke="#d98b3a" stroke-width="2.5" stroke-linecap="round"/>`,

    yogurt: `<path d="M18 22h28l-3 28a4 4 0 0 1-4 4H25a4 4 0 0 1-4-4z" fill="#fdf6ec"/>
      <path d="M18 22h28l-1 8H19z" fill="#e8dfd0"/>
      <ellipse cx="32" cy="22" rx="14" ry="4" fill="#fff"/>
      <circle cx="27" cy="36" r="3" fill="${TOM}"/><circle cx="37" cy="40" r="2.6" fill="#a78bfa"/>
      <circle cx="31" cy="45" r="2.4" fill="${CRUST}"/>`,

    omelette: `<circle cx="30" cy="34" r="17" fill="${YOLK}"/>
      <circle cx="30" cy="34" r="17" fill="none" stroke="#e0a814" stroke-width="2"/>
      <path d="M45 32h13a3 3 0 0 1 0 6h-13z" fill="#4b5563"/>
      <circle cx="25" cy="30" r="2.4" fill="${LET2}"/><circle cx="34" cy="36" r="2.4" fill="${TOM}"/>
      <circle cx="28" cy="41" r="2" fill="${LET2}"/>`,

    crackers: `<rect x="8" y="20" width="22" height="22" rx="4" fill="${BREAD}"/>
      <rect x="26" y="30" width="22" height="22" rx="4" fill="#f0d09a"/>
      <g fill="#d9b478"><circle cx="15" cy="27" r="1.5"/><circle cx="23" cy="27" r="1.5"/>
      <circle cx="15" cy="35" r="1.5"/><circle cx="23" cy="35" r="1.5"/>
      <circle cx="33" cy="37" r="1.5"/><circle cx="41" cy="37" r="1.5"/>
      <circle cx="33" cy="45" r="1.5"/><circle cx="41" cy="45" r="1.5"/></g>
      <path d="M44 12h14v14H44z" fill="${CHEESE}" transform="rotate(12 51 19)"/>`,

    pastry: `<path d="M14 40c0-12 8-22 18-22s18 10 18 22z" fill="#e8b878"/>
      <path d="M14 40h36l-2 8a4 4 0 0 1-4 3H20a4 4 0 0 1-4-3z" fill="#d99f52"/>
      <path d="M24 22c2 8 2 12 0 18M40 22c-2 8-2 12 0 18" stroke="#d99f52" stroke-width="2.5" fill="none"/>
      <circle cx="27" cy="17" r="1.4" fill="#fff5e0"/><circle cx="36" cy="16" r="1.4" fill="#fff5e0"/>`,

    smoothie: `<path d="M20 16h24l-3 36a5 5 0 0 1-5 4h-8a5 5 0 0 1-5-4z" fill="#fce7f3"/>
      <path d="M21 26h22l-2.5 26a5 5 0 0 1-5 4h-7a5 5 0 0 1-5-4z" fill="#f472b6"/>
      <ellipse cx="32" cy="16" rx="12" ry="3.5" fill="#fff"/>
      <path d="M36 14l6-10" stroke="#60a5fa" stroke-width="4" stroke-linecap="round"/>`,

    corn: `<ellipse cx="32" cy="30" rx="12" ry="21" fill="${YOLK}"/>
      <g fill="#e0a814"><circle cx="27" cy="18" r="2"/><circle cx="36" cy="18" r="2"/>
      <circle cx="27" cy="26" r="2"/><circle cx="36" cy="26" r="2"/><circle cx="32" cy="22" r="2"/>
      <circle cx="32" cy="30" r="2"/><circle cx="27" cy="34" r="2"/><circle cx="36" cy="34" r="2"/>
      <circle cx="32" cy="38" r="2"/><circle cx="27" cy="42" r="2"/><circle cx="36" cy="42" r="2"/></g>
      <path d="M20 34c-6 4-8 12-6 18 7 1 12-4 14-10z" fill="${LET2}"/>`,

    pizza: `<path d="M32 8L56 50a4 4 0 0 1-3.5 6h-41A4 4 0 0 1 8 50z" fill="${CRUST}"/>
      <path d="M32 16l19 34H13z" fill="${CHEESE}"/>
      <circle cx="26" cy="36" r="3.5" fill="${TOM}"/><circle cx="38" cy="40" r="3.5" fill="${TOM}"/>
      <circle cx="32" cy="27" r="3" fill="${TOM}"/>`,

    fruit: `<circle cx="24" cy="38" r="13" fill="#f87171"/>
      <circle cx="42" cy="34" r="11" fill="#86efac"/>
      <circle cx="34" cy="47" r="9" fill="#a78bfa"/>
      <path d="M24 25c0-4 2-7 5-8-1 4-1 6 0 8z" fill="${LET2}"/>`,

    pasta: `<path d="M10 34h44c0 12-10 20-22 20s-22-8-22-20z" fill="${PLATE}"/>
      <g stroke="${YOLK}" stroke-width="4" stroke-linecap="round" fill="none">
      <path d="M18 34c2 8 6 12 14 12s12-4 14-12M22 34c1 6 4 9 10 9s9-3 10-9"/></g>
      <circle cx="26" cy="30" r="4" fill="${TOM}"/><circle cx="38" cy="31" r="4" fill="${TOM}"/>
      <circle cx="32" cy="26" r="3.4" fill="${TOM}"/>`,

    rice: `<path d="M10 32h44c0 13-10 22-22 22s-22-9-22-22z" fill="#4a90d9"/>
      <path d="M15 33h34c0 10-7.5 17-17 17s-17-7-17-17z" fill="#fdfaf3"/>
      <circle cx="26" cy="40" r="4" fill="${LET}"/><circle cx="37" cy="42" r="4" fill="${TOM}"/>
      <circle cx="31" cy="46" r="3.4" fill="${CHEESE}"/>`,

    soup: `<path d="M8 26h48c0 15-11 26-24 26S8 41 8 26z" fill="#d97706"/>
      <path d="M13 28h38c0 11-8.5 19-19 19s-19-8-19-19z" fill="#f59e0b"/>
      <circle cx="26" cy="34" r="3" fill="#fcd34d"/><circle cx="37" cy="36" r="2.6" fill="#fcd34d"/>
      <path d="M24 16c0-4-4-4-4-8M32 14c0-4-4-4-4-8M40 16c0-4-4-4-4-8"
        stroke="#cbd5e1" stroke-width="3" stroke-linecap="round" fill="none"/>`,

    lasagna: `<path d="M10 40h44v8a4 4 0 0 1-4 4H14a4 4 0 0 1-4-4z" fill="${CRUST}"/>
      <path d="M10 32h44v8H10z" fill="#fde68a"/>
      <path d="M10 24h44v8H10z" fill="${TOM}"/>
      <path d="M10 16h44v8H10z" fill="#fef3c7"/>
      <path d="M10 12h44v6H10z" fill="${CHEESE}"/>`,

    couscous: `<path d="M10 34h44c0 12-10 20-22 20s-22-8-22-20z" fill="${PLATE}"/>
      <path d="M17 35h30c0 9-6.5 15-15 15s-15-6-15-15z" fill="#f5deb0"/>
      <g fill="#e8c88c"><circle cx="25" cy="40" r="1.8"/><circle cx="32" cy="42" r="1.8"/>
      <circle cx="39" cy="40" r="1.8"/><circle cx="28" cy="45" r="1.8"/><circle cx="36" cy="45" r="1.8"/></g>
      <circle cx="24" cy="30" r="4" fill="#f97316"/><circle cx="34" cy="28" r="4" fill="${LET}"/>
      <circle cx="43" cy="31" r="3.4" fill="${TOM}"/>`,

    mash: `<path d="M10 38h44c0 10-10 16-22 16s-22-6-22-16z" fill="${PLATE}"/>
      <path d="M16 38c0-8 7-14 16-14s16 6 16 14z" fill="#fde68a"/>
      <ellipse cx="32" cy="33" rx="7" ry="4" fill="#f59e0b"/>
      <circle cx="24" cy="32" r="2" fill="#eab308"/><circle cx="41" cy="34" r="2" fill="#eab308"/>`,

    /* ---------- יום שישי ---------- */
    'choco-slice': `<path d="M14 20a8 8 0 0 1 16 0h4a8 8 0 0 1 16 0v26a4 4 0 0 1-4 4H18a4 4 0 0 1-4-4z" fill="${BREAD}"/>
      <path d="M19 24h26v22H19z" fill="${CHOC}"/>
      <g fill="${CHOC2}"><circle cx="25" cy="30" r="2.4"/><circle cx="35" cy="33" r="2.4"/>
      <circle cx="28" cy="40" r="2.4"/><circle cx="39" cy="27" r="2"/><circle cx="40" cy="41" r="2"/></g>`,

    'choco-cornflake': `<path d="M14 20a8 8 0 0 1 16 0h4a8 8 0 0 1 16 0v26a4 4 0 0 1-4 4H18a4 4 0 0 1-4-4z" fill="${BREAD}"/>
      <path d="M19 24h26v22H19z" fill="${CHOC}"/>
      <g fill="${YOLK}"><path d="M23 28l5 2-2 5-5-2z"/><path d="M33 27l5 2-2 5-5-2z"/>
      <path d="M27 36l5 2-2 5-5-2z"/><path d="M37 35l5 2-2 5-5-2z"/></g>`,

    cookie: `<circle cx="32" cy="32" r="21" fill="#deab6b"/>
      <circle cx="32" cy="32" r="21" fill="none" stroke="#c9924f" stroke-width="2"/>
      <g fill="${CHOC}"><circle cx="24" cy="25" r="3.4"/><circle cx="39" cy="28" r="3"/>
      <circle cx="29" cy="39" r="3.4"/><circle cx="41" cy="40" r="2.6"/><circle cx="20" cy="36" r="2.4"/></g>`,

    popcorn: `<path d="M20 26h24l-3 26a4 4 0 0 1-4 3H27a4 4 0 0 1-4-3z" fill="#ef4444"/>
      <g fill="#fff" opacity=".9"><rect x="26" y="26" width="4" height="29"/><rect x="35" y="26" width="4" height="29"/></g>
      <g fill="#fdf6e3"><circle cx="22" cy="22" r="6"/><circle cx="32" cy="16" r="7"/>
      <circle cx="42" cy="22" r="6"/><circle cx="27" cy="25" r="5"/><circle cx="38" cy="25" r="5"/></g>`,

    'choco-ball': `<circle cx="32" cy="34" r="17" fill="${CHOC}"/>
      <circle cx="32" cy="34" r="17" fill="none" stroke="#5c3520" stroke-width="1.5"/>
      <g fill="#fdf6e3"><circle cx="25" cy="27" r="1.8"/><circle cx="36" cy="25" r="1.8"/>
      <circle cx="41" cy="34" r="1.8"/><circle cx="30" cy="42" r="1.8"/><circle cx="39" cy="42" r="1.8"/>
      <circle cx="23" cy="37" r="1.8"/><circle cx="32" cy="33" r="1.8"/></g>`,

    brownie: `<path d="M10 24h44v22a4 4 0 0 1-4 4H14a4 4 0 0 1-4-4z" fill="${CHOC}"/>
      <path d="M10 24h44v6H10z" fill="#5c3520"/>
      <path d="M32 24v26M10 37h44" stroke="#5c3520" stroke-width="2"/>
      <g fill="${CHOC2}"><circle cx="20" cy="33" r="2"/><circle cx="43" cy="44" r="2"/></g>`,

    skewer: `<path d="M32 56V10" stroke="#c9a06b" stroke-width="3" stroke-linecap="round"/>
      <circle cx="32" cy="17" r="8" fill="#f87171"/>
      <circle cx="32" cy="32" r="8" fill="#86efac"/>
      <circle cx="32" cy="47" r="8" fill="${CHOC}"/>`,

    'cake-cup': `<path d="M18 24h28l-3 26a4 4 0 0 1-4 4H25a4 4 0 0 1-4-4z" fill="#fdf6ec"/>
      <path d="M20 34h24l-2 16a4 4 0 0 1-4 4H26a4 4 0 0 1-4-4z" fill="#fbbf24"/>
      <ellipse cx="32" cy="24" rx="14" ry="4.5" fill="#fff"/>
      <path d="M22 20c2-6 6-9 10-9s8 3 10 9z" fill="#f472b6"/>`,

    marshmallow: `<rect x="12" y="26" width="16" height="20" rx="7" fill="#fff"/>
      <rect x="30" y="20" width="16" height="20" rx="7" fill="#fbcfe8"/>
      <rect x="24" y="40" width="16" height="18" rx="7" fill="#bfdbfe"/>
      <path d="M44 30h10" stroke="#c9a06b" stroke-width="3" stroke-linecap="round"/>`,

    honey: `<path d="M22 14h20v8l4 6v22a4 4 0 0 1-4 4H22a4 4 0 0 1-4-4V28l4-6z" fill="#f59e0b"/>
      <path d="M18 30h28v6H18z" fill="#fff" opacity=".3"/>
      <rect x="20" y="9" width="24" height="6" rx="2" fill="#b45309"/>
      <g fill="#fcd34d"><circle cx="28" cy="42" r="2.4"/><circle cx="36" cy="46" r="2"/></g>`,

    strawberry: `<path d="M32 54c-9 0-16-8-16-18 0-7 7-12 16-12s16 5 16 12c0 10-7 18-16 18z" fill="#ef4444"/>
      <path d="M32 24c-5 0-8-2-10-5 3 0 5 .5 7 2 .5-2.5 1.5-4.5 3-6 1.5 1.5 2.5 3.5 3 6 2-1.5 4-2 7-2-2 3-5 5-10 5z" fill="${LET2}"/>
      <g fill="#fecaca"><circle cx="26" cy="34" r="1.5"/><circle cx="36" cy="33" r="1.5"/>
      <circle cx="31" cy="41" r="1.5"/><circle cx="39" cy="42" r="1.5"/><circle cx="24" cy="43" r="1.5"/></g>`,

    coconut: `<circle cx="32" cy="34" r="18" fill="#8b5a3c"/>
      <circle cx="32" cy="34" r="12" fill="#fdfaf3"/>
      <g fill="#5c3520"><circle cx="26" cy="26" r="2"/><circle cx="38" cy="27" r="2"/><circle cx="32" cy="22" r="2"/></g>
      <path d="M26 34h12" stroke="#e8dfd0" stroke-width="2"/>`,

    'french-toast': `<path d="M12 26l20-14 20 14v20a4 4 0 0 1-4 4H16a4 4 0 0 1-4-4z" fill="#e8b878"/>
      <path d="M18 28l14-9 14 9v16H18z" fill="#f0c48a"/>
      <path d="M22 32c4-3 8-1 10 1s6 2 10-1" stroke="#d98b3a" stroke-width="2.5" fill="none" stroke-linecap="round"/>
      <ellipse cx="32" cy="24" rx="9" ry="3" fill="#fff" opacity=".5"/>`,

    /* ---------- UI ---------- */
    box: `<path d="M8 20l24-12 24 12v26L32 58 8 46z" fill="currentColor" opacity=".25"/>
      <path d="M8 20l24 12 24-12M32 32v26" stroke="currentColor" stroke-width="3" fill="none" stroke-linejoin="round"/>
      <path d="M8 20l24-12 24 12v26L32 58 8 46z" stroke="currentColor" stroke-width="3" fill="none" stroke-linejoin="round"/>`,

    clock: `<circle cx="32" cy="32" r="23" fill="none" stroke="currentColor" stroke-width="4"/>
      <path d="M32 17v16l10 7" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`,

    gauge: `<path d="M10 42a22 22 0 0 1 44 0" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>
      <path d="M32 42l12-13" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>
      <circle cx="32" cy="42" r="4" fill="currentColor"/>`,

    cart: `<path d="M6 10h8l7 27h25" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M17 19h37l-5 15H21" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
      <circle cx="24" cy="50" r="4" fill="currentColor"/><circle cx="44" cy="50" r="4" fill="currentColor"/>`,

    list: `<path d="M24 16h30M24 32h30M24 48h30" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>
      <circle cx="12" cy="16" r="4" fill="currentColor"/><circle cx="12" cy="32" r="4" fill="currentColor"/>
      <circle cx="12" cy="48" r="4" fill="currentColor"/>`,

    steps: `<path d="M10 50h12V38h12V26h12V14h8" fill="none" stroke="currentColor" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"/>`,

    bulb: `<path d="M32 8c-9 0-16 7-16 16 0 6 3 10 6 13v5h20v-5c3-3 6-7 6-13 0-9-7-16-16-16z" fill="none" stroke="currentColor" stroke-width="4" stroke-linejoin="round"/>
      <path d="M26 50h12M28 56h8" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>`,

    alert: `<path d="M32 8l26 46H6z" fill="none" stroke="currentColor" stroke-width="4" stroke-linejoin="round"/>
      <path d="M32 24v12" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>
      <circle cx="32" cy="45" r="2.6" fill="currentColor"/>`,

    check: `<path d="M12 33l14 14 26-30" fill="none" stroke="currentColor" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>`,

    'arrow-l': `<path d="M40 12L20 32l20 20" fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>`,

    search: `<circle cx="28" cy="28" r="16" fill="none" stroke="currentColor" stroke-width="5"/>
      <path d="M40 40l14 14" stroke="currentColor" stroke-width="5" stroke-linecap="round"/>`,

    moon: `<path d="M52 38A22 22 0 0 1 26 12a22 22 0 1 0 26 26z" fill="currentColor"/>`,

    print: `<path d="M18 24V8h28v16" fill="none" stroke="currentColor" stroke-width="4" stroke-linejoin="round"/>
      <path d="M10 24h44v20H10z" fill="none" stroke="currentColor" stroke-width="4" stroke-linejoin="round"/>
      <path d="M18 40h28v16H18z" fill="none" stroke="currentColor" stroke-width="4" stroke-linejoin="round"/>`,

    chart: `<path d="M10 54V30M24 54V14M38 54V38M52 54V22" stroke="currentColor" stroke-width="6" stroke-linecap="round"/>`,

    menu: `<path d="M8 16h48M8 32h48M8 48h48" stroke="currentColor" stroke-width="5" stroke-linecap="round"/>`,

    x: `<path d="M14 14l36 36M50 14L14 50" stroke="currentColor" stroke-width="5" stroke-linecap="round"/>`,

    flame: `<path d="M32 6c8 10 4 14 8 18 3-2 4-5 4-8 6 6 10 13 10 20 0 12-10 22-22 22S10 48 10 36c0-10 8-20 14-24 2 4 1 8 3 10 3-3 5-9 5-16z"
      fill="currentColor"/>`,

    muscle: `<path d="M10 40c0-10 6-18 16-18 6 0 8 3 14 3 8 0 14 6 14 14s-6 15-16 15H24c-8 0-14-6-14-14z"
      fill="none" stroke="currentColor" stroke-width="4" stroke-linejoin="round"/>
      <path d="M24 32c4 3 8 4 12 3" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>`,

    cube: `<path d="M32 8l20 11v26L32 56 12 45V19z" fill="none" stroke="currentColor" stroke-width="4" stroke-linejoin="round"/>
      <path d="M12 19l20 11 20-11M32 30v26" fill="none" stroke="currentColor" stroke-width="4" stroke-linejoin="round"/>`,

    settings: `<circle cx="32" cy="32" r="8" fill="none" stroke="currentColor" stroke-width="4"/>
      <path d="M32 6v8M32 50v8M6 32h8M50 32h8M13.6 13.6l5.7 5.7M44.7 44.7l5.7 5.7M50.4 13.6l-5.7 5.7M19.3 44.7l-5.7 5.7"
        stroke="currentColor" stroke-width="4" stroke-linecap="round"/>`,
  };

  const sprite =
    '<svg xmlns="http://www.w3.org/2000/svg" style="position:absolute;width:0;height:0;overflow:hidden" aria-hidden="true">' +
    Object.entries(ICONS).map(([k, v]) => S(k, v)).join('') +
    '</svg>';

  function inject() {
    if (document.getElementById('icon-sprite')) return;
    const d = document.createElement('div');
    d.id = 'icon-sprite';
    d.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden';
    d.innerHTML = sprite;
    document.body.insertBefore(d, document.body.firstChild);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inject);
  } else {
    inject();
  }

  window.Icons = {
    names: Object.keys(ICONS),
    has: (n) => Object.prototype.hasOwnProperty.call(ICONS, n),
    /** מחזיר מחרוזת HTML של אייקון */
    use(name, cls) {
      const n = ICONS[name] ? name : 'sandwich';
      return `<svg class="${cls || ''}" aria-hidden="true"><use href="#i-${n}"/></svg>`;
    },
  };
})();
