import { describe, expect, it } from 'vitest';
import { ciblesPossibles, indexCible, occurrences, pileCorrespond } from '../src/moteur/motifs.js';
import { CARTES_ANIMAUX } from '../rules.config.js';
import { G, J, M, R, V, config, plateau } from './aides.js';

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
    expect(pileCorrespond([G, R], { type: 'batiment' })).toBe(true);
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
