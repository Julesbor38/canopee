import { describe, expect, it } from 'vitest';
import { appliquerAction, calculerScores, creerPartie, PHASES } from '../src/moteur/partie.js';
import { jouerPartieAuto } from '../src/moteur/bot.js';
import { G, J, V } from './aides.js';

/** Applique une action et vérifie qu'elle est acceptée. */
function jouer(etat, action, joueur = etat.joueurCourant) {
  const r = appliquerAction(etat, joueur, action);
  if (!r.ok) throw new Error(r.erreur);
  return r.etat;
}

describe('Mise en place', () => {
  it('5 tas de 3 pions, un plateau 6×8 par joueur', () => {
    const e = creerPartie({ nbJoueurs: 3, graine: 1 });
    expect(e.tas).toHaveLength(5);
    expect(e.tas.every((t) => t.length === 3)).toBe(true);
    expect(e.joueurs).toHaveLength(3);
    expect(e.cartesVisibles.filter(Boolean)).toHaveLength(5);
    expect(e.sac.length).toBe(120 - 15);
  });

  it('refuse 0 ou 5 joueurs', () => {
    expect(() => creerPartie({ nbJoueurs: 0 })).toThrow();
    expect(() => creerPartie({ nbJoueurs: 5 })).toThrow();
  });

  it("l'état est sérialisable en JSON", () => {
    const e = creerPartie({ nbJoueurs: 2, graine: 3 });
    expect(JSON.parse(JSON.stringify(e))).toEqual(e);
  });
});

describe('Tour de jeu', () => {
  it('prendre un tas le remplace aussitôt et donne 3 pions à poser', () => {
    const e0 = creerPartie({ nbJoueurs: 2, graine: 7 });
    const pris = e0.tas[2];
    const e1 = jouer(e0, { type: 'prendreTas', tas: 2 });
    expect(e1.main).toEqual(pris);
    expect(e1.tas[2]).toHaveLength(3);
    expect(e1.tas[2]).not.toBe(e0.tas[2]);
    expect(e1.sac.length).toBe(e0.sac.length - 3);
    expect(e1.phase).toBe(PHASES.PLACEMENT);
  });

  it("n'altère pas l'état d'origine", () => {
    const e0 = creerPartie({ nbJoueurs: 2, graine: 7 });
    const copie = structuredClone(e0);
    jouer(e0, { type: 'prendreTas', tas: 0, carte: 0 });
    expect(e0).toEqual(copie);
  });

  it('la carte se prend avec le tas, une seule par tour', () => {
    const e0 = creerPartie({ nbJoueurs: 2, graine: 7 });
    const carte = e0.cartesVisibles[1];
    const e1 = jouer(e0, { type: 'prendreTas', tas: 0, carte: 1 });
    expect(e1.joueurs[0].cartes).toEqual([{ ...carte, cubesPoses: 0 }]);
    expect(e1.cartesVisibles[1]).not.toEqual(carte);
    expect(appliquerAction(e1, 0, { type: 'prendreTas', tas: 1, carte: 0 }).ok).toBe(false);
  });

  it('limite le nombre de cartes en cours', () => {
    let e = creerPartie({ nbJoueurs: 1, graine: 7, config: { cartes: { maxEnMain: 1 } } });
    e = jouer(e, { type: 'prendreTas', tas: 0, carte: 0 });
    while (e.main.length) {
      const c = e.main[0];
      const libre = e.joueurs[0].plateau.cases.flat().findIndex((k) => !k.pile.length);
      e = jouer(e, { type: 'poserPion', pion: 0, ligne: Math.floor(libre / 8), colonne: libre % 8 });
      expect(c).toBeTruthy();
    }
    e = jouer(e, { type: 'finTour' });
    const r = appliquerAction(e, 0, { type: 'prendreTas', tas: 0, carte: 0 });
    expect(r.ok).toBe(false);
    expect(r.erreur).toMatch(/cartes en cours/);
  });

  it("refuse les actions hors tour ou hors phase", () => {
    const e0 = creerPartie({ nbJoueurs: 2, graine: 7 });
    expect(appliquerAction(e0, 1, { type: 'prendreTas', tas: 0 }).ok).toBe(false);
    expect(appliquerAction(e0, 0, { type: 'poserPion', pion: 0, ligne: 0, colonne: 0 }).ok).toBe(false);
    expect(appliquerAction(e0, 0, { type: 'finTour' }).ok).toBe(false);
    const e1 = jouer(e0, { type: 'prendreTas', tas: 0 });
    expect(appliquerAction(e1, 0, { type: 'finTour' }).erreur).toMatch(/Posez/);
    expect(appliquerAction(e1, 0, { type: 'inconnue' }).ok).toBe(false);
  });

  it('passe au joueur suivant après la fin du tour', () => {
    let e = creerPartie({ nbJoueurs: 2, graine: 7 });
    e = jouer(e, { type: 'prendreTas', tas: 0 });
    // pose sur trois cases vides distinctes : toujours légal
    e = jouer(e, { type: 'poserPion', pion: 0, ligne: 0, colonne: 0 });
    e = jouer(e, { type: 'poserPion', pion: 0, ligne: 2, colonne: 2 });
    e = jouer(e, { type: 'poserPion', pion: 0, ligne: 4, colonne: 4 });
    e = jouer(e, { type: 'finTour' });
    expect(e.joueurCourant).toBe(1);
    expect(e.phase).toBe(PHASES.CHOIX);
  });
});

describe('Pose de cubes animaux via la partie', () => {
  /** Partie à 1 joueur avec une carte en main et un plateau préparé. */
  function preparer(idCarte, cases) {
    const e = creerPartie({ nbJoueurs: 1, graine: 1 });
    e.joueurs[0].cartes.push({ uid: `${idCarte}-x`, id: idCarte, cubesPoses: 0 });
    for (const [cle, pile] of Object.entries(cases)) {
      const [l, c] = cle.split(',').map(Number);
      e.joueurs[0].plateau.cases[l][c].pile = pile;
    }
    return jouer(e, { type: 'prendreTas', tas: 0 });
  }

  it("Aigle : pose 2 cubes puis la carte est terminée et la case bloquée", () => {
    let e = preparer('aigle', { '0,0': [J], '0,1': [G, G, G], '3,3': [G, G, G], '3,4': [J] });
    e = jouer(e, { type: 'poserAnimal', carte: 'aigle-x', ligne: 0, colonne: 1 });
    expect(e.joueurs[0].plateau.cases[0][1].cube).toBe('aigle-x');
    // la même case ne peut pas recevoir un second cube
    expect(appliquerAction(e, 0, { type: 'poserAnimal', carte: 'aigle-x', ligne: 0, colonne: 1 }).ok).toBe(false);
    // ni un pion
    const r = appliquerAction(e, 0, { type: 'poserPion', pion: 0, ligne: 0, colonne: 1 });
    expect(r.ok).toBe(false);
    e = jouer(e, { type: 'poserAnimal', carte: 'aigle-x', ligne: 3, colonne: 3 });
    expect(e.joueurs[0].cartes[0].cubesPoses).toBe(2);
    expect(calculerScores(e)[0].animaux).toBe(7);
    // carte terminée : plus de cube possible
    expect(appliquerAction(e, 0, { type: 'poserAnimal', carte: 'aigle-x', ligne: 3, colonne: 3 }).erreur)
      .toMatch(/terminée/);
  });

  it('Coccinelle : 5 cubes pour clore la carte', () => {
    let e = preparer('coccinelle', {
      '0,0': [J], '0,1': [V], '2,0': [J], '2,1': [V], '4,0': [J], '4,1': [V],
      '0,5': [J], '0,6': [V], '4,5': [J], '4,6': [V],
    });
    for (const [l, c] of [[0, 1], [2, 1], [4, 1], [0, 6], [4, 6]]) {
      e = jouer(e, { type: 'poserAnimal', carte: 'coccinelle-x', ligne: l, colonne: c });
    }
    expect(e.joueurs[0].cartes[0].cubesPoses).toBe(5);
    expect(calculerScores(e)[0].animaux).toBe(13);
  });

  it('refuse un cube si le motif est absent', () => {
    const e = preparer('aigle', { '0,0': [J], '0,1': [G, G] });
    const r = appliquerAction(e, 0, { type: 'poserAnimal', carte: 'aigle-x', ligne: 0, colonne: 1 });
    expect(r.ok).toBe(false);
  });
});

describe('Fin de partie', () => {
  it("s'arrête quand le joueur ne peut plus poser de pion", () => {
    const e = creerPartie({ nbJoueurs: 1, graine: 1 });
    // plateau entièrement couvert de prairies : plus rien n'est posable
    for (const ligne of e.joueurs[0].plateau.cases) for (const k of ligne) k.pile = [J];
    const r = jouer(e, { type: 'prendreTas', tas: 0 });
    expect(r.phase).toBe(PHASES.FIN);
    expect(r.finDePartie.raison).toMatch(/ne peut plus/);
    expect(r.finDePartie.scores[0].prairies).toBe(5);
    expect(appliquerAction(r, 0, { type: 'finTour' }).ok).toBe(false);
  });
});

describe('Parties complètes déterministes (graine fixe)', () => {
  for (const nb of [1, 2, 4]) {
    it(`partie à ${nb} joueur(s)`, () => {
      const final = jouerPartieAuto(creerPartie({ nbJoueurs: nb, graine: 2026 }));
      expect(final.phase).toBe(PHASES.FIN);
      expect(final.finDePartie.scores).toHaveLength(nb);
      expect(final.finDePartie.scores).toEqual(calculerScores(final));
      for (const s of final.finDePartie.scores) {
        expect(s.total).toBe(s.arbres + s.montagnes + s.rivieres + s.prairies + s.batiments + s.animaux);
        expect(s.total).toBeGreaterThan(0);
      }
      // aucune case ne dépasse 3 pions et chaque cube repose sur une pile
      for (const j of final.joueurs) {
        for (const k of j.plateau.cases.flat()) {
          expect(k.pile.length).toBeLessThanOrEqual(3);
          if (k.cube) expect(k.pile.length).toBeGreaterThan(0);
        }
      }
      // même graine → même partie
      const rejouee = jouerPartieAuto(creerPartie({ nbJoueurs: nb, graine: 2026 }));
      expect(rejouee).toEqual(final);
      expect(final.finDePartie.scores.map((s) => s.total)).toMatchSnapshot();
    });
  }

  it('une autre graine donne une autre partie', () => {
    const a = creerPartie({ nbJoueurs: 2, graine: 1 });
    const b = creerPartie({ nbJoueurs: 2, graine: 2 });
    expect(a.sac).not.toEqual(b.sac);
  });
});
