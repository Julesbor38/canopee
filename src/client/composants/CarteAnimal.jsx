import { useId } from 'react';
import { indexCible } from '../../moteur/motifs.js';
import { centreAxial, pileDuMotif, sommetsHex, versPoints } from '../geometrie.js';
import { habitatDe, stylesHabitat } from '../habitats.js';
import { JetonCorps, JetonDefs, Medaillon } from './Medaillon.jsx';
import { construirePile, Pile } from './Pile.jsx';

const RANGS = ['1er', '2e', '3e', '4e', '5e', '6e'];

/** Scène de la carte : le motif dessiné en perspective, l'animal sur sa case. */
function Scene({ def, habitat }) {
  const id = `sc${useId().replace(/:/g, '')}`;
  const s = 26;
  const iCible = indexCible(def);
  // ordre de dessin : du fond vers l'avant, puis de gauche à droite
  const cases = def.motif
    .map((m, i) => {
      const p = centreAxial(m.q, m.r, s);
      const pile = pileDuMotif(m);
      return { ...p, i, pile, sommet: construirePile(p.x, p.y, s, pile).sommet };
    })
    .sort((a, b) => a.y - b.y || a.x - b.x);
  const cible = cases.find((k) => k.i === iCible);
  const rJeton = s * 0.42;
  const yJeton = cible.y - s * 0.08 - cible.sommet - rJeton * 1.15;
  const minX = Math.min(...cases.map((c) => c.x)) - s * 1.1;
  const maxX = Math.max(...cases.map((c) => c.x)) + s * 1.1;
  const minY = Math.min(yJeton - rJeton * 1.2, ...cases.map((c) => c.y - c.sommet)) - s * 0.2;
  const maxY = Math.max(...cases.map((c) => c.y)) + s * 0.75;
  const l = maxX - minX;
  const h = maxY - minY;

  return (
    <svg className="carte-scene-svg" width={l} height={h} viewBox={`${minX} ${minY} ${l} ${h}`} aria-hidden="true">
      <JetonDefs id={id} habitat={habitat} />
      {cases.map(({ x, y }, k) => {
        const e = s * 0.08;
        const haut = sommetsHex(x, y - e, s * 0.97);
        const bas = sommetsHex(x, y, s * 0.97);
        return (
          <g key={`d${k}`}>
            <polygon points={versPoints([haut[4], haut[3], haut[2], haut[1], haut[0], bas[0], bas[1], bas[2], bas[3], bas[4]])} className="dalle-cote" />
            <polygon points={versPoints(haut)} className="fond-case" />
          </g>
        );
      })}
      {cases.map(({ x, y, i, pile }) => (
        <Pile key={i} x={x} y={y - s * 0.08} s={s} pile={pile} />
      ))}
      {/* l'animal en dernier, pour qu'aucune pile ne le cache */}
      <line x1={cible.x} y1={yJeton + rJeton} x2={cible.x} y2={cible.y - s * 0.08 - cible.sommet + 1} stroke={habitat.fonce} strokeWidth="1.4" strokeDasharray="2 2" opacity="0.6" />
      <JetonCorps id={id} r={rJeton} cx={cible.x} cy={yJeton} />
      <text x={cible.x} y={yJeton + 1} textAnchor="middle" dominantBaseline="central" fontSize={rJeton * 1.05}>
        {def.emoji}
      </text>
    </svg>
  );
}

/** Carte animal façon guide naturaliste : médaillon, nom, habitat, motif en scène, piste de points.
 *  `def.points` = score cumulé après 1, 2, … n cubes (calculé par le moteur). */
export function CarteAnimal({ def, cubesPoses, choisie, possible, onClick }) {
  const habitat = habitatDe(def);
  const piste = def.points ?? [];
  const gains = piste.map((v, i) => v - (i ? piste[i - 1] : 0));
  const enMain = cubesPoses !== undefined;
  const actuel = enMain && cubesPoses > 0 ? piste[cubesPoses - 1] : 0;
  const total = piste[piste.length - 1] ?? 0;
  const terminee = enMain && cubesPoses >= def.cubes;
  const classes = ['carte'];
  if (choisie) classes.push('choisie');
  if (possible) classes.push('possible');
  if (onClick) classes.push('cliquable');
  if (terminee) classes.push('terminee');

  return (
    <button
      type="button"
      className={classes.join(' ')}
      onClick={onClick}
      disabled={!onClick}
      aria-pressed={!!choisie}
      style={stylesHabitat(habitat)}
    >
      <span className="carte-coin carte-coin-g" aria-hidden="true" />
      <span className="carte-coin carte-coin-d" aria-hidden="true" />
      <div className="carte-entete">
        <Medaillon emoji={def.emoji} habitat={habitat} taille={42} />
        <div className="carte-nom">
          <span className="carte-titre">
            <span className="carte-emoji" aria-hidden="true">{def.emoji}</span> {def.nom}
          </span>
          <span className="carte-habitat">{habitat.nom}</span>
        </div>
        <span className="carte-total" title="Points si la carte est terminée">
          <b>{enMain ? `${actuel} / ${total}` : total}</b> pts
        </span>
      </div>

      <div className="carte-scene">
        <Scene def={def} habitat={habitat} />
      </div>

      <ol className="piste" aria-label={`Gain par animal : ${gains.map((g) => `+${g}`).join(', ')}`}>
        {gains.map((g, i) => {
          const couverte = enMain && i < cubesPoses;
          const prochaine = enMain && i === cubesPoses;
          return (
            <li key={i} className={couverte ? 'couverte' : prochaine ? 'prochaine' : ''}>
              {couverte ? (
                <Medaillon emoji={def.emoji} habitat={habitat} taille={22} />
              ) : (
                <span className="piste-rang">{RANGS[i]}</span>
              )}
              <span className="piste-pts">+{g}</span>
            </li>
          );
        })}
      </ol>

      <div className="carte-pied">
        {enMain
          ? terminee
            ? `Carte terminée · ${total} pts`
            : `${cubesPoses}/${def.cubes} posés · prochain animal +${gains[cubesPoses]}`
          : `${def.cubes} animaux · chacun rapporte plus que le précédent`}
      </div>
    </button>
  );
}
