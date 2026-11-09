// Point d'entrée du moteur : aucune dépendance à l'affichage ni au réseau.
export * from './hex.js';
export * from './plateau.js';
export * from './motifs.js';
export * from './score.js';
export * from './partie.js';
export * from './bot.js';
export { default as configParDefaut, COULEURS, CARTES_ANIMAUX } from '../../rules.config.js';
