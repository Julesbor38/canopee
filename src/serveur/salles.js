// Gestion des salles de jeu à distance, indépendante du réseau (testable seule).
// Le serveur Socket.IO ne fait que relayer vers ce gestionnaire.

import { randomInt, randomUUID } from 'node:crypto';
import { actionBot } from '../moteur/bot.js';
import { appliquerAction, creerPartie, PHASES } from '../moteur/partie.js';

const LETTRES = 'ABCDEFGHJKLMNPQRSTUVWXYZ'; // sans I ni O (confusion avec 1 et 0)
export const MAX_JOUEURS = 4;

/** Retire de l'état les informations cachées (ordre du sac et de la pioche). */
export function etatPublic(etat) {
  if (!etat) return null;
  const { sac, pioche, rng, ...reste } = etat;
  return { ...reste, sac: [], pioche: [], nbSac: sac.length, nbPioche: pioche.length };
}

function nettoyerNom(nom, defaut) {
  const n = String(nom ?? '').trim().slice(0, 20);
  return n || defaut;
}

export class GestionnaireSalles {
  constructor({ genererCode, genererJeton } = {}) {
    this.salles = new Map();
    this.genererCode = genererCode ?? (() => Array.from({ length: 4 }, () => LETTRES[randomInt(LETTRES.length)]).join(''));
    this.genererJeton = genererJeton ?? randomUUID;
  }

  /** Crée une salle ; le créateur en est l'hôte. */
  creer(nom) {
    let code;
    do code = this.genererCode(); while (this.salles.has(code));
    const salle = { code, joueurs: [], etat: null, creeLe: Date.now() };
    this.salles.set(code, salle);
    const place = this.#ajouter(salle, nom, false);
    return { ok: true, code, jeton: place.jeton, index: 0 };
  }

  /** Rejoint une salle par son code. Avec un jeton déjà connu, reprend sa place (reconnexion). */
  rejoindre(code, nom, jeton) {
    const salle = this.salles.get(String(code ?? '').toUpperCase().trim());
    if (!salle) return { ok: false, erreur: 'Salle introuvable' };
    const existant = jeton ? salle.joueurs.findIndex((j) => !j.bot && j.jeton === jeton) : -1;
    if (existant >= 0) {
      salle.joueurs[existant].connecte = true;
      return { ok: true, code: salle.code, jeton, index: existant };
    }
    if (salle.etat) return { ok: false, erreur: 'La partie a déjà commencé' };
    if (salle.joueurs.length >= MAX_JOUEURS) return { ok: false, erreur: 'La salle est pleine' };
    const place = this.#ajouter(salle, nom, false);
    return { ok: true, code: salle.code, jeton: place.jeton, index: salle.joueurs.length - 1 };
  }

  /** L'hôte ajoute un joueur ordinateur. */
  ajouterBot(code, jeton) {
    const salle = this.salles.get(code);
    const err = this.#verifierHote(salle, jeton);
    if (err) return err;
    if (salle.joueurs.length >= MAX_JOUEURS) return { ok: false, erreur: 'La salle est pleine' };
    this.#ajouter(salle, `Ordinateur ${salle.joueurs.filter((j) => j.bot).length + 1}`, true);
    return { ok: true };
  }

  /** L'hôte retire un joueur (ordinateur ou humain) avant le début de la partie. */
  retirer(code, jeton, index) {
    const salle = this.salles.get(code);
    const err = this.#verifierHote(salle, jeton);
    if (err) return err;
    if (index === 0 || !salle.joueurs[index]) return { ok: false, erreur: 'Joueur introuvable' };
    salle.joueurs.splice(index, 1);
    return { ok: true };
  }

  /** L'hôte lance la partie avec les joueurs présents. */
  demarrer(code, jeton, graine = Date.now()) {
    const salle = this.salles.get(code);
    const err = this.#verifierHote(salle, jeton);
    if (err) return err;
    salle.etat = creerPartie({ nbJoueurs: salle.joueurs.length, graine, noms: salle.joueurs.map((j) => j.nom) });
    return { ok: true };
  }

  /** Joue une action pour le joueur identifié par son jeton ; le moteur valide le coup. */
  jouer(code, jeton, action) {
    const salle = this.salles.get(code);
    if (!salle) return { ok: false, erreur: 'Salle introuvable' };
    if (!salle.etat) return { ok: false, erreur: "La partie n'a pas commencé" };
    const index = salle.joueurs.findIndex((j) => j.jeton === jeton);
    if (index < 0) return { ok: false, erreur: 'Joueur inconnu' };
    const res = appliquerAction(salle.etat, index, action);
    if (res.ok) salle.etat = res.etat;
    return res.ok ? { ok: true } : res;
  }

  /** Vrai si c'est au tour d'un ordinateur. */
  tourDeBot(code) {
    const salle = this.salles.get(code);
    return !!salle?.etat && salle.etat.phase !== PHASES.FIN && salle.joueurs[salle.etat.joueurCourant].bot;
  }

  /** Fait jouer une action à l'ordinateur dont c'est le tour. */
  jouerBot(code) {
    if (!this.tourDeBot(code)) return { ok: false, erreur: "Ce n'est pas le tour d'un ordinateur" };
    const salle = this.salles.get(code);
    const res = appliquerAction(salle.etat, salle.etat.joueurCourant, actionBot(salle.etat));
    if (res.ok) salle.etat = res.etat;
    return res.ok ? { ok: true } : res;
  }

  /** Marque un joueur comme déconnecté (sa place reste réservée). */
  deconnecter(code, jeton) {
    const j = this.salles.get(code)?.joueurs.find((x) => x.jeton === jeton);
    if (j) j.connecte = false;
  }

  /** Supprime les salles sans aucun humain connecté depuis plus de `delaiMs`.
   *  TODO: à valider — durée de conservation d'une salle abandonnée. */
  nettoyer(delaiMs, maintenant = Date.now()) {
    for (const [code, salle] of this.salles) {
      const humains = salle.joueurs.filter((j) => !j.bot);
      if (humains.every((j) => !j.connecte)) {
        salle.videDepuis ??= maintenant;
        if (maintenant - salle.videDepuis >= delaiMs) this.salles.delete(code);
      } else {
        salle.videDepuis = null;
      }
    }
  }

  /** Vue publique d'une salle, envoyée à tous ses membres. */
  vue(code) {
    const salle = this.salles.get(code);
    if (!salle) return null;
    return {
      code: salle.code,
      joueurs: salle.joueurs.map((j, i) => ({ nom: j.nom, connecte: j.connecte, bot: j.bot, hote: i === 0 })),
      etat: etatPublic(salle.etat),
    };
  }

  #ajouter(salle, nom, bot) {
    const place = {
      nom: nettoyerNom(nom, `Joueur ${salle.joueurs.length + 1}`),
      jeton: bot ? `bot-${this.genererJeton()}` : this.genererJeton(),
      connecte: true,
      bot,
    };
    salle.joueurs.push(place);
    return place;
  }

  #verifierHote(salle, jeton) {
    if (!salle) return { ok: false, erreur: 'Salle introuvable' };
    if (salle.joueurs[0]?.jeton !== jeton) return { ok: false, erreur: "Seul l'hôte peut faire cela" };
    if (salle.etat) return { ok: false, erreur: 'La partie a déjà commencé' };
    return null;
  }
}
