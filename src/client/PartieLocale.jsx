import { useEffect, useState } from 'react';
import { actionBot } from '../moteur/bot.js';
import { appliquerAction, creerPartie, PHASES } from '../moteur/partie.js';
import { Table } from './composants/Table.jsx';

const DELAI_BOT = 450; // ms entre deux actions d'un bot

/** Partie sur un seul écran : les joueurs jouent à tour de rôle. */
export function PartieLocale({ reglages, quitter, delaiBot = DELAI_BOT, etatInitial }) {
  const [etat, setEtat] = useState(
    () =>
      etatInitial ??
      creerPartie({ nbJoueurs: reglages.joueurs.length, graine: reglages.graine, noms: reglages.joueurs.map((j) => j.nom) }),
  );
  const [erreur, setErreur] = useState(null);
  const tourDeBot = etat.phase !== PHASES.FIN && reglages.joueurs[etat.joueurCourant].bot;

  function envoyer(action) {
    const res = appliquerAction(etat, etat.joueurCourant, action);
    if (res.ok) {
      setEtat(res.etat);
      setErreur(null);
    } else {
      setErreur(res.erreur);
    }
  }

  useEffect(() => {
    if (!tourDeBot) return undefined;
    const t = setTimeout(() => {
      const res = appliquerAction(etat, etat.joueurCourant, actionBot(etat));
      if (res.ok) setEtat(res.etat);
    }, delaiBot);
    return () => clearTimeout(t);
  }, [etat, tourDeBot, delaiBot]);

  return <Table etat={etat} envoyer={envoyer} attente={tourDeBot} erreur={erreur} quitter={quitter} />;
}
