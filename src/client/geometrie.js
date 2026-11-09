// Géométrie d'affichage : hexagones « pointe en haut », lignes impaires décalées.

export const COULEURS_AFFICHAGE = {
  bleu: '#3d8fd1',
  gris: '#8a9199',
  marron: '#8b5a2b',
  vert: '#3c9d4b',
  jaune: '#e6c34a',
  rouge: '#c8453b',
};

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

/** Centre d'une case (ligne, colonne) pour un rayon `s`. */
export function centre(ligne, colonne, s) {
  return { x: s * R3 * (colonne + 0.5 * (ligne & 1)) + (s * R3) / 2, y: s * 1.5 * ligne + s };
}

/** Centre d'une case en coordonnées axiales relatives (pour les motifs des cartes). */
export function centreAxial(q, r, s) {
  return { x: s * R3 * (q + r / 2), y: s * 1.5 * r };
}

/** Points du polygone d'un hexagone. */
export function pointsHex(x, y, s) {
  const pts = [];
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI / 180) * (60 * i - 30);
    pts.push(`${(x + s * Math.cos(a)).toFixed(2)},${(y + s * Math.sin(a)).toFixed(2)}`);
  }
  return pts.join(' ');
}

/** Dimensions totales d'un plateau. */
export function dimensions(lignes, colonnes, s) {
  return { largeur: s * R3 * (colonnes + 0.5), hauteur: s * (1.5 * (lignes - 1) + 2) };
}

/** Pile représentant une case de motif (pour dessiner les cartes). */
export function pileDuMotif(spec) {
  switch (spec.type) {
    case 'prairie': return ['jaune'];
    case 'riviere': return ['bleu'];
    case 'montagne': return Array(spec.hauteur).fill('gris');
    case 'arbre': return [...Array(spec.hauteur - 1).fill('marron'), 'vert'];
    case 'batiment': return ['gris', 'rouge'];
    default: return [];
  }
}
