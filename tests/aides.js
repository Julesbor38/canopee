// Aides pour construire des plateaux d'exemple dans les tests.
import { creerPlateau } from '../src/moteur/plateau.js';
import config from '../rules.config.js';

export const B = 'bleu', G = 'gris', M = 'marron', V = 'vert', J = 'jaune', R = 'rouge';

/** Plateau 6×8 à partir d'un objet { 'ligne,colonne': [pile] }. */
export function plateau(cases = {}) {
  const p = creerPlateau(config.plateau.lignes, config.plateau.colonnes);
  for (const [cle, pile] of Object.entries(cases)) {
    const [l, c] = cle.split(',').map(Number);
    p.cases[l][c].pile = [...pile];
  }
  return p;
}

export { config };
