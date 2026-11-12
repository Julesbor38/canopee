// Médaillon d'animal : jeton rond émaillé, couleur de l'habitat, animal au centre.

import { useId } from 'react';

/** Médaillon autonome (SVG) pour les cartes, la piste et les listes. */
export function Medaillon({ emoji, habitat, taille = 44, eteint = false, titre }) {
  const id = `med${useId().replace(/:/g, '')}`;
  const r = 50;
  return (
    <svg
      className={`medaillon${eteint ? ' eteint' : ''}`}
      width={taille}
      height={taille}
      viewBox="-54 -54 108 108"
      role={titre ? 'img' : undefined}
      aria-label={titre}
      aria-hidden={titre ? undefined : true}
    >
      <JetonDefs id={id} habitat={habitat} />
      <JetonCorps id={id} r={r} />
      <text x="0" y="3" textAnchor="middle" dominantBaseline="central" fontSize={r * 1.02} className="medaillon-animal">
        {emoji}
      </text>
    </svg>
  );
}

/** Dégradés d'un jeton (à placer dans un <svg>). */
export function JetonDefs({ id, habitat }) {
  return (
    <defs>
      <radialGradient id={`${id}-fond`} cx="35%" cy="28%" r="80%">
        <stop offset="0%" stopColor="#ffffff" />
        <stop offset="45%" stopColor={habitat.clair} />
        <stop offset="100%" stopColor={habitat.fond} />
      </radialGradient>
      <linearGradient id={`${id}-bord`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#f3d68b" />
        <stop offset="50%" stopColor="#c99a3a" />
        <stop offset="100%" stopColor="#8f6a22" />
      </linearGradient>
      <linearGradient id={`${id}-anneau`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor={habitat.accent} />
        <stop offset="100%" stopColor={habitat.fonce} />
      </linearGradient>
    </defs>
  );
}

/** Corps du jeton : cerclage doré, anneau d'habitat, fond émaillé, reflet. */
export function JetonCorps({ id, r, cx = 0, cy = 0 }) {
  return (
    <g>
      <circle cx={cx} cy={cy + r * 0.06} r={r} fill="rgba(40,35,20,.25)" />
      <circle cx={cx} cy={cy} r={r} fill={`url(#${id}-bord)`} />
      <circle cx={cx} cy={cy} r={r * 0.9} fill={`url(#${id}-anneau)`} />
      <circle cx={cx} cy={cy} r={r * 0.78} fill={`url(#${id}-fond)`} />
      <circle cx={cx} cy={cy} r={r * 0.84} fill="none" stroke="#fff" strokeOpacity="0.35" strokeWidth={r * 0.025} strokeDasharray={`${r * 0.06} ${r * 0.08}`} />
      <path
        d={`M${cx - r * 0.62},${cy - r * 0.28} A${r * 0.7},${r * 0.7} 0 0 1 ${cx + r * 0.3},${cy - r * 0.68}`}
        fill="none"
        stroke="#fff"
        strokeOpacity="0.7"
        strokeWidth={r * 0.07}
        strokeLinecap="round"
      />
    </g>
  );
}
