import { centre, dimensions, pointsHex } from '../geometrie.js';
import { Pile } from './Pile.jsx';

/** Identifiant de carte d'un cube : « aigle-2 » → « aigle ». */
const idDuCube = (uid) => uid.replace(/-[^-]+$/, '');

/**
 * Plateau hexagonal d'un joueur.
 * @param {object} props.plateau
 * @param {Set<string>} [props.surbrillance] cases jouables « ligne,colonne »
 * @param {Set<string>} [props.cibles] cases cibles d'un cube animal
 * @param {(l: number, c: number) => void} [props.surCase]
 * @param {object} props.definitions cartes animaux (pour l'emoji des cubes)
 */
export function Plateau({ plateau, s = 34, surbrillance, cibles, surCase, definitions }) {
  const { largeur, hauteur } = dimensions(plateau.lignes, plateau.colonnes, s);
  const marge = s * 0.5;

  return (
    <svg
      className="plateau"
      viewBox={`${-marge / 2} ${-marge} ${largeur + marge} ${hauteur + marge * 1.5}`}
      role="grid"
      aria-label="Plateau"
    >
      {plateau.cases.map((ligne, l) =>
        ligne.map((kase, c) => {
          const { x, y } = centre(l, c, s);
          const cle = `${l},${c}`;
          const jouable = surbrillance?.has(cle);
          const cible = cibles?.has(cle);
          const cliquable = (jouable || cible) && surCase;
          const def = kase.cube && definitions[idDuCube(kase.cube)];
          return (
            <g
              key={cle}
              data-case={cle}
              className={cliquable ? 'case cliquable' : 'case'}
              onClick={cliquable ? () => surCase(l, c) : undefined}
            >
              <polygon points={pointsHex(x, y, s * 0.97)} className="fond-case" />
              <Pile x={x} y={y} s={s} pile={kase.pile} />
              {jouable && (
                <polygon points={pointsHex(x, y - kase.pile.length * s * 0.2, s * 0.86)} className="halo-jouable" />
              )}
              {cible && (
                <polygon points={pointsHex(x, y - kase.pile.length * s * 0.2, s * 0.86)} className="halo-cible" />
              )}
              {kase.cube && (
                <g pointerEvents="none">
                  <circle
                    cx={x}
                    cy={y - kase.pile.length * s * 0.2}
                    r={s * 0.42}
                    fill="#fffaf0"
                    stroke="#3b2f2f"
                    strokeWidth={s * 0.05}
                  />
                  <text
                    x={x}
                    y={y - kase.pile.length * s * 0.2}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fontSize={s * 0.5}
                  >
                    {def?.emoji ?? '●'}
                  </text>
                </g>
              )}
            </g>
          );
        }),
      )}
    </svg>
  );
}
