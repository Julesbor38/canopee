import { COULEURS_JOUEURS } from '../habitats.js';

/** Pastille ronde d'un joueur : initiale sur sa couleur. */
export function Avatar({ nom, index, taille = 28 }) {
  return (
    <span
      className="avatar"
      aria-hidden="true"
      style={{ width: taille, height: taille, fontSize: taille * 0.48, background: COULEURS_JOUEURS[index % 4] }}
    >
      {(nom || '?').trim().charAt(0).toUpperCase()}
    </span>
  );
}
