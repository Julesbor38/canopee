// Reconnaissance des motifs des cartes animaux.

import { COULEURS } from '../../rules.config.js';
import { abscisse, refleter, tournerN, versAxial, versDecale } from './hex.js';
import { caseDe } from './plateau.js';

const { BLEU, GRIS, MARRON, VERT, JAUNE, ROUGE } = COULEURS;

/** Vérifie qu'une pile correspond exactement à la description d'une case de motif. */
export function pileCorrespond(pile, spec) {
  switch (spec.type) {
    case 'prairie':
      return pile.length === 1 && pile[0] === JAUNE;
    case 'riviere':
      return pile.length === 1 && pile[0] === BLEU;
    case 'montagne':
      return pile.length === spec.hauteur && pile.every((c) => c === GRIS);
    case 'arbre':
      return (
        pile.length === spec.hauteur &&
        pile[pile.length - 1] === VERT &&
        pile.slice(0, -1).every((c) => c === MARRON)
      );
    case 'batiment':
      return pile.length === 2 && pile[1] === ROUGE;
    default:
      return false;
  }
}

/** Index de la case qui reçoit le cube : la plus à droite du motif tel qu'imprimé sur la carte.
 *  TODO: à valider — règle par défaut ; un motif peut aussi fixer `cible` explicitement. */
export function indexCible(def) {
  if (def.cible !== undefined) return def.cible;
  let meilleur = 0;
  def.motif.forEach((m, i) => {
    if (abscisse(m.q, m.r) > abscisse(def.motif[meilleur].q, def.motif[meilleur].r)) meilleur = i;
  });
  return meilleur;
}

/** Toutes les réalisations du motif sur le plateau.
 *  Renvoie une liste de { cases: [{ligne, colonne}], cible: {ligne, colonne} }.
 *  Seule la case cible doit être libre de cube : les autres cases peuvent être réutilisées
 *  (TODO: à valider). Pour éviter qu'un même groupe de cases donne plusieurs animaux, la case
 *  cible d'un motif est toujours d'un type unique dans ce motif (vérifié par les tests). */
export function occurrences(plateau, def, config) {
  const iCible = indexCible(def);
  const base = def.motif[0];
  const rel = def.motif.map((m) => ({ q: m.q - base.q, r: m.r - base.r }));
  const nbRotations = config.cartes.rotations ? 6 : 1;
  // motif et image miroir : l'ordre des cases autour du motif n'a pas d'importance
  const variantes = config.cartes.symetries ? [rel, rel.map((p) => refleter(p.q, p.r))] : [rel];
  const res = [];
  const vues = new Set();
  for (let l = 0; l < plateau.lignes; l++) {
    for (let c = 0; c < plateau.colonnes; c++) {
      const ancre = versAxial(l, c);
      for (const forme of variantes) for (let rot = 0; rot < nbRotations; rot++) {
        const cases = [];
        let ok = true;
        for (let i = 0; i < forme.length && ok; i++) {
          const d = tournerN(forme[i].q, forme[i].r, rot);
          const pos = versDecale(ancre.q + d.q, ancre.r + d.r);
          const kase = caseDe(plateau, pos.ligne, pos.colonne);
          if (!kase || !pileCorrespond(kase.pile, def.motif[i])) ok = false;
          else cases.push(pos);
        }
        if (!ok) continue;
        const cible = cases[iCible];
        if (plateau.cases[cible.ligne][cible.colonne].cube) continue;
        const cle = cases.map((p) => `${p.ligne},${p.colonne}`).join('|');
        if (vues.has(cle)) continue;
        vues.add(cle);
        res.push({ cases, cible });
      }
    }
  }
  return res;
}

/** Cases cibles distinctes où un cube de cette carte peut être posé. */
export function ciblesPossibles(plateau, def, config) {
  const vues = new Map();
  for (const o of occurrences(plateau, def, config)) {
    vues.set(`${o.cible.ligne},${o.cible.colonne}`, o.cible);
  }
  return [...vues.values()];
}
