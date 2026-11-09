// Géométrie d'affichage : hexagones « pointe en haut », lignes impaires décalées.

// Teintes pastel des pions
export const COULEURS_AFFICHAGE = {
  bleu: '#8cc4ea',
  gris: '#b9c0ca',
  marron: '#c9a07c',
  vert: '#93d3a2',
  jaune: '#f2df8f',
  rouge: '#f0a5a0',
};

/** Écrasement vertical de la vue en perspective (1 = vue de dessus). */
export const INCLINAISON = 0.72;

export const SYMBOLES = {
  bleu: '≈',
  gris: '▲',
  marron: '┃',
  vert: '♣',
  jaune: '❦',
  rouge: '⌂',
};

export const NOMS_COULEURS = {
  bleu: 'Rivière',
  gris: 'Montagne',
  marron: 'Tronc',
  vert: 'Feuillage',
  jaune: 'Prairie',
  rouge: 'Bâtiment',
};

const R3 = Math.sqrt(3);

/** Marge au-dessus du plateau pour les piles les plus hautes. */
export const margeHaute = (s) => s * 2.4;

/** Centre (au sol) d'une case (ligne, colonne) pour un rayon `s`, en perspective. */
export function centre(ligne, colonne, s) {
  return {
    x: s * R3 * (colonne + 0.5 * (ligne & 1)) + (s * R3) / 2,
    y: s * 1.5 * INCLINAISON * ligne + margeHaute(s),
  };
}

/** Centre d'une case en coordonnées axiales relatives (pour les motifs des cartes). */
export function centreAxial(q, r, s) {
  return { x: s * R3 * (q + r / 2), y: s * 1.5 * INCLINAISON * r };
}

/** Sommets d'un hexagone « pointe en haut », écrasé verticalement par `k`.
 *  Ordre : 0 droite-haut, 1 droite-bas, 2 bas, 3 gauche-bas, 4 gauche-haut, 5 haut. */
export function sommetsHex(x, y, s, k = INCLINAISON) {
  const pts = [];
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI / 180) * (60 * i - 30);
    pts.push([x + s * Math.cos(a), y + s * Math.sin(a) * k]);
  }
  return pts;
}

export const versPoints = (pts) => pts.map(([x, y]) => `${x.toFixed(2)},${y.toFixed(2)}`).join(' ');

/** Points du polygone d'un hexagone (écrasé par défaut). */
export function pointsHex(x, y, s, k = INCLINAISON) {
  return versPoints(sommetsHex(x, y, s, k));
}

/** Dimensions totales d'un plateau. */
export function dimensions(lignes, colonnes, s) {
  return {
    largeur: s * R3 * (colonnes + 0.5),
    hauteur: margeHaute(s) + s * 1.5 * INCLINAISON * (lignes - 1) + s * INCLINAISON + s * 0.3,
  };
}

/** Assombrit (f < 1) ou éclaircit (f > 1) une couleur #rrggbb. */
export function teinte(hex, f) {
  const n = parseInt(hex.slice(1), 16);
  const c = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) =>
    Math.round(f < 1 ? v * f : v + (255 - v) * (f - 1)),
  );
  return `#${c.map((v) => Math.min(255, Math.max(0, v)).toString(16).padStart(2, '0')).join('')}`;
}

/** Pile représentant une case de motif (pour dessiner les cartes). */
export function pileDuMotif(spec) {
  switch (spec.type) {
    case 'prairie': return ['jaune'];
    case 'riviere': return ['bleu'];
    case 'montagne': return Array(spec.hauteur).fill('gris');
    case 'arbre': return [...Array(spec.hauteur - 1).fill('marron'), 'vert'];
    case 'batiment': return ['socle', 'rouge']; // socle au choix
    default: return [];
  }
}
