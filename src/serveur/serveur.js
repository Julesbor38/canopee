// Serveur HTTP + Socket.IO : sert l'interface construite et relaie les actions
// des joueurs vers le gestionnaire de salles. Chaque coup est validé par le moteur.

import { existsSync } from 'node:fs';
import { createServer } from 'node:http';
import express from 'express';
import { Server } from 'socket.io';
import { GestionnaireSalles } from './salles.js';

const UNE_HEURE = 60 * 60 * 1000;

/**
 * @param {object} [options]
 * @param {number} [options.port] 0 = port libre au hasard
 * @param {string} [options.hote]
 * @param {string} [options.dossierStatique] dossier de l'interface construite (dist/)
 * @param {number} [options.delaiBot] ms entre deux actions d'un ordinateur
 */
export function creerServeur({ port = 3000, hote = '0.0.0.0', dossierStatique, delaiBot = 600 } = {}) {
  const app = express();
  const http = createServer(app);
  const io = new Server(http, { cors: { origin: true } });
  const salles = new GestionnaireSalles();
  const minuteriesBots = new Map();

  app.get('/sante', (_req, res) => res.json({ ok: true, salles: salles.salles.size }));
  if (dossierStatique && existsSync(dossierStatique)) {
    app.use(express.static(dossierStatique));
    app.get('*', (_req, res) => res.sendFile('index.html', { root: dossierStatique }));
  }

  function diffuser(code) {
    io.to(code).emit('salle:etat', salles.vue(code));
    planifierBot(code);
  }

  // Les ordinateurs jouent côté serveur, une action à la fois.
  function planifierBot(code) {
    if (minuteriesBots.has(code) || !salles.tourDeBot(code)) return;
    minuteriesBots.set(
      code,
      setTimeout(() => {
        minuteriesBots.delete(code);
        if (salles.jouerBot(code).ok) diffuser(code);
      }, delaiBot),
    );
  }

  io.on('connection', (socket) => {
    // Identité de la socket : { code, jeton }
    const moi = {};
    const repondre = (ack, res) => typeof ack === 'function' && ack(res);

    function entrer(calcul, ack) {
      let res;
      try {
        res = calcul();
      } catch (e) {
        res = { ok: false, erreur: 'Requête invalide' };
        console.error(e);
      }
      if (res.ok) {
        if (moi.code && moi.code !== res.code) socket.leave(moi.code);
        moi.code = res.code;
        moi.jeton = res.jeton;
        socket.join(res.code);
      }
      repondre(ack, res);
      if (res.ok) diffuser(res.code);
    }

    socket.on('salle:creer', (d, ack) => entrer(() => salles.creer(d?.nom), ack));
    socket.on('salle:rejoindre', (d, ack) => entrer(() => salles.rejoindre(d?.code, d?.nom, d?.jeton), ack));

    // Actions réservées à un membre de la salle
    const membre = (fn) => (donnees, ack) => {
      if (typeof donnees === 'function') [donnees, ack] = [{}, donnees];
      if (!moi.code) return repondre(ack, { ok: false, erreur: "Vous n'êtes dans aucune salle" });
      let res;
      try {
        res = fn(donnees ?? {});
      } catch (e) {
        res = { ok: false, erreur: 'Requête invalide' };
        console.error(e);
      }
      repondre(ack, res);
      if (res.ok) diffuser(moi.code);
    };

    socket.on('salle:ajouterBot', membre(() => salles.ajouterBot(moi.code, moi.jeton)));
    socket.on('salle:retirer', membre(({ index }) => salles.retirer(moi.code, moi.jeton, index)));
    socket.on('salle:demarrer', membre(({ graine }) => salles.demarrer(moi.code, moi.jeton, graine ?? Date.now())));
    socket.on('partie:action', membre(({ action }) => salles.jouer(moi.code, moi.jeton, action)));

    socket.on('disconnect', () => {
      if (!moi.code) return;
      salles.deconnecter(moi.code, moi.jeton);
      io.to(moi.code).emit('salle:etat', salles.vue(moi.code));
    });
  });

  const nettoyage = setInterval(() => salles.nettoyer(UNE_HEURE), 5 * 60 * 1000);
  nettoyage.unref();

  return {
    app,
    io,
    salles,
    ecouter: () =>
      new Promise((resolve) => {
        http.listen(port, hote, () => resolve(http.address().port));
      }),
    fermer: () =>
      new Promise((resolve) => {
        clearInterval(nettoyage);
        for (const t of minuteriesBots.values()) clearTimeout(t);
        io.close(() => resolve());
      }),
  };
}
