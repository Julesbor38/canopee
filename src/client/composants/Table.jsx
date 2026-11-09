import { useEffect, useMemo, useState } from 'react';
import { calculerScores, cartesEnCours, PHASES } from '../../moteur/partie.js';
import { casesPossibles } from '../../moteur/plateau.js';
import { ciblesPossibles } from '../../moteur/motifs.js';
import { NOMS_COULEURS } from '../geometrie.js';
import { CarteAnimal } from './CarteAnimal.jsx';
import { Pion } from './Pile.jsx';
import { Plateau } from './Plateau.jsx';
import { FinDePartie } from './FinDePartie.jsx';
import { TableauScores } from './TableauScores.jsx';

const versCles = (cases) => new Set(cases.map((c) => `${c.ligne},${c.colonne}`));

/**
 * Vue d'une partie, commune au mode local et au mode distant.
 * @param {object} props.etat état de partie
 * @param {(action: object) => void} props.envoyer envoie une action au nom du joueur courant
 * @param {number|null} props.moi index du joueur sur cet appareil (null = écran partagé)
 * @param {boolean} [props.attente] vrai pendant le tour d'un bot ou d'un joueur distant
 * @param {string|null} [props.erreur]
 * @param {() => void} [props.quitter]
 * @param {{connecte: boolean}[]} [props.statuts] état de connexion des joueurs (mode distant)
 */
export function Table({ etat, envoyer, moi = null, attente = false, erreur, quitter, statuts }) {
  const courant = etat.joueurCourant;
  const actif = !attente && etat.phase !== PHASES.FIN && (moi === null || moi === courant);
  const [carteChoisie, setCarteChoisie] = useState(null);
  const [pionChoisi, setPionChoisi] = useState(0);
  const [animalChoisi, setAnimalChoisi] = useState(null);
  const [plateauVu, setPlateauVu] = useState(moi ?? courant);

  // Réinitialise les sélections à chaque changement de tour ou de phase
  useEffect(() => {
    setCarteChoisie(null);
    setAnimalChoisi(null);
    setPionChoisi(0);
    if (moi === null) setPlateauVu(courant);
  }, [courant, etat.phase, moi]);
  useEffect(() => {
    if (pionChoisi >= etat.main.length) setPionChoisi(0);
  }, [etat.main.length, pionChoisi]);

  const scores = useMemo(() => calculerScores(etat), [etat]);
  const joueur = etat.joueurs[courant];
  const vu = etat.joueurs[plateauVu];
  const enPlacement = actif && etat.phase === PHASES.PLACEMENT && plateauVu === courant;
  const pleinMain = cartesEnCours(joueur, etat.definitions).length >= etat.config.cartes.maxEnMain;

  const ciblesParCarte = useMemo(() => {
    const res = {};
    for (const c of cartesEnCours(joueur, etat.definitions)) {
      res[c.uid] = ciblesPossibles(joueur.plateau, etat.definitions[c.id], etat.config);
    }
    return res;
  }, [joueur, etat.definitions, etat.config]);

  const surbrillance = useMemo(() => {
    if (!enPlacement || animalChoisi || etat.main[pionChoisi] === undefined) return undefined;
    return versCles(casesPossibles(joueur.plateau, etat.main[pionChoisi], etat.config));
  }, [enPlacement, animalChoisi, etat.main, pionChoisi, joueur, etat.config]);

  const cibles = enPlacement && animalChoisi ? versCles(ciblesParCarte[animalChoisi] ?? []) : undefined;

  function surCase(ligne, colonne) {
    if (animalChoisi) {
      envoyer({ type: 'poserAnimal', carte: animalChoisi, ligne, colonne });
      setAnimalChoisi(null);
    } else {
      envoyer({ type: 'poserPion', pion: pionChoisi, ligne, colonne });
    }
  }

  function prendreTas(i) {
    envoyer({ type: 'prendreTas', tas: i, carte: carteChoisie ?? undefined });
  }

  const consigne = !actif
    ? etat.phase === PHASES.FIN
      ? 'Partie terminée'
      : `Au tour de ${joueur.nom}…`
    : etat.phase === PHASES.CHOIX
      ? 'Choisissez éventuellement une carte animal, puis touchez un tas pour le prendre.'
      : etat.main.length
        ? `Posez vos pions : ${NOMS_COULEURS[etat.main[pionChoisi]] ?? ''} sélectionné.`
        : 'Posez des cubes animaux si un motif est réalisé, puis finissez votre tour.';

  return (
    <div className="table">
      <header className="barre">
        <div className="titre-jeu">Canopée</div>
        <div className="info-tour">
          Tour {etat.tour} · <strong>{joueur.nom}</strong>
        </div>
        {quitter && (
          <button type="button" className="bouton discret" onClick={quitter}>
            Quitter
          </button>
        )}
      </header>

      <p className="consigne" role="status">{consigne}</p>
      {erreur && <p className="erreur" role="alert">{erreur}</p>}

      <div className="zone-jeu">
        <section className="centre-table" aria-label="Centre de la table">
          <h2>Tas</h2>
          <div className="tas-liste">
            {etat.tas.map((tas, i) => (
              <button
                key={i}
                type="button"
                className="tas"
                disabled={!actif || etat.phase !== PHASES.CHOIX || !tas}
                onClick={() => prendreTas(i)}
                aria-label={`Tas ${i + 1}`}
              >
                {tas ? tas.map((c, k) => <Pion key={k} couleur={c} taille={16} />) : <span className="vide">vide</span>}
              </button>
            ))}
          </div>
          <h2>
            Cartes animaux <small>({etat.nbPioche ?? etat.pioche.length} en pioche)</small>
          </h2>
          <div className="cartes-liste">
            {etat.cartesVisibles.map((carte, i) =>
              carte ? (
                <CarteAnimal
                  key={carte.uid}
                  def={etat.definitions[carte.id]}
                  choisie={carteChoisie === i}
                  onClick={
                    actif && etat.phase === PHASES.CHOIX && !pleinMain
                      ? () => setCarteChoisie(carteChoisie === i ? null : i)
                      : undefined
                  }
                  compacte
                />
              ) : (
                <div key={`vide-${i}`} className="carte vide" />
              ),
            )}
          </div>
          {actif && etat.phase === PHASES.CHOIX && pleinMain && (
            <p className="note">Vous avez déjà {etat.config.cartes.maxEnMain} cartes en cours.</p>
          )}
        </section>

        <section className="zone-plateau" aria-label="Plateau">
          <div className="onglets" role="tablist">
            {etat.joueurs.map((j, i) => (
              <button
                key={i}
                type="button"
                role="tab"
                aria-selected={plateauVu === i}
                className={`onglet${i === courant ? ' courant' : ''}`}
                onClick={() => setPlateauVu(i)}
              >
                {j.nom}
                {moi === i ? ' (vous)' : ''}
                {statuts && !statuts[i]?.bot && !statuts[i]?.connecte ? ' (déconnecté)' : ''} · {scores[i].total} pts
              </button>
            ))}
          </div>

          <Plateau
            plateau={vu.plateau}
            surbrillance={surbrillance}
            cibles={cibles}
            surCase={enPlacement ? surCase : undefined}
            definitions={etat.definitions}
          />

          {actif && etat.phase === PHASES.PLACEMENT && (
            <div className="main">
              <span>À poser :</span>
              {etat.main.map((c, k) => (
                <button
                  key={k}
                  type="button"
                  className="pion-main"
                  aria-label={`Pion ${NOMS_COULEURS[c]}`}
                  aria-pressed={k === pionChoisi && !animalChoisi}
                  onClick={() => {
                    setPionChoisi(k);
                    setAnimalChoisi(null);
                    setPlateauVu(courant);
                  }}
                >
                  <Pion couleur={c} taille={20} choisi={k === pionChoisi && !animalChoisi} />
                </button>
              ))}
              <button
                type="button"
                className="bouton principal"
                disabled={etat.main.length > 0}
                onClick={() => envoyer({ type: 'finTour' })}
              >
                Fin du tour
              </button>
            </div>
          )}

          <div className="cartes-joueur">
            <h2>Cartes de {vu.nom}</h2>
            <div className="cartes-liste">
              {vu.cartes.length === 0 && <p className="note">Aucune carte.</p>}
              {vu.cartes.map((carte) => {
                const possibles = plateauVu === courant ? ciblesParCarte[carte.uid]?.length ?? 0 : 0;
                return (
                  <CarteAnimal
                    key={carte.uid}
                    def={etat.definitions[carte.id]}
                    cubesPoses={carte.cubesPoses}
                    possible={enPlacement && possibles > 0}
                    choisie={animalChoisi === carte.uid}
                    onClick={
                      enPlacement && possibles > 0
                        ? () => setAnimalChoisi(animalChoisi === carte.uid ? null : carte.uid)
                        : undefined
                    }
                  />
                );
              })}
            </div>
          </div>
        </section>

        <aside className="scores" aria-label="Scores">
          <h2>Scores</h2>
          <TableauScores etat={etat} scores={scores} />
        </aside>
      </div>

      {etat.phase === PHASES.FIN && <FinDePartie etat={etat} quitter={quitter} />}
    </div>
  );
}
