// Calcul des points d'un plateau.

import { COULEURS } from '../../rules.config.js';
import { groupes, sommet, voisinsDe } from './plateau.js';

const { BLEU, GRIS, VERT, JAUNE, ROUGE } = COULEURS;

/** Arbres : chaque pile surmontée d'un vert, selon sa hauteur (1, 2 ou 3 pions). */
export function scoreArbres(plateau, config) {
  const bareme = config.scoring.arbres;
  let total = 0;
  for (const ligne of plateau.cases) {
    for (const kase of ligne) {
      if (sommet(kase) === VERT) total += bareme[kase.pile.length] ?? 0;
    }
  }
  return total;
}

/** Montagnes : chaque pile de gris, selon sa hauteur, si elle touche une autre montagne. */
export function scoreMontagnes(plateau, config) {
  const bareme = config.scoring.montagnes;
  let total = 0;
  for (let l = 0; l < plateau.lignes; l++) {
    for (let c = 0; c < plateau.colonnes; c++) {
      const kase = plateau.cases[l][c];
      if (sommet(kase) !== GRIS) continue;
      const accolee = voisinsDe(plateau, l, c).some(
        (v) => sommet(plateau.cases[v.ligne][v.colonne]) === GRIS,
      );
      if (accolee) total += bareme[kase.pile.length] ?? 0;
    }
  }
  return total;
}

/** Points d'une rivière de longueur n. */
export function pointsRiviere(n, config) {
  const { table, parCaseSupplementaire } = config.scoring.rivieres;
  if (n <= 0) return 0;
  if (table[n] !== undefined) return table[n];
  const max = Math.max(...Object.keys(table).map(Number));
  return table[max] + (n - max) * parCaseSupplementaire;
}

/** Rivières : groupes connexes de cases bleues.
 *  TODO: à valider — la longueur d'une rivière est le nombre de cases de son groupe connexe. */
export function scoreRivieres(plateau, config) {
  const longueurs = groupes(plateau, (k) => sommet(k) === BLEU).map((g) => g.length);
  if (!longueurs.length) return 0;
  if (config.scoring.rivieres.seulementLaPlusLongue) {
    return pointsRiviere(Math.max(...longueurs), config);
  }
  return longueurs.reduce((s, n) => s + pointsRiviere(n, config), 0);
}

/** Prairies : points par groupe d'au moins N cases jaunes adjacentes. */
export function scorePrairies(plateau, config) {
  const { pointsParGroupe, tailleMin } = config.scoring.prairies;
  return groupes(plateau, (k) => sommet(k) === JAUNE).filter((g) => g.length >= tailleMin).length *
    pointsParGroupe;
}

/** Bâtiments : rouge au sommet d'une pile de 2, entouré d'au moins 3 couleurs différentes. */
export function scoreBatiments(plateau, config) {
  const { points, couleursMin, hauteurMin } = config.scoring.batiments;
  let total = 0;
  for (let l = 0; l < plateau.lignes; l++) {
    for (let c = 0; c < plateau.colonnes; c++) {
      const kase = plateau.cases[l][c];
      if (sommet(kase) !== ROUGE || kase.pile.length < hauteurMin) continue;
      const couleurs = new Set();
      for (const v of voisinsDe(plateau, l, c)) {
        const s = sommet(plateau.cases[v.ligne][v.colonne]);
        if (s) couleurs.add(s);
      }
      if (couleurs.size >= couleursMin) total += points;
    }
  }
  return total;
}

/** Difficulté d'un motif : somme des coûts de ses cases, plus un supplément de forme. */
export function difficulteMotif(def, config) {
  const { couts, supplementForme3 } = config.scoring.animaux;
  let d = 0;
  for (const m of def.motif) {
    const c = couts[m.type];
    d += typeof c === 'object' ? c[m.hauteur] : c;
  }
  if (def.motif.length >= 3) d += supplementForme3;
  return d;
}

/** Piste de points d'une carte : score cumulé après 1, 2, … n cubes. */
export function baremeCarte(def, config) {
  if (def.points) return def.points;
  const d = difficulteMotif(def, config);
  const { progression } = config.scoring.animaux;
  const piste = [];
  let total = 0;
  for (let n = 0; n < def.cubes; n++) {
    total += Math.max(1, Math.round(d * (1 + progression * n)));
    piste.push(total);
  }
  return piste;
}

/** Cartes animaux : la carte rapporte la valeur de la dernière case couverte de sa piste. */
export function scoreAnimaux(cartes, definitions, config) {
  let total = 0;
  for (const carte of cartes) {
    if (carte.cubesPoses > 0) total += baremeCarte(definitions[carte.id], config)[carte.cubesPoses - 1];
  }
  return total;
}

/** Détail des points d'un joueur. */
export function scoreJoueur(joueur, definitions, config) {
  const p = joueur.plateau;
  const detail = {
    arbres: scoreArbres(p, config),
    montagnes: scoreMontagnes(p, config),
    rivieres: scoreRivieres(p, config),
    prairies: scorePrairies(p, config),
    batiments: scoreBatiments(p, config),
    animaux: scoreAnimaux(joueur.cartes, definitions, config),
  };
  detail.total = Object.values(detail).reduce((a, b) => a + b, 0);
  return detail;
}
