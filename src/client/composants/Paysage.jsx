// Décor illustré des écrans d'accueil : un paysage de collines, de forêts et de rivière.

/** Petit arbre rond (tronc + houppier) posé en (x, y). */
function Arbre({ x, y, t = 1, teinte = '#5fa865' }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${t})`}>
      <ellipse cx="0" cy="2" rx="16" ry="4" fill="#1f3d22" opacity="0.18" />
      <rect x="-3" y="-18" width="6" height="20" rx="2" fill="#8a5d3b" />
      <circle cx="0" cy="-34" r="20" fill={teinte} />
      <circle cx="-10" cy="-24" r="13" fill={teinte} opacity="0.85" />
      <circle cx="11" cy="-25" r="12" fill="#2f6b3c" opacity="0.35" />
      <circle cx="-6" cy="-42" r="7" fill="#fff" opacity="0.18" />
    </g>
  );
}

/** Sapin (triangles superposés). */
function Sapin({ x, y, t = 1, teinte = '#3f7f4e' }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${t})`}>
      <ellipse cx="0" cy="2" rx="13" ry="3.5" fill="#1f3d22" opacity="0.18" />
      <rect x="-2.5" y="-10" width="5" height="12" fill="#7a5134" />
      <path d="M0,-62 L18,-28 L-18,-28 Z" fill={teinte} />
      <path d="M0,-46 L22,-8 L-22,-8 Z" fill={teinte} />
      <path d="M0,-62 L18,-28 L4,-28 Z M0,-46 L22,-8 L6,-8 Z" fill="#1f4a2a" opacity="0.3" />
    </g>
  );
}

/** Maisonnette au toit rouge. */
function Maison({ x, y, t = 1 }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${t})`}>
      <ellipse cx="0" cy="2" rx="26" ry="5" fill="#1f3d22" opacity="0.18" />
      <rect x="-20" y="-26" width="40" height="28" fill="#f6ead2" />
      <rect x="-20" y="-26" width="12" height="28" fill="#e6d4b2" />
      <path d="M-26,-24 L0,-46 L26,-24 Z" fill="#c9573f" />
      <path d="M0,-46 L26,-24 L12,-24 Z" fill="#9c3f2c" />
      <rect x="-4" y="-12" width="9" height="14" rx="2" fill="#8a5d3b" />
      <rect x="8" y="-20" width="7" height="7" rx="1.5" fill="#7fb6d6" />
      <rect x="10" y="-40" width="6" height="10" fill="#9c3f2c" />
    </g>
  );
}

export function Paysage() {
  return (
    <div className="paysage" aria-hidden="true">
      <svg viewBox="0 0 1440 900" preserveAspectRatio="xMidYMax slice">
        <defs>
          <linearGradient id="pays-ciel" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#bfe0ec" />
            <stop offset="55%" stopColor="#e9f1e4" />
            <stop offset="100%" stopColor="#f8eed6" />
          </linearGradient>
          <radialGradient id="pays-soleil">
            <stop offset="0%" stopColor="#fff6d6" />
            <stop offset="35%" stopColor="#fde7a6" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#fde7a6" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="pays-riviere" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#a9d6ec" />
            <stop offset="100%" stopColor="#5fa8d3" />
          </linearGradient>
          <linearGradient id="pays-brume" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f8eed6" stopOpacity="0" />
            <stop offset="100%" stopColor="#f8eed6" stopOpacity="0.85" />
          </linearGradient>
        </defs>

        <rect width="1440" height="900" fill="url(#pays-ciel)" />
        <circle cx="1120" cy="200" r="220" fill="url(#pays-soleil)" />
        <circle cx="1120" cy="200" r="58" fill="#fff1c4" />

        <g className="nuages" fill="#fff">
          <g opacity="0.85">
            <ellipse cx="240" cy="150" rx="90" ry="26" />
            <ellipse cx="290" cy="132" rx="56" ry="30" />
            <ellipse cx="200" cy="138" rx="40" ry="22" />
          </g>
          <g opacity="0.7">
            <ellipse cx="820" cy="110" rx="70" ry="18" />
            <ellipse cx="860" cy="96" rx="44" ry="22" />
          </g>
          <g opacity="0.6">
            <ellipse cx="1320" cy="320" rx="80" ry="20" />
            <ellipse cx="1290" cy="306" rx="44" ry="20" />
          </g>
        </g>

        <g fill="none" stroke="#4d5a52" strokeWidth="2.4" strokeLinecap="round" opacity="0.55" className="oiseaux">
          <path d="M600,210 q8,-8 16,0 q8,-8 16,0" />
          <path d="M640,240 q6,-6 12,0 q6,-6 12,0" />
          <path d="M575,250 q5,-5 10,0 q5,-5 10,0" />
        </g>

        {/* montagnes lointaines */}
        <path d="M0,520 L140,380 L230,450 L380,300 L520,460 L640,390 L760,480 L0,600 Z" fill="#b9c8d6" />
        <path d="M380,300 L420,345 L400,350 L380,330 L360,352 L345,340 Z" fill="#f7fbff" />
        <path d="M140,380 L170,410 L150,412 L138,398 L122,410 Z" fill="#f7fbff" />
        <path d="M700,520 L900,330 L1010,430 L1120,350 L1300,500 L1440,420 L1440,620 L700,620 Z" fill="#aebfcf" />
        <path d="M900,330 L944,372 L922,378 L900,356 L880,380 L862,366 Z" fill="#f7fbff" />
        <path d="M1120,350 L1150,378 L1130,382 L1118,368 L1100,384 Z" fill="#f7fbff" />
        <rect y="430" width="1440" height="220" fill="url(#pays-brume)" />

        {/* collines du milieu */}
        <path d="M0,600 C200,520 380,560 560,590 C760,620 900,540 1100,540 C1260,540 1360,580 1440,560 L1440,900 L0,900 Z" fill="#b5d79d" />
        <path d="M0,680 C220,620 420,640 640,670 C860,700 1040,630 1240,640 C1340,646 1400,660 1440,650 L1440,900 L0,900 Z" fill="#94c47f" />

        {/* forêt lointaine */}
        {[
          [90, 610, 0.7], [140, 600, 0.8], [190, 615, 0.65], [980, 572, 0.75], [1030, 566, 0.85], [1080, 575, 0.7],
          [1250, 580, 0.7], [1300, 585, 0.6],
        ].map(([x, y, t], i) => (
          <Sapin key={`s${i}`} x={x} y={y} t={t} teinte={i % 2 ? '#4b8a58' : '#3f7f4e'} />
        ))}
        <Maison x={760} y={640} t={0.9} />
        <Arbre x={700} y={650} t={0.75} teinte="#6db46f" />

        {/* rivière */}
        <path
          d="M1180,640 C1100,680 980,690 900,720 C800,760 760,800 640,830 C540,856 420,870 300,900 L470,900 C560,880 680,866 780,836 C900,800 960,760 1040,730 C1110,704 1170,690 1220,650 Z"
          fill="url(#pays-riviere)"
        />
        <g stroke="#fff" strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.7">
          <path d="M1050,712 q14,-6 28,0" />
          <path d="M860,770 q16,-6 32,0" />
          <path d="M640,846 q18,-6 36,0" />
        </g>

        {/* premier plan */}
        <path d="M0,760 C160,720 300,740 420,770 C520,796 560,830 600,900 L0,900 Z" fill="#7db86c" />
        <path d="M1440,740 C1300,720 1180,760 1100,800 C1030,836 1000,870 990,900 L1440,900 Z" fill="#7db86c" />
        {[
          [70, 770, 1.15, '#5fa865'], [170, 760, 1.3, '#6db46f'], [270, 782, 1.05, '#4f9a58'], [360, 800, 0.95, '#6db46f'],
          [1180, 790, 1.2, '#5fa865'], [1290, 770, 1.35, '#4f9a58'], [1390, 765, 1.1, '#6db46f'],
        ].map(([x, y, t, c], i) => (
          <Arbre key={`a${i}`} x={x} y={y} t={t} teinte={c} />
        ))}
        <g fill="#f1d067">
          {[[120, 850], [230, 830], [330, 860], [1220, 850], [1340, 830], [1110, 870]].map(([x, y], i) => (
            <g key={i} transform={`translate(${x} ${y})`}>
              <circle r="4" />
              <circle r="1.8" fill="#c9573f" />
            </g>
          ))}
        </g>
      </svg>
    </div>
  );
}

/** Logo : feuille stylisée dans un hexagone. */
export function Logo({ taille = 56 }) {
  return (
    <svg className="logo" width={taille} height={taille} viewBox="-50 -50 100 100" aria-hidden="true">
      <defs>
        <linearGradient id="logo-fond" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#4f8a63" />
          <stop offset="100%" stopColor="#2c5a3f" />
        </linearGradient>
      </defs>
      <polygon points="0,-46 40,-23 40,23 0,46 -40,23 -40,-23" fill="url(#logo-fond)" stroke="#d9a441" strokeWidth="3.5" strokeLinejoin="round" />
      <path d="M0,28 C-22,14 -22,-12 0,-30 C22,-12 22,14 0,28 Z" fill="#9cd08f" />
      <path d="M0,28 C10,14 14,-6 0,-30 C22,-12 22,14 0,28 Z" fill="#74c07a" />
      <path d="M0,32 L0,-22 M0,-2 L-9,-11 M0,10 L9,1" stroke="#2c5a3f" strokeWidth="3" strokeLinecap="round" fill="none" />
    </svg>
  );
}
