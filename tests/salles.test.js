import { describe, expect, it } from 'vitest';
import { etatPublic, GestionnaireSalles } from '../src/serveur/salles.js';
import { actionBot } from '../src/moteur/bot.js';
import { creerPartie, PHASES } from '../src/moteur/partie.js';

function gestionnaire() {
  let n = 0;
  return new GestionnaireSalles({ genererCode: () => `S${++n}`.padEnd(4, 'X'), genererJeton: () => `j${++n}` });
}

describe('Salles', () => {
  it("création, arrivée des joueurs et code insensible à la casse", () => {
    const g = gestionnaire();
    const hote = g.creer('Alice');
    expect(hote).toMatchObject({ ok: true, index: 0 });
    const b = g.rejoindre(hote.code.toLowerCase(), 'Bastien');
    expect(b).toMatchObject({ ok: true, index: 1 });
    expect(g.vue(hote.code).joueurs.map((j) => j.nom)).toEqual(['Alice', 'Bastien']);
    expect(g.vue(hote.code).joueurs[0].hote).toBe(true);
  });

  it('refuse un code inconnu, une salle pleine ou une partie commencée', () => {
    const g = gestionnaire();
    const { code, jeton } = g.creer('A');
    expect(g.rejoindre('ZZZZ', 'X').ok).toBe(false);
    g.rejoindre(code, 'B');
    g.rejoindre(code, 'C');
    g.rejoindre(code, 'D');
    expect(g.rejoindre(code, 'E').erreur).toMatch(/pleine/);
    const g2 = gestionnaire();
    const s = g2.creer('A');
    g2.demarrer(s.code, s.jeton);
    expect(g2.rejoindre(s.code, 'B').erreur).toMatch(/commencé/);
    expect(jeton).toBeTruthy();
  });

  it("seul l'hôte peut démarrer, ajouter ou retirer un joueur", () => {
    const g = gestionnaire();
    const h = g.creer('A');
    const b = g.rejoindre(h.code, 'B');
    expect(g.demarrer(h.code, b.jeton).ok).toBe(false);
    expect(g.ajouterBot(h.code, b.jeton).ok).toBe(false);
    expect(g.ajouterBot(h.code, h.jeton).ok).toBe(true);
    expect(g.retirer(h.code, h.jeton, 2).ok).toBe(true);
    expect(g.vue(h.code).joueurs).toHaveLength(2);
    expect(g.demarrer(h.code, h.jeton, 5).ok).toBe(true);
    expect(g.vue(h.code).etat.joueurs).toHaveLength(2);
  });

  it('le serveur valide chaque coup avec le moteur', () => {
    const g = gestionnaire();
    const h = g.creer('A');
    const b = g.rejoindre(h.code, 'B');
    expect(g.jouer(h.code, h.jeton, { type: 'prendreTas', tas: 0 }).ok).toBe(false); // pas commencé
    g.demarrer(h.code, h.jeton, 9);
    expect(g.jouer(h.code, b.jeton, { type: 'prendreTas', tas: 0 }).erreur).toMatch(/pas votre tour/);
    expect(g.jouer(h.code, 'inconnu', { type: 'prendreTas', tas: 0 }).ok).toBe(false);
    expect(g.jouer(h.code, h.jeton, { type: 'prendreTas', tas: '0' }).ok).toBe(false);
    expect(g.jouer(h.code, h.jeton, { type: 'prendreTas', tas: 0 }).ok).toBe(true);
    expect(g.vue(h.code).etat.phase).toBe(PHASES.PLACEMENT);
  });

  it('reconnexion : le jeton permet de reprendre sa place', () => {
    const g = gestionnaire();
    const h = g.creer('A');
    const b = g.rejoindre(h.code, 'B');
    g.demarrer(h.code, h.jeton);
    g.deconnecter(h.code, b.jeton);
    expect(g.vue(h.code).joueurs[1].connecte).toBe(false);
    const retour = g.rejoindre(h.code, 'peu importe', b.jeton);
    expect(retour).toMatchObject({ ok: true, index: 1 });
    expect(g.vue(h.code).joueurs[1].connecte).toBe(true);
  });

  it('les ordinateurs jouent leur tour', () => {
    const g = gestionnaire();
    const h = g.creer('A');
    g.ajouterBot(h.code, h.jeton);
    g.demarrer(h.code, h.jeton, 1);
    expect(g.tourDeBot(h.code)).toBe(false);
    // tour de l'humain avec le bot du moteur
    const salle = g.salles.get(h.code);
    while (salle.etat.joueurCourant === 0) g.jouer(h.code, h.jeton, actionBot(salle.etat));
    expect(g.tourDeBot(h.code)).toBe(true);
    while (g.tourDeBot(h.code)) expect(g.jouerBot(h.code).ok).toBe(true);
    expect(salle.etat.joueurCourant).toBe(0);
  });

  it('supprime les salles abandonnées après le délai', () => {
    const g = gestionnaire();
    const h = g.creer('A');
    g.deconnecter(h.code, h.jeton);
    g.nettoyer(1000, 0);
    expect(g.salles.has(h.code)).toBe(true);
    g.nettoyer(1000, 1000);
    expect(g.salles.has(h.code)).toBe(false);
  });
});

describe('État public', () => {
  it("cache l'ordre du sac et de la pioche", () => {
    const e = creerPartie({ nbJoueurs: 2, graine: 1 });
    const p = etatPublic(e);
    expect(p.sac).toEqual([]);
    expect(p.pioche).toEqual([]);
    expect(p.nbSac).toBe(e.sac.length);
    expect(p.nbPioche).toBe(e.pioche.length);
    expect(p.tas).toEqual(e.tas);
    expect(p).not.toHaveProperty('rng');
  });
});
