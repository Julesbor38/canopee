import { centre, dimensions, pointsHex, sommetsHex, versPoints } from '../geometrie.js';
import { construirePile, Pile } from './Pile.jsx';

/** Identifiant de carte d'un cube : « aigle-2 » → « aigle ». */
const idDuCube = (uid) => uid.replace(/-[^-]+$/, '');

/** Épaisseur d'une case du plateau (relative au rayon). */
const EPAISSEUR = 0.1;

/** Cases de la ligne précédente (plus au fond) que la case (l, c) peut masquer. */
function derriere(plateau, l, c) {
  if (l === 0) return [];
  const cols = l & 1 ? [c, c + 1] : [c - 1, c];
  return cols.filter((k) => k >= 0 && k < plateau.colonnes).map((k) => plateau.cases[l - 1][k]);
}

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
      <defs>
        <filter id="ombre-emoji" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="1" stdDeviation="1.2" floodColor="#3c3530" floodOpacity="0.55" />
        </filter>
      </defs>
      {/* dessin ligne par ligne, du fond vers l'avant, pour que les piles se recouvrent correctement */}
      {plateau.cases.map((ligne, l) =>
        ligne.map((kase, c) => {
          const { x, y } = centre(l, c, s);
          const sol = y - s * EPAISSEUR;
          const cle = `${l},${c}`;
          const jouable = surbrillance?.has(cle);
          const cible = cibles?.has(cle);
          const cliquable = (jouable || cible) && surCase;
          const { surface, sommet } = construirePile(x, sol, s, kase.pile);
          // une pile haute devient translucide si elle cache une case occupée juste derrière
          const masque = sommet > s * 0.45 && derriere(plateau, l, c).some((k) => k.pile.length);
          return (
            <g
              key={cle}
              data-case={cle}
              className={cliquable ? 'case cliquable' : 'case'}
              onClick={cliquable ? () => surCase(l, c) : undefined}
            >
              <Dalle x={x} y={y} s={s} />
              <g opacity={masque ? 0.62 : 1}>
                <Pile x={x} y={sol} s={s} pile={kase.pile} />
              </g>
              {jouable && <polygon points={pointsHex(x, sol - surface, s * 0.78)} className="halo-jouable" />}
              {cible && <polygon points={pointsHex(x, sol - surface, s * 0.86)} className="halo-cible" />}
            </g>
          );
        }),
      )}
      {/* animaux dessinés en dernier : jamais cachés par une pile située devant */}
      {plateau.cases.flatMap((ligne, l) =>
        ligne.map((kase, c) => {
          if (!kase.cube) return null;
          const { x, y } = centre(l, c, s);
          const { sommet } = construirePile(x, y - s * EPAISSEUR, s, kase.pile);
          const def = definitions[idDuCube(kase.cube)];
          return (
            <text
              key={`cube${l},${c}`}
              x={x}
              y={y - s * EPAISSEUR - sommet - s * 0.2}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize={s * 0.55}
              filter="url(#ombre-emoji)"
              pointerEvents="none"
            >
              {def?.emoji ?? '●'}
            </text>
          );
        }),
      )}
    </svg>
  );
}
