import { ordreDeJeu } from '../../moteur/partie.js';
import { Avatar } from './Avatar.jsx';
import { Pion } from './Pile.jsx';

/** Catégories de score, avec le pion qui les illustre. */
const CATEGORIES = [
  ['arbres', 'Arbres', 'vert'],
  ['montagnes', 'Montagnes', 'gris'],
  ['rivieres', 'Rivières', 'bleu'],
  ['prairies', 'Prairies', 'jaune'],
  ['batiments', 'Bâtiments', 'rouge'],
  ['animaux', 'Animaux', null],
];

/** Tableau des scores détaillés par catégorie. */
export function TableauScores({ etat, scores, meilleur, courant }) {
  const max = meilleur ?? Math.max(...scores.map((s) => s.total));
  const ordre = ordreDeJeu(etat); // colonnes dans l'ordre du tour
  return (
    <table className="tableau-scores">
      <thead>
        <tr>
          <th />
          {ordre.map((i) => (
            <th key={i} className={i === courant ? 'courant' : undefined}>
              <span className="score-joueur">
                <Avatar nom={etat.joueurs[i].nom} index={i} taille={22} />
                <span>{etat.joueurs[i].nom}</span>
              </span>
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {CATEGORIES.map(([cle, nom, couleur]) => (
          <tr key={cle}>
            <th scope="row">
              <span className="categorie">
                <span className="categorie-icone" aria-hidden="true">
                  {couleur ? <Pion couleur={couleur} taille={11} /> : '🐾'}
                </span>
                {nom}
              </span>
            </th>
            {ordre.map((i) => (
              <td key={i} className={scores[i][cle] ? undefined : 'zero'}>
                {scores[i][cle]}
              </td>
            ))}
          </tr>
        ))}
        <tr className="total">
          <th scope="row">Total</th>
          {ordre.map((i) => (
            <td key={i} className={scores[i].total === max && max > 0 ? 'meneur' : undefined}>
              {scores[i].total}
            </td>
          ))}
        </tr>
      </tbody>
    </table>
  );
}
