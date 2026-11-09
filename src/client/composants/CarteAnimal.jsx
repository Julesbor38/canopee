import { indexCible } from '../../moteur/motifs.js';
import { centreAxial, pileDuMotif, pointsHex, sommetsHex, versPoints } from '../geometrie.js';
import { construirePile, Pile } from './Pile.jsx';

/** Carte animal : nom, motif dessiné en perspective, progression des cubes. */
export function CarteAnimal({ def, cubesPoses, choisie, possible, onClick, compacte = false }) {
  const s = compacte ? 19 : 22;
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
  const terminee = cubesPoses !== undefined && cubesPoses >= def.cubes;
  if (terminee) classes.push('terminee');

  return (
    <button type="button" className={classes.join(' ')} onClick={onClick} disabled={!onClick} aria-pressed={!!choisie}>
      <div className="carte-titre">
        <span className="carte-emoji">{def.emoji}</span> {def.nom}
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
        {cases.map(({ x, y, i, pile, sommet }) => (
          <g key={i}>
            <Pile x={x} y={y - s * 0.08} s={s} pile={pile} />
            {i === iCible && (
              <g>
                <circle cx={x} cy={y - sommet - s * 0.42} r={s * 0.26} fill="#fffdf8" stroke="#7d6f66" strokeWidth={1} />
                <text x={x} y={y - sommet - s * 0.42} textAnchor="middle" dominantBaseline="central" fontSize={s * 0.3}>
                  {def.emoji}
                </text>
              </g>
            )}
          </g>
        ))}
      </svg>
      <div className="carte-cubes">
        {Array.from({ length: def.cubes }, (_, i) => (
          <span key={i} className={cubesPoses !== undefined && i < cubesPoses ? 'cube plein' : 'cube'} />
        ))}
      </div>
    </button>
  );
}
