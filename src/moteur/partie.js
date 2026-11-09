// Déroulement d'une partie.
// L'état est un objet JSON pur (sérialisable, transmissible par le réseau).
// `appliquerAction` ne modifie jamais l'état reçu : elle renvoie un nouvel état.

import configParDefaut, { CARTES_ANIMAUX } from '../../rules.config.js';
import { melanger, normaliserGraine } from './hasard.js';
import { ciblesPossibles } from './motifs.js';
import { casesPossibles, creerPlateau, poser, verifierPose } from './plateau.js';
import { baremeCarte, scoreJoueur } from './score.js';

export const PHASES = { CHOIX: 'choix', PLACEMENT: 'placement', FIN: 'fin' };

function fusion(base, surcharge) {
  if (!surcharge) return structuredClone(base);
  const res = structuredClone(base);
  for (const [k, v] of Object.entries(surcharge)) {
    res[k] = v && typeof v === 'object' && !Array.isArray(v) && typeof res[k] === 'object'
      ? fusion(res[k], v)
      : structuredClone(v);
  }
  return res;
}

function piocherTas(etat) {
  const n = Math.min(etat.config.pionsParTas, etat.sac.length);
  if (n === 0) return null;
  return etat.sac.splice(etat.sac.length - n, n);
}

function piocherCarte(etat) {
  return etat.pioche.length ? etat.pioche.pop() : null;
}

/**
 * Crée une nouvelle partie.
 * @param {object} options
 * @param {number} options.nbJoueurs 1 à 4
 * @param {number|string} [options.graine]
 * @param {string[]} [options.noms]
 * @param {object} [options.config] surcharge partielle de rules.config.js
 * @param {object[]} [options.cartes] définitions des cartes animaux
 */
export function creerPartie({ nbJoueurs, graine = Date.now(), noms = [], config, cartes = CARTES_ANIMAUX } = {}) {
  if (!Number.isInteger(nbJoueurs) || nbJoueurs < 1 || nbJoueurs > 4) {
    throw new Error('Le nombre de joueurs doit être compris entre 1 et 4');
  }
  const cfg = fusion(configParDefaut, config);
  let rng = normaliserGraine(graine);

  const sac = [];
  for (const [couleur, n] of Object.entries(cfg.sac)) for (let i = 0; i < n; i++) sac.push(couleur);
  rng = melanger(sac, rng);

  // la piste de points de chaque carte est calculée une fois pour toutes (affichée sur la carte)
  const definitions = Object.fromEntries(cartes.map((c) => [c.id, { ...c, points: baremeCarte(c, cfg) }]));
  const pioche = [];
  for (let e = 0; e < cfg.cartes.exemplaires; e++) {
    for (const c of cartes) pioche.push({ uid: `${c.id}-${e + 1}`, id: c.id });
  }
  rng = melanger(pioche, rng);

  const etat = {
    graine,
    rng,
    config: cfg,
    definitions,
    sac,
    pioche,
    tas: [],
    cartesVisibles: [],
    joueurs: Array.from({ length: nbJoueurs }, (_, i) => ({
      nom: noms[i] || `Joueur ${i + 1}`,
      plateau: creerPlateau(cfg.plateau.lignes, cfg.plateau.colonnes),
      cartes: [], // { uid, id, cubesPoses }
    })),
    joueurCourant: 0,
    tour: 1,
    phase: PHASES.CHOIX,
    main: [], // pions à poser ce tour-ci
    finDePartie: null, // { raison, scores }
    journal: [],
  };
  for (let i = 0; i < cfg.nbTas; i++) etat.tas.push(piocherTas(etat));
  for (let i = 0; i < cfg.cartes.visibles; i++) etat.cartesVisibles.push(piocherCarte(etat));
  return etat;
}

/** Scores de tous les joueurs. */
export function calculerScores(etat) {
  return etat.joueurs.map((j) => scoreJoueur(j, etat.definitions, etat.config));
}

function terminer(etat, raison) {
  etat.phase = PHASES.FIN;
  etat.main = [];
  etat.finDePartie = { raison, scores: calculerScores(etat) };
  etat.journal.push(`Fin de partie : ${raison}`);
}

/** Vrai si au moins un pion de la main peut être posé. */
function mainJouable(etat) {
  const p = etat.joueurs[etat.joueurCourant].plateau;
  return etat.main.some((c) => casesPossibles(p, c, etat.config).length > 0);
}

/** Cartes non terminées d'un joueur. */
export function cartesEnCours(joueur, definitions) {
  return joueur.cartes.filter((c) => c.cubesPoses < definitions[c.id].cubes);
}

function erreur(message) {
  return { ok: false, erreur: message };
}

/**
 * Applique une action du joueur `indexJoueur`.
 * Actions :
 *  { type: 'prendreTas', tas: i, carte?: j }      — prend le tas i (et la carte visible j)
 *  { type: 'poserPion', pion: k, ligne, colonne } — pose le k-ième pion de la main
 *  { type: 'poserAnimal', carte: uid, ligne, colonne } — pose un cube sur une case cible
 *  { type: 'finTour' }
 * @returns {{ok: true, etat: object} | {ok: false, erreur: string}}
 */
export function appliquerAction(etatInitial, indexJoueur, action) {
  if (etatInitial.phase === PHASES.FIN) return erreur('La partie est terminée');
  if (indexJoueur !== etatInitial.joueurCourant) return erreur("Ce n'est pas votre tour");
  if (!action || typeof action.type !== 'string') return erreur('Action invalide');
  // Les actions peuvent venir du réseau : les index doivent être des entiers.
  const champs = { prendreTas: ['tas'], poserPion: ['pion', 'ligne', 'colonne'], poserAnimal: ['ligne', 'colonne'] };
  if ((champs[action.type] ?? []).some((k) => !Number.isInteger(action[k]))) return erreur('Action invalide');
  if (action.type === 'prendreTas' && action.carte != null && !Number.isInteger(action.carte)) {
    return erreur('Action invalide');
  }

  const etat = structuredClone(etatInitial);
  const joueur = etat.joueurs[indexJoueur];
  const cfg = etat.config;

  switch (action.type) {
    case 'prendreTas': {
      if (etat.phase !== PHASES.CHOIX) return erreur('Vous avez déjà pris un tas ce tour-ci');
      const tas = etat.tas[action.tas];
      if (!tas) return erreur('Ce tas est vide ou inexistant');
      if (action.carte !== undefined && action.carte !== null) {
        const carte = etat.cartesVisibles[action.carte];
        if (!carte) return erreur('Cette carte est indisponible');
        if (cartesEnCours(joueur, etat.definitions).length >= cfg.cartes.maxEnMain) {
          return erreur(`Vous avez déjà ${cfg.cartes.maxEnMain} cartes en cours`);
        }
        joueur.cartes.push({ ...carte, cubesPoses: 0 });
        etat.cartesVisibles[action.carte] = piocherCarte(etat);
        etat.journal.push(`${joueur.nom} prend la carte ${etat.definitions[carte.id].nom}`);
      }
      etat.main = tas;
      etat.tas[action.tas] = piocherTas(etat); // le tas est aussitôt remplacé
      etat.phase = PHASES.PLACEMENT;
      etat.journal.push(`${joueur.nom} prend le tas ${action.tas + 1} (${tas.join(', ')})`);
      if (!mainJouable(etat)) terminer(etat, `${joueur.nom} ne peut plus poser de pion`);
      return { ok: true, etat };
    }

    case 'poserPion': {
      if (etat.phase !== PHASES.PLACEMENT) return erreur("Prenez d'abord un tas");
      const couleur = etat.main[action.pion];
      if (!couleur) return erreur('Pion introuvable dans votre main');
      const v = verifierPose(joueur.plateau, action.ligne, action.colonne, couleur, cfg);
      if (!v.ok) return erreur(v.raison);
      poser(joueur.plateau, action.ligne, action.colonne, couleur, cfg);
      etat.main.splice(action.pion, 1);
      if (etat.main.length && !mainJouable(etat)) {
        terminer(etat, `${joueur.nom} ne peut plus poser de pion`);
      }
      return { ok: true, etat };
    }

    case 'poserAnimal': {
      if (etat.phase !== PHASES.PLACEMENT) return erreur("Prenez d'abord un tas");
      const carte = joueur.cartes.find((c) => c.uid === action.carte);
      if (!carte) return erreur("Vous n'avez pas cette carte");
      const def = etat.definitions[carte.id];
      if (carte.cubesPoses >= def.cubes) return erreur('Cette carte est déjà terminée');
      const cibles = ciblesPossibles(joueur.plateau, def, cfg);
      if (!cibles.some((c) => c.ligne === action.ligne && c.colonne === action.colonne)) {
        return erreur(`Le motif ${def.nom} n'est pas réalisé sur cette case`);
      }
      joueur.plateau.cases[action.ligne][action.colonne].cube = carte.uid;
      carte.cubesPoses++;
      etat.journal.push(`${joueur.nom} pose un cube ${def.nom}`);
      return { ok: true, etat };
    }

    case 'finTour': {
      if (etat.phase !== PHASES.PLACEMENT) return erreur("Prenez d'abord un tas");
      if (etat.main.length) return erreur('Posez tous vos pions avant de finir le tour');
      etat.joueurCourant = (etat.joueurCourant + 1) % etat.joueurs.length;
      if (etat.joueurCourant === 0) etat.tour++;
      etat.phase = PHASES.CHOIX;
      if (etat.tas.every((t) => !t)) terminer(etat, 'Plus aucun tas à prendre');
      return { ok: true, etat };
    }

    default:
      return erreur(`Action inconnue : ${action.type}`);
  }
}
