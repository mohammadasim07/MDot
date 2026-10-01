/**
 * High-resolution sample cards:
 * Card 1: Mohammad Asim Aadhaar Card (from user photo, standard 8.6 x 5.4 cm)
 * Card 2 & 3: Floral and greeting cards
 */

export const ASIM_AADHAAR_FRONT = '/asim_front.png';
export const ASIM_AADHAAR_BACK = '/asim_back.png';

// Card 2 Front: Elegant Floral "Happy Birthday" matching reference screenshot
export const SAMPLE_CARD_1_FRONT = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="600" height="840" viewBox="0 0 600 840">
  <defs>
    <linearGradient id="ivoryBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fdfbf7"/>
      <stop offset="100%" stop-color="#f6ede2"/>
    </linearGradient>
    <radialGradient id="pinkRose" cx="35%" cy="35%" r="65%">
      <stop offset="0%" stop-color="#f8bbd0"/>
      <stop offset="35%" stop-color="#f06292"/>
      <stop offset="75%" stop-color="#e91e63"/>
      <stop offset="100%" stop-color="#c2185b"/>
    </radialGradient>
    <radialGradient id="deepRose" cx="30%" cy="30%" r="70%">
      <stop offset="0%" stop-color="#ff80ab"/>
      <stop offset="50%" stop-color="#d81b60"/>
      <stop offset="100%" stop-color="#880e4f"/>
    </radialGradient>
    <radialGradient id="flowerCenter" cx="40%" cy="40%" r="60%">
      <stop offset="0%" stop-color="#fff9c4"/>
      <stop offset="100%" stop-color="#fbc02d"/>
    </radialGradient>
    <filter id="softGlow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="#4a3525" flood-opacity="0.15"/>
    </filter>
  </defs>

  <!-- Card Paper Background -->
  <rect width="600" height="840" fill="url(#ivoryBg)"/>

  <!-- Gold Double Border -->
  <rect x="34" y="34" width="532" height="772" fill="none" stroke="#d4af37" stroke-width="2" rx="4"/>
  <rect x="42" y="42" width="516" height="756" fill="none" stroke="#e8c872" stroke-width="1.2" rx="3"/>

  <!-- Top-Right Floral Garland -->
  <g transform="translate(380, 45)">
    <!-- Sage / Olive Leaves -->
    <path d="M30,15 C10,-10 30,-35 45,-25 C65,-10 50,15 30,15 Z" fill="#81c784"/>
    <path d="M75,25 C105,5 125,25 115,45 C95,65 75,45 75,25 Z" fill="#66bb6a"/>
    <path d="M110,65 C145,55 155,80 140,100 C120,115 105,85 110,65 Z" fill="#4caf50"/>
    <path d="M15,55 C-10,45 -5,20 15,25 C30,30 25,60 15,55 Z" fill="#a5d6a7"/>
    <!-- Rose Blooms -->
    <circle cx="60" cy="45" r="42" fill="url(#pinkRose)"/>
    <circle cx="60" cy="45" r="14" fill="url(#flowerCenter)"/>
    <circle cx="105" cy="85" r="36" fill="url(#deepRose)"/>
    <circle cx="105" cy="85" r="12" fill="url(#flowerCenter)"/>
    <circle cx="30" cy="90" r="28" fill="url(#pinkRose)"/>
    <circle cx="30" cy="90" r="9" fill="url(#flowerCenter)"/>
    <circle cx="140" cy="50" r="16" fill="url(#deepRose)"/>
  </g>

  <!-- Top-Left Floral Bouquet -->
  <g transform="translate(45, 45)">
    <path d="M25,25 C5,5 20,-20 35,-10 C50,5 40,25 25,25 Z" fill="#81c784"/>
    <path d="M60,15 C85,-5 95,15 85,35 C70,50 55,30 60,15 Z" fill="#66bb6a"/>
    <circle cx="48" cy="48" r="36" fill="url(#pinkRose)"/>
    <circle cx="48" cy="48" r="12" fill="url(#flowerCenter)"/>
    <circle cx="20" cy="80" r="26" fill="url(#deepRose)"/>
    <circle cx="20" cy="80" r="8" fill="url(#flowerCenter)"/>
  </g>

  <!-- Bottom-Left Magnificent Floral Garland -->
  <g transform="translate(45, 520)">
    <!-- Leaves climbing up and across -->
    <path d="M20,30 C-20,0 0,-30 20,-10 C35,10 30,35 20,30 Z" fill="#4caf50"/>
    <path d="M-5,90 C-40,70 -25,40 -5,55 C15,70 10,95 -5,90 Z" fill="#66bb6a"/>
    <path d="M60,190 C30,230 65,250 85,225 C105,195 75,175 60,190 Z" fill="#81c784"/>
    <path d="M150,220 C185,250 215,225 190,195 C165,175 140,200 150,220 Z" fill="#a5d6a7"/>
    <path d="M210,190 C255,200 250,170 225,160 C195,155 195,185 210,190 Z" fill="#81c784"/>
    <path d="M270,220 C310,235 315,210 290,195 C265,185 255,210 270,220 Z" fill="#66bb6a"/>
    <!-- Blooming Roses -->
    <circle cx="50" cy="70" r="50" fill="url(#deepRose)"/>
    <circle cx="50" cy="70" r="16" fill="url(#flowerCenter)"/>
    <circle cx="125" cy="105" r="46" fill="url(#pinkRose)"/>
    <circle cx="125" cy="105" r="15" fill="url(#flowerCenter)"/>
    <circle cx="70" cy="155" r="52" fill="url(#pinkRose)"/>
    <circle cx="70" cy="155" r="17" fill="url(#flowerCenter)"/>
    <circle cx="155" cy="175" r="40" fill="url(#deepRose)"/>
    <circle cx="155" cy="175" r="13" fill="url(#flowerCenter)"/>
    <circle cx="230" cy="190" r="32" fill="url(#pinkRose)"/>
    <circle cx="230" cy="190" r="10" fill="url(#flowerCenter)"/>
  </g>

  <!-- Bottom-Right Floral Garland -->
  <g transform="translate(410, 560)">
    <path d="M45,35 C75,15 85,40 65,65 C45,80 35,50 45,35 Z" fill="#66bb6a"/>
    <path d="M75,90 C110,80 120,105 95,125 C75,140 65,110 75,90 Z" fill="#4caf50"/>
    <circle cx="60" cy="75" r="42" fill="url(#pinkRose)"/>
    <circle cx="60" cy="75" r="14" fill="url(#flowerCenter)"/>
    <circle cx="25" cy="125" r="45" fill="url(#deepRose)"/>
    <circle cx="25" cy="125" r="14" fill="url(#flowerCenter)"/>
    <circle cx="95" cy="140" r="30" fill="url(#pinkRose)"/>
    <circle cx="95" cy="140" r="10" fill="url(#flowerCenter)"/>
  </g>

  <!-- Center Script Typography matching reference image -->
  <g transform="translate(300, 375)" filter="url(#softGlow)">
    <text x="0" y="0" font-family="'Brush Script MT', 'Great Vibes', 'Dancing Script', 'Snell Roundhand', cursive, Georgia, serif" font-size="96" font-weight="bold" font-style="italic" fill="#523924" text-anchor="middle">
      Happy
    </text>
    <text x="0" y="102" font-family="'Brush Script MT', 'Great Vibes', 'Dancing Script', 'Snell Roundhand', cursive, Georgia, serif" font-size="102" font-weight="bold" font-style="italic" fill="#523924" text-anchor="middle">
      Birthday
    </text>
  </g>
</svg>
`)}`;

// Card 1 Back: Matching Floral Frame with Note Writing Area
export const SAMPLE_CARD_1_BACK = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="600" height="840" viewBox="0 0 600 840">
  <defs>
    <linearGradient id="ivoryBg2" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fdfbf7"/>
      <stop offset="100%" stop-color="#f6ede2"/>
    </linearGradient>
    <radialGradient id="pinkRoseB" cx="35%" cy="35%" r="65%">
      <stop offset="0%" stop-color="#f8bbd0"/>
      <stop offset="35%" stop-color="#f06292"/>
      <stop offset="75%" stop-color="#e91e63"/>
      <stop offset="100%" stop-color="#c2185b"/>
    </radialGradient>
    <radialGradient id="deepRoseB" cx="30%" cy="30%" r="70%">
      <stop offset="0%" stop-color="#ff80ab"/>
      <stop offset="50%" stop-color="#d81b60"/>
      <stop offset="100%" stop-color="#880e4f"/>
    </radialGradient>
    <radialGradient id="flowerCenterB" cx="40%" cy="40%" r="60%">
      <stop offset="0%" stop-color="#fff9c4"/>
      <stop offset="100%" stop-color="#fbc02d"/>
    </radialGradient>
  </defs>

  <rect width="600" height="840" fill="url(#ivoryBg2)"/>

  <!-- Gold Double Border -->
  <rect x="34" y="34" width="532" height="772" fill="none" stroke="#d4af37" stroke-width="2" rx="4"/>
  <rect x="42" y="42" width="516" height="756" fill="none" stroke="#e8c872" stroke-width="1.2" rx="3"/>

  <!-- Full Perimeter Floral Garland Cascading Along Right Side -->
  <g transform="translate(420, 50)">
    <path d="M35,20 C15,-10 35,-30 50,-20 C70,-5 55,20 35,20 Z" fill="#81c784"/>
    <circle cx="50" cy="40" r="38" fill="url(#pinkRoseB)"/>
    <circle cx="50" cy="40" r="12" fill="url(#flowerCenterB)"/>
    <circle cx="20" cy="85" r="32" fill="url(#deepRoseB)"/>
    <circle cx="70" cy="115" r="30" fill="url(#pinkRoseB)"/>
  </g>

  <g transform="translate(440, 230)">
    <path d="M-10,20 C-30,5 -15,-10 0,-5 C15,5 5,20 -10,20 Z" fill="#81c784"/>
    <circle cx="35" cy="30" r="28" fill="url(#pinkRoseB)"/>
    <circle cx="15" cy="70" r="26" fill="url(#deepRoseB)"/>
    <circle cx="35" cy="30" r="9" fill="url(#flowerCenterB)"/>
  </g>

  <g transform="translate(415, 410)">
    <path d="M0,20 C-25,0 -10,-20 5,-15 C20,-5 15,15 0,20 Z" fill="#66bb6a"/>
    <circle cx="45" cy="50" r="38" fill="url(#pinkRoseB)"/>
    <circle cx="75" cy="90" r="32" fill="url(#deepRoseB)"/>
    <circle cx="30" cy="125" r="42" fill="url(#pinkRoseB)"/>
    <circle cx="30" cy="125" r="13" fill="url(#flowerCenterB)"/>
  </g>

  <!-- Top-Left Accent -->
  <g transform="translate(50, 45)">
    <path d="M20,15 C0,0 15,-15 30,-5 C40,5 30,20 20,15 Z" fill="#81c784"/>
    <circle cx="38" cy="42" r="30" fill="url(#pinkRoseB)"/>
    <circle cx="65" cy="68" r="24" fill="url(#deepRoseB)"/>
  </g>

  <!-- Bottom-Left Accent -->
  <g transform="translate(50, 620)">
    <path d="M10,20 C-15,0 -5,-20 15,-10 C25,0 20,20 10,20 Z" fill="#81c784"/>
    <circle cx="42" cy="52" r="38" fill="url(#deepRoseB)"/>
    <circle cx="80" cy="85" r="30" fill="url(#pinkRoseB)"/>
    <circle cx="42" cy="52" r="12" fill="url(#flowerCenterB)"/>
  </g>

  <!-- Clean Blank Writing Space in Center -->
  <g transform="translate(300, 420)">
    <line x1="-120" y1="0" x2="-25" y2="0" stroke="#d8ccbf" stroke-width="1"/>
    <line x1="25" y1="0" x2="120" y2="0" stroke="#d8ccbf" stroke-width="1"/>
    <circle cx="0" cy="0" r="4" fill="#d4af37"/>
  </g>
</svg>
`)}`;

// Card 2 Front: Rose Garland Card
export const SAMPLE_CARD_2_FRONT = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="600" height="840" viewBox="0 0 600 840">
  <rect width="600" height="840" fill="#faf5f0"/>
  <rect x="34" y="34" width="532" height="772" fill="none" stroke="#d4af37" stroke-width="2" rx="4"/>
  <rect x="42" y="42" width="516" height="756" fill="none" stroke="#e8c872" stroke-width="1.2" rx="3"/>
  <g transform="translate(300, 360)">
    <circle cx="0" cy="0" r="60" fill="#f8bbd0"/>
    <circle cx="-30" cy="-20" r="40" fill="#f48fb1"/>
    <circle cx="30" cy="15" r="38" fill="#f06292"/>
    <circle cx="0" cy="0" r="16" fill="#fff59d"/>
    <path d="M-70,-50 Q-100,-70 -90,-100 Q-50,-80 -70,-50 Z" fill="#81c784"/>
    <path d="M70,50 Q100,70 90,100 Q50,80 70,50 Z" fill="#81c784"/>
  </g>
  <text x="300" y="490" font-family="'Brush Script MT', cursive, Georgia, serif" font-size="70" font-weight="bold" fill="#4d3522" text-anchor="middle">
    With Love
  </text>
</svg>
`)}`;

// Card 2 Back: Rose Note Card
export const SAMPLE_CARD_2_BACK = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="600" height="840" viewBox="0 0 600 840">
  <rect width="600" height="840" fill="#faf5f0"/>
  <rect x="34" y="34" width="532" height="772" fill="none" stroke="#d4af37" stroke-width="2" rx="4"/>
  <rect x="42" y="42" width="516" height="756" fill="none" stroke="#e8c872" stroke-width="1.2" rx="3"/>
  <g transform="translate(300, 140)">
    <circle cx="0" cy="0" r="28" fill="#f48fb1"/>
    <circle cx="0" cy="0" r="10" fill="#fff59d"/>
    <path d="M-25,-15 Q-45,-25 -35,-45 Q-15,-35 -25,-15 Z" fill="#81c784"/>
    <path d="M25,-15 Q45,-25 35,-45 Q15,-35 25,-15 Z" fill="#81c784"/>
  </g>
  <line x1="100" y1="360" x2="500" y2="360" stroke="#e2d6c9" stroke-width="1" stroke-dasharray="4,4"/>
  <line x1="100" y1="420" x2="500" y2="420" stroke="#e2d6c9" stroke-width="1" stroke-dasharray="4,4"/>
  <line x1="100" y1="480" x2="500" y2="480" stroke="#e2d6c9" stroke-width="1" stroke-dasharray="4,4"/>
</svg>
`)}`;

// Card 3 Front: Pastel Celebration Card
export const SAMPLE_CARD_3_FRONT = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="600" height="840" viewBox="0 0 600 840">
  <rect width="600" height="840" fill="#f0f7f9"/>
  <rect x="34" y="34" width="532" height="772" fill="none" stroke="#80deea" stroke-width="2" rx="4"/>
  <rect x="42" y="42" width="516" height="756" fill="none" stroke="#b2ebf2" stroke-width="1.2" rx="3"/>
  <g transform="translate(300, 360)">
    <circle cx="0" cy="0" r="60" fill="#80deea"/>
    <circle cx="-30" cy="-20" r="42" fill="#4dd0e1"/>
    <circle cx="30" cy="20" r="40" fill="#26c6da"/>
  </g>
  <text x="300" y="490" font-family="'Brush Script MT', cursive, Georgia, serif" font-size="70" font-weight="bold" fill="#006064" text-anchor="middle">
    Celebrate
  </text>
</svg>
`)}`;

// Card 3 Back: Pastel Celebration Back
export const SAMPLE_CARD_3_BACK = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="600" height="840" viewBox="0 0 600 840">
  <rect width="600" height="840" fill="#f0f7f9"/>
  <rect x="34" y="34" width="532" height="772" fill="none" stroke="#80deea" stroke-width="2" rx="4"/>
  <rect x="42" y="42" width="516" height="756" fill="none" stroke="#b2ebf2" stroke-width="1.2" rx="3"/>
  <line x1="100" y1="360" x2="500" y2="360" stroke="#b2ebf2" stroke-width="1" stroke-dasharray="4,4"/>
  <line x1="100" y1="420" x2="500" y2="420" stroke="#b2ebf2" stroke-width="1" stroke-dasharray="4,4"/>
</svg>
`)}`;
