import { centre, dimensions, pointsHex, sommetsHex, versPoints } from '../geometrie.js';
import { construirePile, Pile } from './Pile.jsx';

/** Identifiant de carte d'un cube : « aigle-2 » → « aigle ». */
const idDuCube = (uid) => uid.replace(/-[^-]+$/, '');

/** Épaisseur d'une case du plateau (relative au rayon). */
const EPAISSEUR = 0.1;

/** Case vide du plateau : petite dalle en relief. */
function Dalle({ x, y, s }) {
  const h = s * EPAISSEUR;
  const haut = sommetsHex(x, y - h, s * 0.96);
  const bas = sommetsHex(x, y, s * 0.96);
  return (
    <g>
      <polygon points={versPoints([haut[4], haut[3], haut[2], haut[1], haut[0], bas[0], bas[1], bas[2], bas[3], bas[4]])} className="dalle-cote" />
      <polygon points={versPoints(haut)} className="fond-case" />
    </g>
  );
}

/**
 * Plateau hexagonal d'un joueur, en perspective.
 * @param {object} props.plateau
 * @param {Set<string>} [props.surbrillance] cases jouables « ligne,colonne »
 * @param {Set<string>} [props.cibles] cases cibles d'un cube animal
 * @param {(l: number, c: number) => void} [props.surCase]
 * @param {object} props.definitions cartes animaux (pour l'emoji des cubes)
 */
export function Plateau({ plateau, s = 34, surbrillance, cibles, surCase, definitions }) {
  const { largeur, hauteur } = dimensions(plateau.lignes, plateau.colonnes, s);
  const marge = s * 0.3;

  return (
    <svg
      className="plateau"
      viewBox={`${-marge} ${-marge} ${largeur + 2 * marge} ${hauteur + 2 * marge}`}
      role="grid"
      aria-label="Plateau"
    >
      {/* dessin ligne par ligne, du fond vers l'avant, pour que les piles se recouvrent correctement */}
      {plateau.cases.map((ligne, l) =>
        ligne.map((kase, c) => {
          const { x, y } = centre(l, c, s);
          const sol = y - s * EPAISSEUR;
          const cle = `${l},${c}`;
          const jouable = surbrillance?.has(cle);
          const cible = cibles?.has(cle);
          const cliquable = (jouable || cible) && surCase;
          const def = kase.cube && definitions[idDuCube(kase.cube)];
          const { surface, sommet } = construirePile(x, sol, s, kase.pile);
          return (
            <g
              key={cle}
              data-case={cle}
              className={cliquable ? 'case cliquable' : 'case'}
              onClick={cliquable ? () => surCase(l, c) : undefined}
            >
              <Dalle x={x} y={y} s={s} />
              <Pile x={x} y={sol} s={s} pile={kase.pile} />
              {jouable && <polygon points={pointsHex(x, sol - surface, s * 0.78)} className="halo-jouable" />}
              {cible && <polygon points={pointsHex(x, sol - surface, s * 0.86)} className="halo-cible" />}
              {kase.cube && (
                <g pointerEvents="none">
                  <circle cx={x} cy={sol - sommet - s * 0.18} r={s * 0.36} fill="#fffdf8" stroke="#7d6f66" strokeWidth={1} />
                  <text x={x} y={sol - sommet - s * 0.18} textAnchor="middle" dominantBaseline="central" fontSize={s * 0.42}>
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
