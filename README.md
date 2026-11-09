# Canopée

Jeu de société numérique de construction de paysages, pour 1 à 4 joueurs,
inspiré des mécaniques de *Harmonies* (Libellud) — nom, cartes et graphismes originaux.

## Installation

Prérequis : WSL (Ubuntu) avec Node.js LTS.

```bash
# si Node.js n'est pas installé
curl -fsSo- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
source ~/.bashrc && nvm install --lts

npm install
```

## Commandes

| Commande | Rôle |
| --- | --- |
| `npm test` | Lance tous les tests du moteur (Vitest) |
| `npm run demo -- 2 2026` | Partie automatique entre bots (nb joueurs, graine), affichée dans le terminal |

## Architecture

```
rules.config.js     Règles modifiables (barèmes, sac, empilement, cartes animaux)
src/moteur/         Moteur de jeu en JavaScript pur (Node.js et navigateur)
  hex.js            Géométrie hexagonale (coordonnées décalées « odd-r » et axiales)
  plateau.js        Plateau, règles de pose, groupes connexes
  motifs.js         Reconnaissance des motifs des cartes animaux
  score.js          Calcul des points
  partie.js         État de partie et actions (creerPartie, appliquerAction)
  hasard.js         Générateur pseudo-aléatoire à graine
  bot.js            Joueur automatique simple
tests/              Tests unitaires
scripts/demo.js     Démonstration en ligne de commande
```

L'état d'une partie est un objet JSON pur. Toute modification passe par
`appliquerAction(etat, indexJoueur, action)` qui valide le coup et renvoie
`{ ok: true, etat }` (nouvel état, l'ancien n'est pas modifié) ou `{ ok: false, erreur }`.

Actions :

```js
{ type: 'prendreTas', tas: 0, carte: 2 }            // carte facultative
{ type: 'poserPion', pion: 0, ligne: 3, colonne: 4 } // pion = index dans etat.main
{ type: 'poserAnimal', carte: 'aigle-1', ligne: 3, colonne: 4 }
{ type: 'finTour' }
```

## Règles implémentées

### Matériel
- Plateau hexagonal de 6 cases de haut sur 8 de large par joueur.
- Sac de pions de 6 couleurs : bleu (rivière), gris (montagne), marron (tronc),
  vert (feuillage), jaune (prairie), rouge (bâtiment).
- 5 tas de 3 pions au centre, 5 cartes animaux visibles.

### Tour de jeu
1. Prendre un tas (il est aussitôt remplacé) et, en même temps, au plus une carte animal visible.
2. Poser les 3 pions sur son plateau ; poser des cubes animaux quand un motif est réalisé.
3. Finir le tour.

### Empilement
| Pion | Se pose sur |
| --- | --- |
| Bleu, jaune | case vide uniquement ; rien ne se pose dessus |
| Gris | vide, 1 ou 2 gris (montagne de 3 maximum) |
| Marron | vide ou 1 marron |
| Vert | vide, 1 ou 2 marron ; rien ne se pose dessus |
| Rouge | vide, 1 gris, 1 marron ou 1 rouge |

Une case qui porte un cube animal ne peut plus rien recevoir (ni pion, ni cube).

### Points
- **Arbres** (pile surmontée d'un vert) : 1 / 3 / 7 pts pour 1 / 2 / 3 pions.
- **Montagnes** : 1 / 3 / 7 pts selon la hauteur, seulement si accolée à une autre montagne.
- **Rivières** : 1→0, 2→2, 3→5, 4→8, 5→11, 6→15, puis +4 par case.
- **Prairies** : 5 pts par groupe d'au moins 2 prairies adjacentes.
- **Bâtiments** : 5 pts par bâtiment de 2 de haut touchant au moins 3 couleurs différentes
  (couleur du sommet des piles voisines).
- **Cartes animaux** : 2 pts par cube posé, +3 pts quand la carte est terminée.

### Cartes animaux
Chaque carte décrit un motif (positions relatives + type de pile exact) et un nombre
de réalisations (2 à 5). Exemples : Aigle (prairie accolée à une montagne de 3, ×2),
Coccinelle (prairie accolée à un arbre d'1 pion, ×5). Liste complète dans `rules.config.js`.

### Fin de partie
Dès qu'un joueur ne peut plus poser de pion, ou qu'il n'y a plus de tas à prendre.
Les scores sont alors calculés pour chaque joueur.

## Points non tranchés (valeurs par défaut, `TODO: à valider`)
1. Composition du sac : 23 bleu, 23 gris, 21 marron, 19 vert, 19 jaune, 15 rouge.
2. Rivières : seule la plus longue compte ; longueur = nombre de cases du groupe connexe.
3. Cartes : 5 visibles, 2 exemplaires de chaque, 4 cartes en cours maximum, 1 par tour (avec le tas).
4. Motifs : les 6 rotations sont acceptées ; seule la case cible doit être libre de cube.
5. Cube animal : posé sur la case la plus à droite du motif.
6. Barème animaux : 2 pts par cube + 3 pts de bonus à la clôture.
7. Fin de partie immédiate (pas de fin de manche pour égaliser le nombre de tours).
8. Les 12 cartes autres que l'Aigle et la Coccinelle sont des créations.
