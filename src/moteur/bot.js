// Joueur automatique très simple et déterministe.
// Sert aux tests de parties complètes et peut servir d'adversaire.

import { cartesEnCours, appliquerAction, PHASES } from './partie.js';
import { ciblesPossibles } from './motifs.js';
import { casesPossibles } from './plateau.js';

/** Choisit la prochaine action du joueur courant. */
export function actionBot(etat) {
  const i = etat.joueurCourant;
  const joueur = etat.joueurs[i];
  const cfg = etat.config;

  if (etat.phase === PHASES.CHOIX) {
    const tas = etat.tas.findIndex((t) => t);
    const peutPrendre = cartesEnCours(joueur, etat.definitions).length < cfg.cartes.maxEnMain;
    const carte = peutPrendre ? etat.cartesVisibles.findIndex((c) => c) : -1;
    return { type: 'prendreTas', tas, carte: carte >= 0 ? carte : undefined };
  }

  // Poser un cube dès qu'un motif est réalisé
  for (const carte of cartesEnCours(joueur, etat.definitions)) {
    const cibles = ciblesPossibles(joueur.plateau, etat.definitions[carte.id], cfg);
    if (cibles.length) return { type: 'poserAnimal', carte: carte.uid, ...cibles[0] };
  }

  // Poser le premier pion posable sur la première case possible
  for (let k = 0; k < etat.main.length; k++) {
    const cases = casesPossibles(joueur.plateau, etat.main[k], cfg);
    if (cases.length) return { type: 'poserPion', pion: k, ...cases[0] };
  }
  return { type: 'finTour' };
}

/** Joue une partie entière avec des bots. Renvoie l'état final. */
export function jouerPartieAuto(etat, maxActions = 10000) {
  let e = etat;
  for (let n = 0; n < maxActions && e.phase !== PHASES.FIN; n++) {
    const res = appliquerAction(e, e.joueurCourant, actionBot(e));
    if (!res.ok) throw new Error(`Action du bot refusée : ${res.erreur}`);
    e = res.etat;
  }
  return e;
}
