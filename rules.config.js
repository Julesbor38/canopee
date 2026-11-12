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
    lignes: 4, // 4 cases de haut
    colonnes: 6, // 6 cases de large
  },

  // Composition du sac (120 pions, comme dans le jeu d'origine)
  sac: {
    [BLEU]: 23,
    [GRIS]: 23,
    [MARRON]: 21,
    [VERT]: 19,
    [JAUNE]: 19,
    [ROUGE]: 15,
  },

  // l'ordre des tours est tiré au sort en début de partie (sinon : ordre d'inscription)
  ordreAleatoire: true,

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
    // bâtiment : sur un bloc seul de roche, de tronc ou de bâtiment (jamais sur un feuillage) —
    // le socle n'a aucune incidence sur les points ni sur les motifs
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
    // TODO: à valider — barème des cartes animaux, calculé selon la difficulté du motif.
    // Difficulté = somme des coûts des cases du motif (+ un supplément pour les formes à 3 cases).
    // Chaque animal rapporte plus que le précédent (la contrainte augmente à mesure que le
    // plateau se remplit) : le 1er rapporte arrondi(difficulté), chaque suivant ajoute
    // max(1, arrondi(difficulté × pas)) de plus que le précédent.
    // Une carte peut aussi fixer sa piste à la main avec `points: [...]` (scores cumulés).
    animaux: {
      couts: {
        prairie: 1,
        riviere: 1,
        montagne: { 1: 1, 2: 2.5, 3: 4.5 }, // selon la hauteur
        arbre: { 1: 1, 2: 2.5, 3: 4.5 }, // selon la hauteur
        batiment: 3, // 2 pions dont un rouge (le plus rare)
      },
      supplementForme3: 0.5, // contrainte d'alignement / de triangle
      pas: 0.3,
    },
  },

  cartes: {
    // TODO: à valider — nombre de cartes visibles au centre
    visibles: 5,
    // Chaque carte n'existe qu'en un seul exemplaire (pas de doublon)
    exemplaires: 1,
    // TODO: à valider — nombre maximal de cartes non terminées en main
    maxEnMain: 4,
    // TODO: à valider — une seule carte, prise en même temps que le tas
    maxParTour: 1,
    // TODO: à valider — les motifs peuvent être tournés (6 rotations hexagonales)
    rotations: true,
    // les motifs peuvent aussi être réalisés en miroir : seul compte quelle case touche quelle case
    symetries: true,
  },

  // Fin de partie quand un joueur ne peut plus poser de pion :
  //  'dernierTour' : il défausse les pions impossibles à poser, peut encore compléter ses animaux
  //                  et finir son tour, puis chacun des autres joueurs joue un dernier tour ;
  //  'immediate'   : la partie s'arrête aussitôt.
  // Dans tous les cas, la partie s'arrête s'il n'y a plus aucun tas à prendre.
  finDePartie: 'dernierTour',
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
    id: 'aigle', nom: 'Aigle', emoji: '🦅', cubes: 2,
    motif: [{ q: 0, r: 0, type: 'prairie' }, { q: 1, r: 0, type: 'montagne', hauteur: 3 }],
  },
  {
    id: 'coccinelle', nom: 'Coccinelle', emoji: '🐞', cubes: 5,
    motif: [{ q: 0, r: 0, type: 'prairie' }, { q: 1, r: 0, type: 'arbre', hauteur: 1 }],
  },
  {
    id: 'grenouille', nom: 'Grenouille', emoji: '🐸', cubes: 4, cible: 0,
    motif: [{ q: 0, r: 0, type: 'riviere' }, { q: 1, r: 0, type: 'prairie' }],
  },
  {
    id: 'ours', nom: 'Ours', emoji: '🐻', cubes: 3,
    motif: [{ q: 0, r: 0, type: 'montagne', hauteur: 2 }, { q: 1, r: 0, type: 'arbre', hauteur: 3 }],
  },
  {
    // renard tapi dans un buisson au bord des champs
    id: 'renard', nom: 'Renard', emoji: '🦊', cubes: 3, cible: 2,
    motif: [
      { q: 0, r: 0, type: 'prairie' }, { q: 1, r: 0, type: 'prairie' },
      { q: 2, r: 0, type: 'arbre', hauteur: 2 },
    ],
  },
  {
    // loutre sur la rive, entre deux prairies
    id: 'loutre', nom: 'Loutre', emoji: '🦦', cubes: 3, cible: 0,
    motif: [
      { q: 0, r: 0, type: 'riviere' }, { q: 1, r: 0, type: 'prairie' },
      { q: 2, r: 0, type: 'prairie' },
    ],
  },
  {
    id: 'herisson', nom: 'Hérisson', emoji: '🦔', cubes: 4,
    motif: [{ q: 0, r: 0, type: 'batiment' }, { q: 1, r: 0, type: 'prairie' }],
  },
  {
    // forêt étagée : grand arbre (cible) entouré d'un arbre moyen et d'un petit
    id: 'chouette', nom: 'Chouette', emoji: '🦉', cubes: 2, cible: 0,
    motif: [
      { q: 0, r: 0, type: 'arbre', hauteur: 3 }, { q: 1, r: 0, type: 'arbre', hauteur: 2 },
      { q: 0, r: 1, type: 'arbre', hauteur: 1 },
    ],
  },
  {
    // martin-pêcheur perché au-dessus de l'eau
    id: 'martin', nom: 'Martin-pêcheur', emoji: '🐦', cubes: 4, cible: 0,
    motif: [{ q: 0, r: 0, type: 'riviere' }, { q: 1, r: 0, type: 'arbre', hauteur: 2 }],
  },
  {
    id: 'chamois', nom: 'Chamois', emoji: '🐐', cubes: 4,
    motif: [{ q: 0, r: 0, type: 'montagne', hauteur: 1 }, { q: 1, r: 0, type: 'montagne', hauteur: 2 }],
  },
  {
    id: 'cigogne', nom: 'Cigogne', emoji: '🦩', cubes: 3, cible: 0,
    motif: [{ q: 0, r: 0, type: 'riviere' }, { q: 1, r: 0, type: 'batiment' }],
  },
  {
    id: 'ecureuil', nom: 'Écureuil', emoji: '🐿️', cubes: 4,
    motif: [{ q: 0, r: 0, type: 'arbre', hauteur: 1 }, { q: 1, r: 0, type: 'arbre', hauteur: 2 }],
  },
  {
    // buisson fleuri entouré de prairies (comme la carte abeille du jeu de base)
    id: 'abeille', nom: 'Abeille', emoji: '🐝', cubes: 3, cible: 0,
    motif: [
      { q: 0, r: 0, type: 'arbre', hauteur: 1 }, { q: -1, r: 0, type: 'prairie' },
      { q: -1, r: 1, type: 'prairie' }, { q: 0, r: 1, type: 'prairie' },
    ],
  },
  {
    id: 'marmotte', nom: 'Marmotte', emoji: '🐹', cubes: 3, cible: 0,
    motif: [
      { q: 0, r: 0, type: 'montagne', hauteur: 1 }, { q: 1, r: 0, type: 'prairie' },
      { q: 0, r: 1, type: 'prairie' },
    ],
  },
  {
    // cerf dans une clairière entre deux arbres
    id: 'cerf', nom: 'Cerf', emoji: '🦌', cubes: 3, cible: 2,
    motif: [
      { q: 0, r: 0, type: 'arbre', hauteur: 2 }, { q: 1, r: 0, type: 'arbre', hauteur: 2 },
      { q: 0, r: 1, type: 'prairie' },
    ],
  },
  {
    // terrier de lapin au pied d'un rocher
    id: 'lapin', nom: 'Lapin', emoji: '🐇', cubes: 4, cible: 0,
    motif: [{ q: 0, r: 0, type: 'prairie' }, { q: 1, r: 0, type: 'montagne', hauteur: 1 }],
  },
  {
    // barrage de castor entre deux jeunes arbres
    id: 'castor', nom: 'Castor', emoji: '🦫', cubes: 3, cible: 0,
    motif: [
      { q: 0, r: 0, type: 'riviere' }, { q: 1, r: 0, type: 'arbre', hauteur: 1 },
      { q: 0, r: 1, type: 'arbre', hauteur: 1 },
    ],
  },
  {
    id: 'chauvesouris', nom: 'Chauve-souris', emoji: '🦇', cubes: 3,
    motif: [{ q: 0, r: 0, type: 'batiment' }, { q: 1, r: 0, type: 'arbre', hauteur: 2 }],
  },
  {
    id: 'bouquetin', nom: 'Bouquetin', emoji: '🐏', cubes: 2,
    motif: [{ q: 0, r: 0, type: 'montagne', hauteur: 2 }, { q: 1, r: 0, type: 'montagne', hauteur: 3 }],
  },
  {
    // mare aux canards près d'une prairie et d'un buisson
    id: 'canard', nom: 'Canard', emoji: '🦆', cubes: 3, cible: 0,
    motif: [
      { q: 0, r: 0, type: 'riviere' }, { q: 1, r: 0, type: 'prairie' },
      { q: 0, r: 1, type: 'arbre', hauteur: 1 },
    ],
  },
  {
    // loup sur un rocher entre deux arbres
    id: 'loup', nom: 'Loup', emoji: '🐺', cubes: 3, cible: 1,
    motif: [
      { q: 0, r: 0, type: 'arbre', hauteur: 2 }, { q: 1, r: 0, type: 'montagne', hauteur: 1 },
      { q: 2, r: 0, type: 'arbre', hauteur: 2 },
    ],
  },
  {
    // sanglier dans une prairie entre deux buissons
    id: 'sanglier', nom: 'Sanglier', emoji: '🐗', cubes: 4, cible: 1,
    motif: [
      { q: 0, r: 0, type: 'arbre', hauteur: 1 }, { q: 1, r: 0, type: 'prairie' },
      { q: 2, r: 0, type: 'arbre', hauteur: 1 },
    ],
  },
  {
    // tortue au bord de l'eau, entre les rochers
    id: 'tortue', nom: 'Tortue', emoji: '🐢', cubes: 3, cible: 0,
    motif: [
      { q: 0, r: 0, type: 'riviere' }, { q: 1, r: 0, type: 'montagne', hauteur: 1 },
      { q: 0, r: 1, type: 'montagne', hauteur: 1 },
    ],
  },
  {
    // escargot dans une prairie, entre un rocher et un buisson
    id: 'escargot', nom: 'Escargot', emoji: '🐌', cubes: 3, cible: 1,
    motif: [
      { q: 0, r: 0, type: 'montagne', hauteur: 1 }, { q: 1, r: 0, type: 'prairie' },
      { q: 2, r: 0, type: 'arbre', hauteur: 1 },
    ],
  },
  {
    id: 'papillon', nom: 'Papillon', emoji: '🦋', cubes: 3, cible: 0,
    motif: [
      { q: 0, r: 0, type: 'prairie' }, { q: 1, r: 0, type: 'arbre', hauteur: 1 },
      { q: 0, r: 1, type: 'batiment' },
    ],
  },
  {
    // saumon qui remonte le torrent descendu de la montagne
    id: 'saumon', nom: 'Saumon', emoji: '🐟', cubes: 3, cible: 0,
    motif: [
      { q: 0, r: 0, type: 'riviere' }, { q: 1, r: 0, type: 'montagne', hauteur: 1 },
      { q: 2, r: 0, type: 'montagne', hauteur: 2 },
    ],
  },
  {
    // grange au bord des champs : bâtiment (cible) + prairie + prairie
    id: 'souris', nom: 'Souris', emoji: '🐭', cubes: 3, cible: 0,
    motif: [
      { q: 0, r: 0, type: 'batiment' }, { q: 1, r: 0, type: 'prairie' },
      { q: 2, r: 0, type: 'prairie' },
    ],
  },
  {
    id: 'paon', nom: 'Paon', emoji: '🦚', cubes: 2,
    motif: [
      { q: 0, r: 0, type: 'prairie' }, { q: 1, r: 0, type: 'arbre', hauteur: 3 },
      { q: 0, r: 1, type: 'prairie' },
    ],
  },
  {
    id: 'lezard', nom: 'Lézard', emoji: '🦎', cubes: 4,
    motif: [{ q: 0, r: 0, type: 'prairie' }, { q: 1, r: 0, type: 'montagne', hauteur: 2 }],
  },
  {
    id: 'serpent', nom: 'Serpent', emoji: '🐍', cubes: 3,
    motif: [
      { q: 0, r: 0, type: 'riviere' }, { q: 1, r: 0, type: 'prairie' },
      { q: 2, r: 0, type: 'montagne', hauteur: 1 },
    ],
  },
];
