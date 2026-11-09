// Plateau d'un joueur : grille de cases, chacune portant une pile de pions
// (couleurs du bas vers le haut) et éventuellement un cube animal.

import { voisins } from './hex.js';

/** Crée un plateau vide. */
export function creerPlateau(lignes, colonnes) {
  return {
    lignes,
    colonnes,
    cases: Array.from({ length: lignes }, () =>
      Array.from({ length: colonnes }, () => ({ pile: [], cube: null })),
    ),
  };
}

/** Crée un plateau à partir d'une description texte (pratique pour les tests).
 *  `grille` : tableau de lignes, chaque ligne = tableau de piles (tableaux de couleurs). */
export function plateauDepuis(grille, lignes = 6, colonnes = 8) {
  const p = creerPlateau(lignes, colonnes);
  grille.forEach((ligne, l) =>
    ligne.forEach((pile, c) => {
      if (pile) p.cases[l][c].pile = [...pile];
    }),
  );
  return p;
}

export function dansPlateau(plateau, ligne, colonne) {
  return ligne >= 0 && ligne < plateau.lignes && colonne >= 0 && colonne < plateau.colonnes;
}

export function caseDe(plateau, ligne, colonne) {
  return dansPlateau(plateau, ligne, colonne) ? plateau.cases[ligne][colonne] : null;
}

export function sommet(kase) {
  return kase.pile.length ? kase.pile[kase.pile.length - 1] : null;
}

export function voisinsDe(plateau, ligne, colonne) {
  return voisins(ligne, colonne, plateau.lignes, plateau.colonnes);
}

function memePile(a, b) {
  return a.length === b.length && a.every((x, i) => x === b[i]);
}

/** Indique si un pion de `couleur` peut être posé sur la case. Renvoie { ok, raison }. */
export function verifierPose(plateau, ligne, colonne, couleur, config) {
  const kase = caseDe(plateau, ligne, colonne);
  if (!kase) return { ok: false, raison: 'Case hors du plateau' };
  // Une case qui porte un cube animal ne peut plus rien recevoir.
  if (kase.cube) return { ok: false, raison: 'Case bloquée par un cube animal' };
  const acceptees = config.empilement[couleur];
  if (!acceptees) return { ok: false, raison: `Couleur inconnue : ${couleur}` };
  if (!acceptees.some((p) => memePile(p, kase.pile))) {
    return { ok: false, raison: `Impossible de poser ${couleur} sur [${kase.pile.join(', ') || 'vide'}]` };
  }
  return { ok: true };
}

/** Pose un pion (mutation). Lève une erreur si la pose est illégale. */
export function poser(plateau, ligne, colonne, couleur, config) {
  const v = verifierPose(plateau, ligne, colonne, couleur, config);
  if (!v.ok) throw new Error(v.raison);
  plateau.cases[ligne][colonne].pile.push(couleur);
}

/** Liste des cases où un pion de `couleur` peut être posé. */
export function casesPossibles(plateau, couleur, config) {
  const res = [];
  for (let l = 0; l < plateau.lignes; l++) {
    for (let c = 0; c < plateau.colonnes; c++) {
      if (verifierPose(plateau, l, c, couleur, config).ok) res.push({ ligne: l, colonne: c });
    }
  }
  return res;
}

/** Groupes connexes de cases vérifiant `predicat(case)`. */
export function groupes(plateau, predicat) {
  const vus = new Set();
  const res = [];
  for (let l = 0; l < plateau.lignes; l++) {
    for (let c = 0; c < plateau.colonnes; c++) {
      const cle = `${l},${c}`;
      if (vus.has(cle) || !predicat(plateau.cases[l][c])) continue;
      const groupe = [];
      const file = [{ ligne: l, colonne: c }];
      vus.add(cle);
      while (file.length) {
        const cur = file.pop();
        groupe.push(cur);
        for (const v of voisinsDe(plateau, cur.ligne, cur.colonne)) {
          const k = `${v.ligne},${v.colonne}`;
          if (!vus.has(k) && predicat(plateau.cases[v.ligne][v.colonne])) {
            vus.add(k);
            file.push(v);
          }
        }
      }
      res.push(groupe);
    }
  }
  return res;
}
