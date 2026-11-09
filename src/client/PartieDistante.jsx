import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { Table } from './composants/Table.jsx';

const CLE_SESSION = 'canopee.session';

function lireSession() {
  try {
    return JSON.parse(localStorage.getItem(CLE_SESSION)) ?? null;
  } catch {
    return null;
  }
}

function ecrireSession(session) {
  try {
    if (session) localStorage.setItem(CLE_SESSION, JSON.stringify(session));
    else localStorage.removeItem(CLE_SESSION);
  } catch {
    // stockage indisponible (navigation privée) : pas de reprise automatique
  }
}

/**
 * Partie à distance : chaque joueur sur son appareil, salle rejointe par code.
 * @param {string} [props.url] adresse du serveur (par défaut : même origine que la page)
 * @param {boolean} [props.memoriser] reprendre automatiquement la dernière salle après un rechargement
 */
export function PartieDistante({ quitter, url, memoriser = true }) {
  const socketRef = useRef(null);
  const sessionRef = useRef(memoriser ? lireSession() : null);
  const [connecte, setConnecte] = useState(false);
  const [vue, setVue] = useState(null);
  const [moi, setMoi] = useState(null);
  const [erreur, setErreur] = useState(null);
  const [nom, setNom] = useState(sessionRef.current?.nom ?? '');
  const [code, setCode] = useState(() => new URLSearchParams(globalThis.location?.search ?? '').get('salle') ?? '');

  useEffect(() => {
    const socket = url ? io(url, { transports: ['websocket'] }) : io();
    socketRef.current = socket;
    socket.on('connect', () => {
      setConnecte(true);
      // reprise de place après une coupure ou un rechargement
      const s = sessionRef.current;
      if (s) {
        socket.emit('salle:rejoindre', { code: s.code, nom: s.nom, jeton: s.jeton }, (res) => {
          if (res.ok) setMoi(res.index);
          else {
            sessionRef.current = null;
            if (memoriser) ecrireSession(null);
          }
        });
      }
    });
    socket.on('disconnect', () => setConnecte(false));
    socket.on('salle:etat', setVue);
    return () => socket.disconnect();
  }, [url, memoriser]);

  function entrer(res) {
    if (!res.ok) {
      setErreur(res.erreur);
      return;
    }
    setErreur(null);
    setMoi(res.index);
    sessionRef.current = { code: res.code, jeton: res.jeton, nom };
    if (memoriser) ecrireSession(sessionRef.current);
  }

  const emettre = (evt, donnees = {}) =>
    new Promise((resolve) => socketRef.current.emit(evt, donnees, resolve));

  async function demander(evt, donnees) {
    const res = await emettre(evt, donnees);
    setErreur(res.ok ? null : res.erreur);
    return res;
  }

  function sortir() {
    sessionRef.current = null;
    if (memoriser) ecrireSession(null);
    quitter();
  }

  // 1. Choix de la salle
  if (moi === null || !vue) {
    return (
      <main className="accueil">
        <h1>Canopée</h1>
        <p className="sous-titre">Partie à distance — chacun sur son appareil.</p>
        <div className="fenetre">
          <label className="ligne-graine">
            Votre nom
            <input value={nom} onChange={(e) => setNom(e.target.value)} maxLength={20} aria-label="Votre nom" />
          </label>
          <button
            type="button"
            className="bouton principal"
            disabled={!connecte || !nom.trim()}
            onClick={async () => entrer(await emettre('salle:creer', { nom }))}
          >
            Créer une salle
          </button>
          <div className="separateur">ou</div>
          <label className="ligne-graine">
            Code de la salle
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              maxLength={4}
              aria-label="Code de la salle"
              className="champ-code"
              autoCapitalize="characters"
            />
          </label>
          <button
            type="button"
            className="bouton principal"
            disabled={!connecte || !nom.trim() || code.trim().length !== 4}
            onClick={async () => entrer(await emettre('salle:rejoindre', { code, nom }))}
          >
            Rejoindre
          </button>
          {!connecte && <p className="note">Connexion au serveur…</p>}
          {erreur && <p className="erreur" role="alert">{erreur}</p>}
        </div>
        <button type="button" className="bouton" onClick={sortir}>
          Retour
        </button>
      </main>
    );
  }

  const hote = moi === 0;

  // 2. Salle d'attente
  if (!vue.etat) {
    const lien = `${globalThis.location?.origin ?? ''}/?salle=${vue.code}`;
    return (
      <main className="accueil">
        <h1>Canopée</h1>
        <div className="fenetre">
          <h2>Salle d'attente</h2>
          <p className="note">Code à donner aux autres joueurs :</p>
          <div className="code-salle" aria-label="Code à partager">{vue.code}</div>
          <p className="note lien">{lien}</p>
          <ul className="liste-joueurs">
            {vue.joueurs.map((j, i) => (
              <li key={i}>
                <span className={j.connecte ? 'pastille en-ligne' : 'pastille'} />
                {j.nom}
                {j.bot && ' 🤖'}
                {j.hote && <small> (hôte)</small>}
                {i === moi && <small> (vous)</small>}
                {hote && i > 0 && (
                  <button type="button" className="bouton discret" onClick={() => demander('salle:retirer', { index: i })}>
                    Retirer
                  </button>
                )}
              </li>
            ))}
          </ul>
          {hote ? (
            <>
              <button
                type="button"
                className="bouton"
                disabled={vue.joueurs.length >= 4}
                onClick={() => demander('salle:ajouterBot')}
              >
                Ajouter un ordinateur
              </button>
              <button type="button" className="bouton principal" onClick={() => demander('salle:demarrer')}>
                Lancer la partie ({vue.joueurs.length} joueur{vue.joueurs.length > 1 ? 's' : ''})
              </button>
            </>
          ) : (
            <p className="note">En attente du lancement par l'hôte…</p>
          )}
          {erreur && <p className="erreur" role="alert">{erreur}</p>}
        </div>
        <button type="button" className="bouton" onClick={sortir}>
          Quitter la salle
        </button>
      </main>
    );
  }

  // 3. Partie
  return (
    <>
      {!connecte && <div className="bandeau">Connexion perdue, reconnexion…</div>}
      <Table
        etat={vue.etat}
        moi={moi}
        statuts={vue.joueurs}
        envoyer={(action) => demander('partie:action', { action })}
        erreur={erreur}
        quitter={sortir}
      />
    </>
  );
}
