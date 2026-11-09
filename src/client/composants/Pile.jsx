import { COULEURS_AFFICHAGE, SYMBOLES, pointsHex } from '../geometrie.js';

/** Dessine une pile de pions centrée en (x, y), chaque niveau légèrement surélevé. */
export function Pile({ x, y, s, pile }) {
  const pas = s * 0.2;
  return (
    <g>
      {pile.map((couleur, i) => {
        const yi = y - i * pas;
        const dernier = i === pile.length - 1;
        return (
          <g key={i}>
            <polygon
              points={pointsHex(x, yi, s * 0.86)}
              fill={COULEURS_AFFICHAGE[couleur]}
              stroke="rgba(0,0,0,.35)"
              strokeWidth={s * 0.04}
            />
            {dernier && (
              <text
                x={x}
                y={yi}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize={s * 0.62}
                fill="rgba(255,255,255,.85)"
                pointerEvents="none"
              >
                {SYMBOLES[couleur]}
              </text>
            )}
          </g>
        );
      })}
      {pile.length > 1 && (
        <text
          x={x + s * 0.5}
          y={y + s * 0.5 - (pile.length - 1) * pas}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={s * 0.36}
          fontWeight="700"
          fill="#fff"
          stroke="rgba(0,0,0,.6)"
          strokeWidth={s * 0.06}
          paintOrder="stroke"
          pointerEvents="none"
        >
          {pile.length}
        </text>
      )}
    </g>
  );
}

/** Un pion isolé (pour les tas et la main). */
export function Pion({ couleur, taille = 22, choisi = false }) {
  const s = taille;
  return (
    <svg width={s * 2} height={s * 2} viewBox={`${-s} ${-s} ${2 * s} ${2 * s}`} aria-label={couleur}>
      <polygon
        points={pointsHex(0, 0, s * 0.92)}
        fill={COULEURS_AFFICHAGE[couleur]}
        stroke={choisi ? '#111' : 'rgba(0,0,0,.35)'}
        strokeWidth={choisi ? s * 0.16 : s * 0.06}
      />
      <text textAnchor="middle" dominantBaseline="central" fontSize={s * 0.8} fill="rgba(255,255,255,.9)">
        {SYMBOLES[couleur]}
      </text>
    </svg>
  );
}
