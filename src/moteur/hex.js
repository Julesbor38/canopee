// Géométrie hexagonale.
// Le plateau utilise des hexagones « pointe en haut » en coordonnées décalées
// « odd-r » : (ligne, colonne), les lignes impaires sont décalées d'une
// demi-case vers la droite. Les calculs de voisinage et de rotation passent
// par les coordonnées axiales (q, r).

/** Directions axiales des 6 voisins. */
export const DIRECTIONS = [
  { q: 1, r: 0 },
  { q: 1, r: -1 },
  { q: 0, r: -1 },
  { q: -1, r: 0 },
  { q: -1, r: 1 },
  { q: 0, r: 1 },
];

/** (ligne, colonne) → axial (q, r). */
export function versAxial(ligne, colonne) {
  return { q: colonne - (ligne - (ligne & 1)) / 2, r: ligne };
}

/** axial (q, r) → (ligne, colonne). */
export function versDecale(q, r) {
  return { ligne: r, colonne: q + (r - (r & 1)) / 2 };
}

/** Rotation de 60° (sens horaire à l'écran) d'un vecteur axial. */
export function tourner(q, r) {
  return { q: -r, r: q + r };
}

/** Rotation de n × 60°. */
export function tournerN(q, r, n) {
  let p = { q, r };
  for (let i = 0; i < ((n % 6) + 6) % 6; i++) p = tourner(p.q, p.r);
  return p;
}

/** Symétrie axiale d'un vecteur axial (échange de deux coordonnées cubiques) :
 *  combinée aux 6 rotations, elle donne les 12 symétries de l'hexagone. */
export function refleter(q, r) {
  return { q: r, r: q };
}

/** Abscisse « visuelle » d'une case axiale (sert à trouver la case la plus à droite). */
export function abscisse(q, r) {
  return q + r / 2;
}

/** Voisins d'une case, limités au plateau. */
export function voisins(ligne, colonne, lignes, colonnes) {
  const { q, r } = versAxial(ligne, colonne);
  const res = [];
  for (const d of DIRECTIONS) {
    const v = versDecale(q + d.q, r + d.r);
    if (v.ligne >= 0 && v.ligne < lignes && v.colonne >= 0 && v.colonne < colonnes) res.push(v);
  }
  return res;
}
