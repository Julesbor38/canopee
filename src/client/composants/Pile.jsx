// Rendu en perspective (3D isométrique) des pions et des piles.
// Chaque couleur a sa propre forme pour que la nature et la hauteur
// d'une construction se lisent d'un coup d'œil :
//  rivière / prairie : tuile plate (vagues / herbes)
//  montagne          : bloc de roche, avec un pic sur le dernier niveau
//  tronc             : cylindre de bois
//  feuillage         : houppier arrondi (petit buisson s'il est posé au sol)
//  bâtiment          : maison avec fenêtres, toit pointu sur le dernier niveau
//  socle (cartes)    : bloc neutre « au choix » sous un bâtiment

import { COULEURS_AFFICHAGE as C, INCLINAISON as K, sommetsHex, teinte, versPoints } from '../geometrie.js';

/** Proportions des pièces, relatives au rayon d'une case. */
const P = {
  rayon: 0.84, // bloc de roche / tuile
  hauteur: 0.32, // épaisseur d'un niveau
  plat: 0.14, // épaisseur des tuiles plates
  tronc: 0.28, // rayon d'un tronc
  maison: 0.6, // rayon d'une maison
};

const FACES_VISIBLES = [
  [3, 4, 0.96],
  [2, 3, 0.9],
  [1, 2, 0.8],
  [0, 1, 0.72],
];

/** Prisme hexagonal posé à l'altitude `base` (y écran du sol de la pièce). */
function prisme(cle, x, base, r, h, couleur, decor) {
  const haut = sommetsHex(x, base - h, r);
  const bas = sommetsHex(x, base, r);
  const trait = teinte(couleur, 0.62);
  return (
    <g key={cle}>
      {FACES_VISIBLES.map(([i, j, f]) => (
        <polygon
          key={`${i}${j}`}
          points={versPoints([haut[i], haut[j], bas[j], bas[i]])}
          fill={teinte(couleur, f)}
          stroke={trait}
          strokeWidth={0.6}
          strokeLinejoin="round"
        />
      ))}
      <polygon points={versPoints(haut)} fill={couleur} stroke={trait} strokeWidth={0.6} strokeLinejoin="round" />
      {decor?.(haut, bas)}
    </g>
  );
}

/** Cylindre vertical (tronc). */
function cylindre(cle, x, base, r, h, couleur, dernier) {
  const ry = r * K;
  const trait = teinte(couleur, 0.6);
  return (
    <g key={cle}>
      <path
        d={`M${x - r},${base - h} L${x - r},${base} A${r},${ry} 0 0 0 ${x + r},${base} L${x + r},${base - h} Z`}
        fill={teinte(couleur, 0.82)}
        stroke={trait}
        strokeWidth={0.6}
      />
      <rect x={x - r * 0.75} y={base - h} width={r * 0.35} height={h} fill={teinte(couleur, 1.12)} opacity={0.6} />
      <ellipse cx={x} cy={base - h} rx={r} ry={ry} fill={couleur} stroke={trait} strokeWidth={0.6} />
      {dernier && <ellipse cx={x} cy={base - h} rx={r * 0.5} ry={ry * 0.5} fill="none" stroke={trait} strokeWidth={0.5} />}
    </g>
  );
}

/** Houppier d'arbre posé à l'altitude `base`, de rayon R. */
function houppier(cle, x, base, R, couleur) {
  const fonce = teinte(couleur, 0.82);
  const trait = teinte(couleur, 0.6);
  return (
    <g key={cle} stroke={trait} strokeWidth={0.6}>
      <ellipse cx={x} cy={base} rx={R * 0.8} ry={R * 0.8 * K * 0.6} fill="rgba(60,70,60,.18)" stroke="none" />
      <circle cx={x} cy={base - R * 1.15} r={R * 0.78} fill={couleur} />
      <circle cx={x - R * 0.5} cy={base - R * 0.62} r={R * 0.58} fill={fonce} />
      <circle cx={x + R * 0.5} cy={base - R * 0.62} r={R * 0.58} fill={teinte(couleur, 0.75)} />
      <circle cx={x} cy={base - R * 0.45} r={R * 0.5} fill={teinte(couleur, 0.88)} />
      <ellipse cx={x - R * 0.28} cy={base - R * 1.42} rx={R * 0.28} ry={R * 0.18} fill="#fff" opacity={0.45} stroke="none" />
    </g>
  );
}

/** Pic rocheux sur le dessus d'une montagne. */
function pic(x, haut, r, s, couleur) {
  const y = haut[0][1];
  const L = [x - r * 0.62, y];
  const R = [x + r * 0.62, y];
  const F = [x, y + r * 0.42 * K];
  const A = [x + r * 0.05, y - s * 0.5];
  const neige = (p, t) => [A[0] + (p[0] - A[0]) * t, A[1] + (p[1] - A[1]) * t];
  const trait = teinte(couleur, 0.6);
  return (
    <g stroke={trait} strokeWidth={0.6} strokeLinejoin="round">
      <polygon points={versPoints([L, F, A])} fill={teinte(couleur, 0.97)} />
      <polygon points={versPoints([F, R, A])} fill={teinte(couleur, 0.78)} />
      <polygon points={versPoints([neige(L, 0.35), neige(F, 0.35), neige(R, 0.35), A])} fill="#fbfdff" />
    </g>
  );
}

/** Fenêtres sur les faces avant d'un niveau de maison. */
function fenetres(haut, bas, couleur) {
  return [
    [2, 3],
    [1, 2],
  ].map(([i, j]) => {
    const cx = (haut[i][0] + haut[j][0] + bas[i][0] + bas[j][0]) / 4;
    const cy = (haut[i][1] + haut[j][1] + bas[i][1] + bas[j][1]) / 4;
    const w = Math.abs(haut[i][0] - haut[j][0]) * 0.28;
    const h = Math.abs(bas[i][1] - haut[i][1]) * 0.42;
    return (
      <rect key={`${i}${j}`} x={cx - w / 2} y={cy - h / 2} width={w} height={h} rx={w * 0.2} fill={teinte(couleur, 0.5)} opacity={0.75} />
    );
  });
}

/** Toit pointu (pyramide hexagonale) sur le dernier niveau d'une maison. */
function toit(x, haut, r, s) {
  const couleur = '#c9573f';
  const base = sommetsHex(x, haut[0][1], r * 1.12);
  const A = [x, haut[0][1] - s * 0.55];
  const ordre = [[4, 5, 1.05], [5, 0, 0.95], [3, 4, 1], [0, 1, 0.74], [1, 2, 0.8], [2, 3, 0.9]];
  return (
    <g stroke={teinte(couleur, 0.6)} strokeWidth={0.6} strokeLinejoin="round">
      {ordre.map(([i, j, f]) => (
        <polygon key={`${i}${j}`} points={versPoints([base[i], base[j], A])} fill={teinte(couleur, f)} />
      ))}
    </g>
  );
}

/** Décor d'une tuile plate : vagues (rivière) ou herbes (prairie). */
function decorPlat(couleur, x, s) {
  return (haut) => {
    const y = haut[0][1];
    if (couleur === 'bleu') {
      return (
        <g fill="none" stroke="#fff" strokeWidth={s * 0.05} strokeLinecap="round" opacity={0.85}>
          {[-0.18, 0.14].map((dy, i) => {
            const x0 = x - s * 0.36 + i * s * 0.12;
            const y0 = y + dy * s;
            return <path key={i} d={`M${x0},${y0} q${s * 0.1},${-s * 0.08} ${s * 0.2},0 t${s * 0.2},0`} />;
          })}
        </g>
      );
    }
    return (
      <g fill="none" stroke="#a7b85c" strokeWidth={s * 0.045} strokeLinecap="round">
        {[[-0.32, 0.06], [0, -0.14], [0.3, 0.08], [-0.05, 0.2]].map(([dx, dy], i) => {
          const x0 = x + dx * s;
          const y0 = y + dy * s;
          return <path key={i} d={`M${x0 - s * 0.07},${y0 - s * 0.12} L${x0},${y0} L${x0 + s * 0.07},${y0 - s * 0.12} M${x0},${y0} L${x0},${y0 - s * 0.15}`} />;
        })}
      </g>
    );
  };
}

/**
 * Construit le dessin d'une pile posée au sol en (x, y).
 * @returns {{ elements: JSX.Element[], surface: number, sommet: number }}
 *   surface : hauteur (px) de la face supérieure où se poserait le pion suivant
 *   sommet  : hauteur (px) du point le plus haut, décor compris
 */
export function construirePile(x, y, s, pile) {
  const elements = [];
  let e = 0;
  let sommet = 0;
  pile.forEach((couleur, i) => {
    const dernier = i === pile.length - 1;
    const c = C[couleur];
    const base = y - e;
    switch (couleur) {
      case 'bleu':
      case 'jaune': {
        const h = s * P.plat;
        elements.push(prisme(i, x, base, s * P.rayon, h, c, decorPlat(couleur, x, s)));
        e += h;
        sommet = e + s * 0.1;
        break;
      }
      case 'gris': {
        const h = s * P.hauteur;
        const r = s * P.rayon;
        elements.push(prisme(i, x, base, r, h, c, dernier ? (haut) => pic(x, haut, r, s, c) : undefined));
        e += h;
        sommet = e + (dernier ? s * 0.5 : 0);
        break;
      }
      case 'marron': {
        const h = s * P.hauteur;
        elements.push(cylindre(i, x, base, s * P.tronc, h, c, dernier));
        e += h;
        sommet = e;
        break;
      }
      case 'vert': {
        const R = s * (pile.length > 1 ? 0.6 : 0.46);
        elements.push(houppier(i, x, base, R, c));
        e += R * 1.9;
        sommet = e;
        break;
      }
      case 'socle': {
        // socle « au choix » des cartes : bloc neutre en pointillés marqué d'un point d'interrogation
        const h = s * P.hauteur;
        const r = s * P.rayon;
        elements.push(
          <g key={i} strokeDasharray="3 2" opacity={0.9}>
            {prisme(i, x, base, r, h, '#ece6f2', (haut, bas) => (
              <text
                x={x - r * 0.35}
                y={(haut[3][1] + bas[3][1]) / 2}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize={s * 0.32}
                fontWeight="800"
                fill="#8d7f99"
                strokeDasharray="none"
              >
                ?
              </text>
            ))}
          </g>,
        );
        e += h;
        sommet = e;
        break;
      }
      case 'rouge': {
        const h = s * P.hauteur;
        const r = s * P.maison;
        elements.push(
          prisme(i, x, base, r, h, c, (haut, bas) => (
            <>
              {fenetres(haut, bas, c)}
              {dernier && toit(x, haut, r, s)}
            </>
          )),
        );
        e += h;
        sommet = e + (dernier ? s * 0.55 : 0);
        break;
      }
      default:
        break;
    }
  });
  return { elements, surface: e, sommet };
}

/** Dessine une pile au sol en (x, y), avec la hauteur indiquée à partir de 2 pions. */
export function Pile({ x, y, s, pile }) {
  const { elements, sommet } = construirePile(x, y, s, pile);
  return (
    <g>
      {elements}
      {pile.length > 1 && (
        <g pointerEvents="none">
          <circle cx={x + s * 0.72} cy={y - sommet * 0.55 - s * 0.1} r={s * 0.22} fill="#fffdf8" stroke="#8a7f74" strokeWidth={0.8} />
          <text
            x={x + s * 0.72}
            y={y - sommet * 0.55 - s * 0.1}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={s * 0.28}
            fontWeight="700"
            fill="#4b4540"
          >
            {pile.length}
          </text>
        </g>
      )}
    </g>
  );
}

/** Un pion isolé, en perspective (pour les tas et la main). */
export function Pion({ couleur, taille = 22, choisi = false }) {
  const s = taille;
  const y = s * 0.4;
  const { elements } = construirePile(0, y, s, [couleur]);
  return (
    <svg width={s * 2} height={s * 1.75} viewBox={`${-s} ${-s * 0.8} ${2 * s} ${1.75 * s}`} aria-label={couleur}>
      {choisi && (
        <ellipse cx={0} cy={y} rx={s * 0.98} ry={s * 0.98 * K} fill="none" stroke="#5c8f7b" strokeWidth={s * 0.12} />
      )}
      {elements}
    </svg>
  );
}
