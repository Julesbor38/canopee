import { indexCible } from '../../moteur/motifs.js';
import { centreAxial, pileDuMotif, pointsHex } from '../geometrie.js';
import { Pile } from './Pile.jsx';

/** Carte animal : nom, motif dessiné, progression des cubes. */
export function CarteAnimal({ def, cubesPoses, choisie, possible, onClick, compacte = false }) {
  const s = compacte ? 11 : 14;
  const pts = def.motif.map((m) => centreAxial(m.q, m.r, s));
  const xs = pts.map((p) => p.x);
  const ys = pts.map((p) => p.y);
  const minX = Math.min(...xs) - s * 1.1;
  const minY = Math.min(...ys) - s * 1.6;
  const l = Math.max(...xs) - minX + s * 1.1;
  const h = Math.max(...ys) - minY + s * 1.1;
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
      <svg width={l} height={h} viewBox={`${minX} ${minY} ${l} ${h}`}>
        {def.motif.map((m, i) => (
          <g key={i}>
            <polygon points={pointsHex(pts[i].x, pts[i].y, s * 0.97)} fill="#efe4c8" stroke="#b9a77c" />
            <Pile x={pts[i].x} y={pts[i].y} s={s} pile={pileDuMotif(m)} />
            {i === iCible && (
              <circle
                cx={pts[i].x}
                cy={pts[i].y - (pileDuMotif(m).length - 1) * s * 0.2 - s * 0.9}
                r={s * 0.28}
                fill="#fffaf0"
                stroke="#3b2f2f"
              />
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
