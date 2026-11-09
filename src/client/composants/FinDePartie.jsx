import { TableauScores } from './TableauScores.jsx';

/** Fenêtre de fin de partie avec le classement. */
export function FinDePartie({ etat, quitter }) {
  const { scores, raison } = etat.finDePartie;
  const meilleur = Math.max(...scores.map((s) => s.total));
  const gagnants = etat.joueurs.filter((_, i) => scores[i].total === meilleur).map((j) => j.nom);

  return (
    <div className="voile" role="dialog" aria-label="Fin de partie">
      <div className="fenetre">
        <h2>Fin de partie</h2>
        <p className="note">{raison}</p>
        <p className="gagnant">
          {etat.joueurs.length === 1
            ? `Score final : ${meilleur} points`
            : `${gagnants.join(' et ')} ${gagnants.length > 1 ? 'gagnent' : 'gagne'} avec ${meilleur} points !`}
        </p>
        <TableauScores etat={etat} scores={scores} />
        {quitter && (
          <button type="button" className="bouton principal" onClick={quitter}>
            Retour à l'accueil
          </button>
        )}
      </div>
    </div>
  );
}
