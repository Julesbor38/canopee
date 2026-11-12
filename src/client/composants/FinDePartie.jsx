import { Avatar } from './Avatar.jsx';
import { TableauScores } from './TableauScores.jsx';

const MEDAILLES = ['🥇', '🥈', '🥉', '4ᵉ'];

/** Fenêtre de fin de partie : podium et scores détaillés. */
export function FinDePartie({ etat, quitter }) {
  const { scores, raison } = etat.finDePartie;
  const meilleur = Math.max(...scores.map((s) => s.total));
  const gagnants = etat.joueurs.filter((_, i) => scores[i].total === meilleur).map((j) => j.nom);
  const classement = etat.joueurs
    .map((j, i) => ({ ...j, i, total: scores[i].total }))
    .sort((a, b) => b.total - a.total);

  return (
    <div className="voile" role="dialog" aria-label="Fin de partie">
      <div className="fenetre fin-partie">
        <div className="fin-ornement" aria-hidden="true">
          <span>❦</span>
        </div>
        <h2 className="fin-titre">Fin de partie</h2>
        <p className="note">{raison}</p>
        <p className="gagnant">
          {etat.joueurs.length === 1
            ? `Score final : ${meilleur} points`
            : `${gagnants.join(' et ')} ${gagnants.length > 1 ? 'gagnent' : 'gagne'} avec ${meilleur} points !`}
        </p>
        {etat.joueurs.length > 1 && (
          <ol className="podium">
            {classement.map((j, rang) => (
              <li key={j.i} className={j.total === meilleur ? 'premier' : undefined}>
                <span className="podium-rang">{MEDAILLES[rang]}</span>
                <Avatar nom={j.nom} index={j.i} taille={30} />
                <span className="podium-nom">{j.nom}</span>
                <span className="podium-pts">{j.total} pts</span>
              </li>
            ))}
          </ol>
        )}
        <TableauScores etat={etat} scores={scores} meilleur={meilleur} />
        {quitter && (
          <button type="button" className="bouton principal" onClick={quitter}>
            Retour à l'accueil
          </button>
        )}
      </div>
    </div>
  );
}
