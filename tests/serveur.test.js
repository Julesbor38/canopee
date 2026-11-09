// Tests d'intégration : vrai serveur Socket.IO sur un port libre, vrais clients.
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { io as connecter } from 'socket.io-client';
import { creerServeur } from '../src/serveur/serveur.js';
import { actionBot } from '../src/moteur/bot.js';
import { PHASES } from '../src/moteur/partie.js';

let serveur;
let url;
const clients = [];

beforeAll(async () => {
  serveur = creerServeur({ port: 0, hote: '127.0.0.1', delaiBot: 0 });
  url = `http://127.0.0.1:${await serveur.ecouter()}`;
});

afterAll(async () => {
  clients.forEach((c) => c.disconnect());
  await serveur.fermer();
});

/** Client qui mémorise la dernière vue de salle reçue. */
async function client() {
  const socket = connecter(url, { transports: ['websocket'], forceNew: true });
  clients.push(socket);
  socket.vue = null;
  socket.on('salle:etat', (v) => {
    socket.vue = v;
  });
  await new Promise((r) => socket.on('connect', r));
  return socket;
}

const emettre = (socket, evt, donnees) => new Promise((r) => socket.emit(evt, donnees, r));

/** Attend qu'une condition sur la vue reçue soit vraie. */
async function attendre(socket, condition, delai = 5000) {
  const debut = Date.now();
  while (!(socket.vue && condition(socket.vue))) {
    if (Date.now() - debut > delai) throw new Error('Délai dépassé');
    await new Promise((r) => setTimeout(r, 10));
  }
  return socket.vue;
}

describe('Serveur multijoueur', () => {
  it('répond sur /sante', async () => {
    const r = await fetch(`${url}/sante`);
    expect((await r.json()).ok).toBe(true);
  });

  it('salle par code, démarrage, coups validés et diffusés à tous', async () => {
    const a = await client();
    const b = await client();
    const creation = await emettre(a, 'salle:creer', { nom: 'Alice' });
    expect(creation.ok).toBe(true);
    expect(creation.code).toMatch(/^[A-Z]{4}$/);

    const arrivee = await emettre(b, 'salle:rejoindre', { code: creation.code, nom: 'Bastien' });
    expect(arrivee).toMatchObject({ ok: true, index: 1 });
    await attendre(a, (v) => v.joueurs.length === 2);

    expect((await emettre(b, 'salle:demarrer', {})).ok).toBe(false); // pas l'hôte
    expect((await emettre(a, 'salle:demarrer', { graine: 11 })).ok).toBe(true);
    const vue = await attendre(b, (v) => v.etat);
    expect(vue.etat.sac).toEqual([]); // informations cachées

    // coup hors tour refusé
    const refus = await emettre(b, 'partie:action', { action: { type: 'prendreTas', tas: 0 } });
    expect(refus.ok).toBe(false);
    // coup illégal refusé
    expect((await emettre(a, 'partie:action', { action: { type: 'finTour' } })).ok).toBe(false);
    // coup légal accepté et diffusé à l'autre joueur
    expect((await emettre(a, 'partie:action', { action: { type: 'prendreTas', tas: 0 } })).ok).toBe(true);
    await attendre(b, (v) => v.etat.phase === PHASES.PLACEMENT);
    // données malformées : refusées sans faire tomber le serveur
    expect((await emettre(a, 'partie:action', null)).ok).toBe(false);
    expect((await emettre(a, 'partie:action', { action: { type: 'poserPion', pion: 'x' } })).ok).toBe(false);
  });

  it('un joueur déconnecté peut revenir avec son jeton', async () => {
    const a = await client();
    const b = await client();
    const { code } = await emettre(a, 'salle:creer', { nom: 'A' });
    const { jeton } = await emettre(b, 'salle:rejoindre', { code, nom: 'B' });
    b.disconnect();
    await attendre(a, (v) => v.joueurs[1] && !v.joueurs[1].connecte);
    const b2 = await client();
    const retour = await emettre(b2, 'salle:rejoindre', { code, jeton });
    expect(retour).toMatchObject({ ok: true, index: 1 });
    await attendre(a, (v) => v.joueurs[1].connecte);
  });

  it('partie complète à distance : 2 humains + 2 ordinateurs', async () => {
    const a = await client();
    const b = await client();
    const { code } = await emettre(a, 'salle:creer', { nom: 'A' });
    await emettre(b, 'salle:rejoindre', { code, nom: 'B' });
    await emettre(a, 'salle:ajouterBot', {});
    await emettre(a, 'salle:ajouterBot', {});
    await emettre(a, 'salle:demarrer', { graine: 2026 });
    const joueurs = [a, b];

    for (let n = 0; n < 5000; n++) {
      const vue = await attendre(a, (v) => v.etat && (v.etat.phase === PHASES.FIN || v.etat.joueurCourant < 2));
      if (vue.etat.phase === PHASES.FIN) break;
      const s = joueurs[vue.etat.joueurCourant];
      const action = actionBot(vue.etat);
      const tourAvant = JSON.stringify(vue.etat);
      expect((await emettre(s, 'partie:action', { action })).ok).toBe(true);
      await attendre(a, (v) => JSON.stringify(v.etat) !== tourAvant);
    }
    const fin = await attendre(a, (v) => v.etat.phase === PHASES.FIN, 20000);
    expect(fin.etat.finDePartie.scores).toHaveLength(4);
    await attendre(b, (v) => v.etat.phase === PHASES.FIN);
  }, 30000);
});
