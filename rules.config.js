// Configuration des règles de « Canopée » — modifiable.
// Toutes les valeurs marquées « TODO: à valider » sont des choix par défaut
// pris là où les règles n'étaient pas tranchées.

/** Couleurs de pions (6 couleurs dans le sac). */
export const COULEURS = {
  BLEU: 'bleu', // rivière
  GRIS: 'gris', // montagne
  MARRON: 'marron', // tronc
  VERT: 'vert', // feuillage (arbre)
  JAUNE: 'jaune', // prairie
  ROUGE: 'rouge', // bâtiment
};

const { BLEU, GRIS, MARRON, VERT, JAUNE, ROUGE } = COULEURS;

/** Configuration par défaut. */
const config = {
  plateau: {
    lignes: 6, // 6 cases de haut
    colonnes: 8, // 8 cases de large
  },

  // TODO: à valider — composition du sac (reprend des proportions proches du jeu d'origine)
  sac: {
    [BLEU]: 23,
    [GRIS]: 23,
    [MARRON]: 21,
    [VERT]: 19,
    [JAUNE]: 19,
    [ROUGE]: 15,
  },

  nbTas: 5, // 5 tas au centre de la table
  pionsParTas: 3, // 3 éléments par tas

  // Règles d'empilement : pour chaque couleur posée, liste des piles acceptées dessous.
  // Une pile est décrite par la liste de ses couleurs, du bas vers le haut ([] = case vide).
  empilement: {
    [BLEU]: [[]],
    [JAUNE]: [[]],
    [GRIS]: [[], [GRIS], [GRIS, GRIS]],
    [MARRON]: [[], [MARRON]],
    [VERT]: [[], [MARRON], [MARRON, MARRON]],
    [ROUGE]: [[], [GRIS], [MARRON], [ROUGE]],
  },

  scoring: {
    // Arbres : points selon la hauteur de la pile surmontée d'un vert
    arbres: { 1: 1, 2: 3, 3: 7 },
    // Montagnes : points selon la hauteur, seulement si adjacente à une autre montagne
    montagnes: { 1: 1, 2: 3, 3: 7 },
    // Rivières : points selon la longueur ; au-delà de la table, + parCaseSupplementaire
    rivieres: {
      table: { 1: 0, 2: 2, 3: 5, 4: 8, 5: 11, 6: 15 },
      parCaseSupplementaire: 4,
      // TODO: à valider — seule la plus longue rivière du plateau compte (comme dans le jeu d'origine).
      // Mettre false pour compter chaque rivière.
      seulementLaPlusLongue: true,
    },
    // Prairies : points par groupe d'au moins tailleMin cases adjacentes
    prairies: { pointsParGroupe: 5, tailleMin: 2 },
    // Bâtiments : points si le bâtiment (2 de haut) touche au moins couleursMin couleurs différentes
    batiments: { points: 5, couleursMin: 3, hauteurMin: 2 },
    // TODO: à valider — barème des cartes animaux
    animaux: { parCube: 2, bonusCloture: 3 },
  },

  cartes: {
    // TODO: à valider — nombre de cartes visibles au centre
    visibles: 5,
    // TODO: à valider — nombre d'exemplaires de chaque carte dans la pioche
    exemplaires: 2,
    // TODO: à valider — nombre maximal de cartes non terminées en main
    maxEnMain: 4,
    // TODO: à valider — une seule carte, prise en même temps que le tas
    maxParTour: 1,
    // TODO: à valider — les motifs peuvent être tournés (6 rotations hexagonales)
    rotations: true,
  },

  // TODO: à valider — la partie s'arrête dès qu'un joueur ne peut plus poser un pion
  // (ou qu'il n'y a plus de tas à prendre). Les scores sont calculés à ce moment-là.
  finDePartie: 'immediate',
};

export default config;

/**
 * Description des cases d'un motif :
 *  { type: 'prairie' }            → pile [jaune]
 *  { type: 'riviere' }            → pile [bleu]
 *  { type: 'montagne', hauteur }  → pile de `hauteur` gris
 *  { type: 'arbre', hauteur }     → (hauteur-1) marron + 1 vert
 *  { type: 'batiment' }           → pile de 2 avec un rouge au sommet
 *
 * Les positions sont en coordonnées axiales (q, r) relatives ; q+1 = case à droite.
 * `cible` = index de la case qui reçoit le cube animal.
 * TODO: à valider — par défaut, la cible est la case la plus à droite du motif.
 */
export const CARTES_ANIMAUX = [
  {
    id: 'aigle', nom: 'Aigle', cubes: 2,
    motif: [{ q: 0, r: 0, type: 'prairie' }, { q: 1, r: 0, type: 'montagne', hauteur: 3 }],
  },
  {
    id: 'coccinelle', nom: 'Coccinelle', cubes: 5,
    motif: [{ q: 0, r: 0, type: 'prairie' }, { q: 1, r: 0, type: 'arbre', hauteur: 1 }],
  },
  {
    id: 'grenouille', nom: 'Grenouille', cubes: 4,
    motif: [{ q: 0, r: 0, type: 'riviere' }, { q: 1, r: 0, type: 'prairie' }],
  },
  {
    id: 'ours', nom: 'Ours', cubes: 3,
    motif: [{ q: 0, r: 0, type: 'montagne', hauteur: 2 }, { q: 1, r: 0, type: 'arbre', hauteur: 3 }],
  },
  {
    id: 'renard', nom: 'Renard', cubes: 3,
    motif: [
      { q: 0, r: 0, type: 'prairie' }, { q: 1, r: 0, type: 'prairie' },
      { q: 2, r: 0, type: 'arbre', hauteur: 2 },
    ],
  },
  {
    id: 'loutre', nom: 'Loutre', cubes: 3,
    motif: [
      { q: 0, r: 0, type: 'riviere' }, { q: 1, r: 0, type: 'riviere' },
      { q: 2, r: 0, type: 'arbre', hauteur: 2 },
    ],
  },
  {
    id: 'herisson', nom: 'Hérisson', cubes: 4,
    motif: [{ q: 0, r: 0, type: 'batiment' }, { q: 1, r: 0, type: 'prairie' }],
  },
  {
    id: 'chouette', nom: 'Chouette', cubes: 2,
    motif: [{ q: 0, r: 0, type: 'arbre', hauteur: 3 }, { q: 1, r: 0, type: 'arbre', hauteur: 3 }],
  },
  {
    id: 'martin', nom: 'Martin-pêcheur', cubes: 3,
    motif: [
      { q: 0, r: 0, type: 'riviere' }, { q: 1, r: 0, type: 'riviere' }, { q: 2, r: 0, type: 'riviere' },
    ],
  },
  {
    id: 'chamois', nom: 'Chamois', cubes: 4,
    motif: [{ q: 0, r: 0, type: 'montagne', hauteur: 1 }, { q: 1, r: 0, type: 'montagne', hauteur: 2 }],
  },
  {
    id: 'cigogne', nom: 'Cigogne', cubes: 3,
    motif: [{ q: 0, r: 0, type: 'riviere' }, { q: 1, r: 0, type: 'batiment' }],
  },
  {
    id: 'ecureuil', nom: 'Écureuil', cubes: 4,
    motif: [{ q: 0, r: 0, type: 'arbre', hauteur: 1 }, { q: 1, r: 0, type: 'arbre', hauteur: 2 }],
  },
  {
    id: 'abeille', nom: 'Abeille', cubes: 3,
    motif: [
      { q: 0, r: 0, type: 'prairie' }, { q: 1, r: 0, type: 'prairie' },
      { q: 0, r: 1, type: 'batiment' },
    ],
  },
  {
    id: 'marmotte', nom: 'Marmotte', cubes: 3,
    motif: [
      { q: 0, r: 0, type: 'montagne', hauteur: 1 }, { q: 1, r: 0, type: 'prairie' },
      { q: 0, r: 1, type: 'prairie' },
    ],
  },
];
