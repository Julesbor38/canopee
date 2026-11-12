import { useId } from 'react';
import { centre, dimensions, pointsHex, sommetsHex, versPoints } from '../geometrie.js';
import { habitatDe } from '../habitats.js';
import { JetonCorps, JetonDefs } from './Medaillon.jsx';
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

/** Contour latéral (faces visibles) d'un prisme hexagonal entre `haut` et `bas`. */
const cote = (haut, bas) => versPoints([haut[4], haut[3], haut[2], haut[1], haut[0], bas[0], bas[1], bas[2], bas[3], bas[4]]);

/** Case du plateau : petite dalle de terre battue en relief. */
function Dalle({ x, y, s, id }) {
  const h = s * EPAISSEUR;
  const haut = sommetsHex(x, y - h, s * 0.9);
  const bas = sommetsHex(x, y, s * 0.9);
  return (
    <g>
      <polygon points={cote(haut, bas)} className="dalle-cote" />
      <polygon points={versPoints(haut)} className="fond-case" fill={`url(#${id}-dalle)`} />
    </g>
  );
}

/** Socle de l'île : toutes les cases agrandies, d'abord les flancs de terre, puis l'herbe. */
function Ile({ plateau, s }) {
  const cellules = plateau.cases.flatMap((ligne, l) => ligne.map((_, c) => centre(l, c, s)));
  const ep = s * 0.42;
  return (
    <g className="ile">
      {cellules.map(({ x, y }, i) => (
        <polygon key={`o${i}`} points={pointsHex(x, y + ep + s * 0.12, s * 1.16)} fill="rgba(40,50,30,.22)" />
      ))}
      {cellules.map(({ x, y }, i) => {
        const haut = sommetsHex(x, y, s * 1.12);
        const bas = sommetsHex(x, y + ep, s * 1.12);
        return <polygon key={`f${i}`} points={cote(haut, bas)} className="ile-flanc" />;
      })}
      {cellules.map(({ x, y }, i) => (
        <polygon key={`h${i}`} points={pointsHex(x, y, s * 1.12)} className="ile-herbe" />
      ))}
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
  const id = `pl${useId().replace(/:/g, '')}`;
  const { largeur, hauteur } = dimensions(plateau.lignes, plateau.colonnes, s);
  const marge = s * 0.45;

  return (
    <svg
      className="plateau"
      viewBox={`${-marge} ${-marge} ${largeur + 2 * marge} ${hauteur + marge + s * 0.55}`}
      role="grid"
      aria-label="Plateau"
    >
      <defs>
        <radialGradient id={`${id}-dalle`} cx="45%" cy="35%" r="75%">
          <stop offset="0%" stopColor="#f7efdc" />
          <stop offset="100%" stopColor="#e6d7b8" />
        </radialGradient>
      </defs>
      <Ile plateau={plateau} s={s} />
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
              <Dalle x={x} y={y} s={s} id={id} />
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
          const r = s * 0.34;
          const cy = y - s * EPAISSEUR - sommet - r * 1.05;
          const jid = `${id}-j${l}-${c}`;
          return (
            <g key={`cube${l},${c}`} className="jeton-animal" pointerEvents="none">
              <JetonDefs id={jid} habitat={habitatDe(def)} />
              <ellipse cx={x} cy={y - s * EPAISSEUR - sommet} rx={r * 0.7} ry={r * 0.22} fill="rgba(30,30,20,.3)" />
              <JetonCorps id={jid} r={r} cx={x} cy={cy} />
              <text x={x} y={cy + 1} textAnchor="middle" dominantBaseline="central" fontSize={r * 1.05}>
                {def?.emoji ?? '●'}
              </text>
            </g>
          );
        }),
      )}
    </svg>
  );
}
