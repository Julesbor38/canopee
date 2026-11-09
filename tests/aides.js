// Aides pour construire des plateaux d'exemple dans les tests.
import { creerPlateau } from '../src/moteur/plateau.js';
import config from '../rules.config.js';

export const B = 'bleu', G = 'gris', M = 'marron', V = 'vert', J = 'jaune', R = 'rouge';

/** Plateau d'exemple 6×8 (indépendant de la taille du plateau de jeu, assez large pour
 *  tracer une rivière de 8 cases en ligne droite) à partir d'un objet { 'ligne,colonne': [pile] }. */
export function plateau(cases = {}) {
  const p = creerPlateau(6, 8);
  for (const [cle, pile] of Object.entries(cases)) {
    const [l, c] = cle.split(',').map(Number);
    p.cases[l][c].pile = [...pile];
  }
  return p;
}

export { config };
