import { indexCible } from '../../moteur/motifs.js';
import { centreAxial, pileDuMotif, pointsHex, sommetsHex, versPoints } from '../geometrie.js';
import { construirePile, Pile } from './Pile.jsx';

const RANGS = ['1er', '2e', '3e', '4e', '5e', '6e'];

/** Carte animal : nom, motif dessiné en perspective, gain de chaque animal.
 *  `def.points` = score cumulé après 1, 2, … n cubes (calculé par le moteur). */
export function CarteAnimal({ def, cubesPoses, choisie, possible, onClick }) {
  const s = 30;
  const piste = def.points ?? [];
  const gains = piste.map((v, i) => v - (i ? piste[i - 1] : 0));
  const enMain = cubesPoses !== undefined;
  const actuel = enMain && cubesPoses > 0 ? piste[cubesPoses - 1] : 0;
  const total = piste[piste.length - 1] ?? 0;

  // ordre de dessin : du fond vers l'avant, puis de gauche à droite
  const cases = def.motif
    .map((m, i) => {
      const p = centreAxial(m.q, m.r, s);
      const pile = pileDuMotif(m);
      return { ...p, i, pile, sommet: construirePile(p.x, p.y, s, pile).sommet };
    })
    .sort((a, b) => a.y - b.y || a.x - b.x);
  const minX = Math.min(...cases.map((c) => c.x)) - s * 1.05;
  const maxX = Math.max(...cases.map((c) => c.x)) + s * 1.05;
  const minY = Math.min(...cases.map((c) => c.y - c.sommet)) - s * 0.75;
  const maxY = Math.max(...cases.map((c) => c.y)) + s * 0.75;
  const iCible = indexCible(def);
  const classes = ['carte'];
  if (choisie) classes.push('choisie');
  if (possible) classes.push('possible');
  if (onClick) classes.push('cliquable');
  if (enMain && cubesPoses >= def.cubes) classes.push('terminee');

  return (
    <button type="button" className={classes.join(' ')} onClick={onClick} disabled={!onClick} aria-pressed={!!choisie}>
      <div className="carte-entete">
        <span className="carte-titre">
          <span className="carte-emoji">{def.emoji}</span> {def.nom}
        </span>
        <span className="carte-total" title="Points si la carte est terminée">
          {enMain ? `${actuel} / ${total}` : total} pts
        </span>
      </div>
      <svg width={maxX - minX} height={maxY - minY} viewBox={`${minX} ${minY} ${maxX - minX} ${maxY - minY}`}>
        {cases.map(({ x, y }, k) => {
          const h = s * 0.08;
          const haut = sommetsHex(x, y - h, s * 0.97);
          const bas = sommetsHex(x, y, s * 0.97);
          return (
            <g key={`d${k}`}>
              <polygon points={versPoints([haut[4], haut[3], haut[2], haut[1], haut[0], bas[0], bas[1], bas[2], bas[3], bas[4]])} className="dalle-cote" />
              <polygon points={pointsHex(x, y - h, s * 0.97)} className="fond-case" />
            </g>
          );
        })}
        {cases.map(({ x, y, i, pile }) => (
          <Pile key={i} x={x} y={y - s * 0.08} s={s} pile={pile} />
        ))}
        {/* l'animal en dernier, pour qu'aucune pile ne le cache */}
        {cases
          .filter((k) => k.i === iCible)
          .map(({ x, y, sommet }) => (
            <text
              key="animal"
              x={x}
              y={y - s * 0.08 - sommet - s * 0.42}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize={s * 0.5}
              style={{ filter: 'drop-shadow(0 1px 1.5px rgba(60, 53, 48, 0.55))' }}
            >
              {def.emoji}
            </text>
          ))}
      </svg>
      <ol className="piste" aria-label={`Gain par animal : ${gains.map((g) => `+${g}`).join(', ')}`}>
        {gains.map((g, i) => {
          const couverte = enMain && i < cubesPoses;
          const prochaine = enMain && i === cubesPoses;
          return (
            <li key={i} className={couverte ? 'couverte' : prochaine ? 'prochaine' : ''}>
              <span className="piste-rang">{couverte ? def.emoji : RANGS[i]}</span>
              <span className="piste-pts">+{g}</span>
            </li>
          );
        })}
      </ol>
      <div className="carte-pied">
        {enMain
          ? cubesPoses >= def.cubes
            ? `Terminée : ${total} pts`
            : `${cubesPoses}/${def.cubes} animaux · prochain : +${gains[cubesPoses]} pts`
          : `${def.cubes} animaux · chaque animal rapporte plus que le précédent`}
      </div>
    </button>
  );
}
