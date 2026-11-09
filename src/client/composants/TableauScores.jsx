/** Tableau des scores détaillés par catégorie. */
const CATEGORIES = [
  ['arbres', 'Arbres'],
  ['montagnes', 'Montagnes'],
  ['rivieres', 'Rivières'],
  ['prairies', 'Prairies'],
  ['batiments', 'Bâtiments'],
  ['animaux', 'Animaux'],
];

export function TableauScores({ etat, scores }) {
  return (
    <table className="tableau-scores">
      <thead>
        <tr>
          <th />
          {etat.joueurs.map((j, i) => (
            <th key={i}>{j.nom}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {CATEGORIES.map(([cle, nom]) => (
          <tr key={cle}>
            <th scope="row">{nom}</th>
            {scores.map((s, i) => (
              <td key={i}>{s[cle]}</td>
            ))}
          </tr>
        ))}
        <tr className="total">
          <th scope="row">Total</th>
          {scores.map((s, i) => (
            <td key={i}>{s.total}</td>
          ))}
        </tr>
      </tbody>
    </table>
  );
}
