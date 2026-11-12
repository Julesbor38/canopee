import { describe, expect, it } from 'vitest';
import { ciblesPossibles, indexCible, occurrences, pileCorrespond } from '../src/moteur/motifs.js';
import { CARTES_ANIMAUX } from '../rules.config.js';
import { creerPlateau } from '../src/moteur/plateau.js';
import { versAxial, versDecale } from '../src/moteur/hex.js';
import { B, G, J, M, R, V, config, plateau } from './aides.js';

const carte = (id) => CARTES_ANIMAUX.find((c) => c.id === id);
const aigle = carte('aigle');
const coccinelle = carte('coccinelle');

describe('Correspondance des piles', () => {
  it('reconnaît chaque type de case', () => {
    expect(pileCorrespond([J], { type: 'prairie' })).toBe(true);
    expect(pileCorrespond([G, G, G], { type: 'montagne', hauteur: 3 })).toBe(true);
    expect(pileCorrespond([G, G], { type: 'montagne', hauteur: 3 })).toBe(false);
    expect(pileCorrespond([V], { type: 'arbre', hauteur: 1 })).toBe(true);
    expect(pileCorrespond([M, V], { type: 'arbre', hauteur: 1 })).toBe(false);
    expect(pileCorrespond([M, M, V], { type: 'arbre', hauteur: 3 })).toBe(true);
    for (const socle of [G, M, V, R]) expect(pileCorrespond([socle, R], { type: 'batiment' })).toBe(true);
    expect(pileCorrespond([R], { type: 'batiment' })).toBe(false);
  });
});

describe('Aigle : prairie accolée à une montagne de taille 3 (2 fois)', () => {
  it('la carte demande 2 réalisations', () => expect(aigle.cubes).toBe(2));

  it('détecte le motif et vise la montagne (case la plus à droite)', () => {
    expect(aigle.motif[indexCible(aigle)].type).toBe('montagne');
    const p = plateau({ '0,0': [J], '0,1': [G, G, G] });
    expect(ciblesPossibles(p, aigle, config)).toEqual([{ ligne: 0, colonne: 1 }]);
  });

  it('fonctionne dans toutes les orientations', () => {
    // montagne au centre, prairie sur chacun des 6 voisins
    const voisinsDe23 = ['2,2', '2,4', '1,2', '1,3', '3,2', '3,3'];
    for (const v of voisinsDe23) {
      const p = plateau({ '2,3': [G, G, G], [v]: [J] });
      expect(ciblesPossibles(p, aigle, config)).toEqual([{ ligne: 2, colonne: 3 }]);
    }
  });

  it("n'est pas réalisé avec une montagne de taille 2 ou une prairie non accolée", () => {
    expect(occurrences(plateau({ '0,0': [J], '0,1': [G, G] }), aigle, config)).toHaveLength(0);
    expect(occurrences(plateau({ '0,0': [J], '0,2': [G, G, G] }), aigle, config)).toHaveLength(0);
  });

  it("la montagne qui porte déjà un cube n'est plus une cible", () => {
    const p = plateau({ '0,0': [J], '0,1': [G, G, G] });
    p.cases[0][1].cube = 'aigle-1';
    expect(ciblesPossibles(p, aigle, config)).toHaveLength(0);
  });
});

describe('Coccinelle : prairie accolée à un arbre de taille 1 (5 fois)', () => {
  it('la carte demande 5 réalisations', () => expect(coccinelle.cubes).toBe(5));

  it("détecte le motif et vise l'arbre", () => {
    const p = plateau({ '2,2': [J], '2,3': [V] });
    expect(ciblesPossibles(p, coccinelle, config)).toEqual([{ ligne: 2, colonne: 3 }]);
  });

  it("un arbre de taille 2 ne convient pas", () => {
    expect(ciblesPossibles(plateau({ '2,2': [J], '2,3': [M, V] }), coccinelle, config)).toHaveLength(0);
  });

  it('une même prairie peut servir à plusieurs arbres', () => {
    const p = plateau({ '2,2': [J], '2,1': [V], '2,3': [V], '1,2': [V] });
    expect(ciblesPossibles(p, coccinelle, config)).toHaveLength(3);
  });
});

describe('Un groupe de cases ne donne qu’un animal', () => {
  const cle = (m) => m.type + (m.hauteur ?? '');

  it('la case cible est d’un type unique dans chaque motif', () => {
    for (const def of CARTES_ANIMAUX) {
      const cible = def.motif[indexCible(def)];
      expect(def.motif.filter((m) => cle(m) === cle(cible)), def.nom).toHaveLength(1);
    }
  });

  it('deux grands arbres ne donnent pas deux chouettes', () => {
    const p = plateau({ '2,2': [M, M, V], '2,3': [M, M, V] });
    expect(ciblesPossibles(p, carte('chouette'), config)).toHaveLength(0);
  });

  it('aucun motif en double entre deux cartes', () => {
    const signature = (def) => def.motif.map(cle).sort().join('+');
    const vues = CARTES_ANIMAUX.map(signature);
    expect(new Set(vues).size).toBe(vues.length);
  });
});

describe('Motifs en miroir', () => {
  const papillon = carte('papillon'); // prairie (cible) + arbre 1 + bâtiment, en triangle
  // triangle inversé : l'arbre et le bâtiment échangent leur place autour de la prairie
  const miroir = () => {
    const p = creerPlateau(config.plateau.lignes, config.plateau.colonnes);
    const a = versAxial(1, 2);
    const poser = (dq, dr, pile) => {
      const { ligne, colonne } = versDecale(a.q + dq, a.r + dr);
      p.cases[ligne][colonne].pile = pile;
    };
    poser(0, 0, [J]);
    poser(0, 1, [V]); // arbre là où la carte dessine le bâtiment
    poser(1, 0, [G, R]); // bâtiment là où la carte dessine l'arbre
    return p;
  };

  it('le motif symétrique est reconnu', () => {
    expect(ciblesPossibles(miroir(), papillon, config)).toEqual([{ ligne: 1, colonne: 2 }]);
  });

  it('sans les symétries, seul le sens de la carte est reconnu', () => {
    const sansMiroir = { ...config, cartes: { ...config.cartes, symetries: false } };
    expect(ciblesPossibles(miroir(), papillon, sansMiroir)).toHaveLength(0);
  });
});

describe('Case cible logique', () => {
  it('les animaux aquatiques se posent sur une rivière', () => {
    for (const id of ['grenouille', 'loutre', 'martin', 'cigogne', 'castor', 'canard', 'tortue', 'saumon']) {
      const def = carte(id);
      expect(def.motif[indexCible(def)].type, id).toBe('riviere');
    }
  });

  it('une cible explicite est prioritaire sur la case la plus à droite', () => {
    const loup = carte('loup');
    const p = plateau({ '2,1': [M, V], '2,2': [G], '2,3': [M, V] });
    expect(ciblesPossibles(p, loup, config)).toEqual([{ ligne: 2, colonne: 2 }]);
  });
});

describe('Toutes les cartes', () => {
  it('30 cartes uniques, chacune réalisable sur le plateau 4×6 et détectée', () => {
    expect(CARTES_ANIMAUX).toHaveLength(30);
    expect(new Set(CARTES_ANIMAUX.map((c) => c.id)).size).toBe(30);
    const piles = {
      prairie: () => [J], riviere: () => ['bleu'], batiment: () => [G, R],
      montagne: (m) => Array(m.hauteur).fill(G), arbre: (m) => [...Array(m.hauteur - 1).fill(M), V],
    };
    for (const def of CARTES_ANIMAUX) {
      // motif posé au centre du plateau de jeu (ligne 2, colonne 2)
      const p = creerPlateau(config.plateau.lignes, config.plateau.colonnes);
      const ancre = versAxial(2, 2);
      for (const m of def.motif) {
        const { ligne, colonne } = versDecale(ancre.q + m.q, ancre.r + m.r);
        p.cases[ligne][colonne].pile = piles[m.type](m);
      }
      expect(ciblesPossibles(p, def, config).length, def.nom).toBeGreaterThan(0);
    }
  });
});
