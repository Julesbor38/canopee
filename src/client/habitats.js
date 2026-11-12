// Habitats des cartes animaux : couleur et nom selon la case qui accueille l'animal.

import { indexCible } from '../moteur/motifs.js';

export const HABITATS = {
  riviere: { nom: 'Rivière', fond: '#dcedf6', clair: '#eef7fb', accent: '#3a7fae', fonce: '#24597e' },
  prairie: { nom: 'Prairie', fond: '#fbefc6', clair: '#fdf8e4', accent: '#b88a14', fonce: '#7e5e0a' },
  montagne: { nom: 'Montagne', fond: '#e5e8ee', clair: '#f3f4f7', accent: '#5d6979', fonce: '#3c4552' },
  arbre: { nom: 'Forêt', fond: '#dcefd8', clair: '#eff8ed', accent: '#3d7d4c', fonce: '#285634' },
  batiment: { nom: 'Village', fond: '#f8ded4', clair: '#fcf0eb', accent: '#b5533a', fonce: '#7f3423' },
};

/** Habitat d'une carte : celui de la case qui reçoit le cube. */
export function habitatDe(def) {
  if (!def) return HABITATS.prairie;
  return HABITATS[def.motif[indexCible(def)].type] ?? HABITATS.prairie;
}

/** Variables CSS d'habitat, à poser sur un élément (style). */
export function stylesHabitat(h) {
  return { '--hab-fond': h.fond, '--hab-clair': h.clair, '--hab': h.accent, '--hab-fonce': h.fonce };
}

/** Couleurs des joueurs (avatars, onglets). */
export const COULEURS_JOUEURS = ['#d9734e', '#4f8a63', '#3d86b3', '#9a6bb5'];
