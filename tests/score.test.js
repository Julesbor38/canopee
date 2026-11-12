import { describe, expect, it } from 'vitest';
import {
  baremeCarte, difficulteMotif, gainsCarte, pointsRiviere, scoreAnimaux, scoreArbres, scoreBatiments, scoreJoueur, scoreMontagnes,
  scorePrairies, scoreRivieres,
} from '../src/moteur/score.js';
import { CARTES_ANIMAUX } from '../rules.config.js';
import { B, G, J, M, R, V, config, plateau } from './aides.js';

// Rappel du voisinage (lignes impaires décalées à droite) :
//  (0,c) touche (0,c±1), (1,c-1), (1,c)
//  (1,c) touche (1,c±1), (0,c), (0,c+1), (2,c), (2,c+1)

describe('Arbres', () => {
  it('compte chaque arbre selon sa pile : 1, 3 et 7 points', () => {
    const p = plateau({
      '0,0': [V], // vert seul : 1
      '0,2': [M, V], // vert sur marron : 3
      '0,4': [M, M, V], // 2 marron + vert : 7
      '0,6': [M], // tronc sans feuillage : 0
    });
    expect(scoreArbres(p, config)).toBe(11);
  });

  it('des arbres adjacents sont comptés individuellement', () => {
    const p = plateau({ '0,0': [M, M, V], '0,1': [M, M, V] });
    expect(scoreArbres(p, config)).toBe(14);
  });
});

describe('Montagnes', () => {
  it("une montagne isolée ne rapporte rien, quelle que soit sa hauteur", () => {
    expect(scoreMontagnes(plateau({ '3,3': [G, G, G] }), config)).toBe(0);
  });

  it('chaque montagne accolée rapporte selon sa hauteur : 1, 3, 7', () => {
    const p = plateau({
      '0,0': [G], '0,1': [G, G], // 1 + 3
      '2,4': [G, G, G], '2,5': [G], // 7 + 1
      '5,0': [G, G], // isolée : 0
    });
    expect(scoreMontagnes(p, config)).toBe(12);
  });
});

describe('Rivières', () => {
  const attendus = { 1: 0, 2: 2, 3: 5, 4: 8, 5: 11, 6: 15, 7: 19, 8: 23 };
  for (const [n, pts] of Object.entries(attendus)) {
    it(`une rivière de ${n} case(s) rapporte ${pts} points`, () => {
      const cases = {};
      for (let c = 0; c < Number(n); c++) cases[`0,${c}`] = [B];
      expect(scoreRivieres(plateau(cases), config)).toBe(pts);
    });
  }

  it('au-delà de 6 cases : +4 points par case supplémentaire', () => {
    expect(pointsRiviere(6, config)).toBe(15);
    for (let n = 7; n <= 12; n++) {
      expect(pointsRiviere(n, config) - pointsRiviere(n - 1, config)).toBe(4);
    }
    expect(pointsRiviere(10, config)).toBe(31);
  });

  it('une rivière peut serpenter sur plusieurs lignes', () => {
    const p = plateau({ '0,0': [B], '1,0': [B], '2,0': [B], '2,1': [B] });
    expect(scoreRivieres(p, config)).toBe(8);
  });

  it('par défaut seule la plus longue rivière compte (configurable)', () => {
    const p = plateau({ '0,0': [B], '0,1': [B], '0,2': [B], '3,5': [B], '3,6': [B] });
    expect(scoreRivieres(p, config)).toBe(5);
    const toutes = structuredClone(config);
    toutes.scoring.rivieres.seulementLaPlusLongue = false;
    expect(scoreRivieres(p, toutes)).toBe(7);
  });
});

describe('Prairies', () => {
  it("5 points par groupe d'au moins 2 prairies adjacentes", () => {
    const p = plateau({
      '0,0': [J], '0,1': [J], // groupe de 2 : 5
      '3,3': [J], '3,4': [J], '4,3': [J], // groupe de 3 : 5
      '5,7': [J], // seule : 0
    });
    expect(scorePrairies(p, config)).toBe(10);
  });
});

describe('Bâtiments', () => {
  it('5 points pour un bâtiment de 2 de haut entouré de 3 couleurs différentes', () => {
    const p = plateau({ '1,1': [G, R], '1,0': [J], '1,2': [B], '0,1': [V] });
    expect(scoreBatiments(p, config)).toBe(5);
  });

  it('0 point avec seulement 2 couleurs voisines', () => {
    const p = plateau({ '1,1': [M, R], '1,0': [J], '1,2': [J], '0,1': [B] });
    expect(scoreBatiments(p, config)).toBe(0);
  });

  it("un bâtiment d'1 de haut ne compte pas", () => {
    const p = plateau({ '1,1': [R], '1,0': [J], '1,2': [B], '0,1': [V] });
    expect(scoreBatiments(p, config)).toBe(0);
  });

  it('le bâtiment compte quel que soit son socle (roche, tronc, feuillage, bâtiment)', () => {
    const voisins = { '1,0': [J], '1,2': [B], '0,1': [G] };
    for (const socle of [G, M, V, R]) {
      expect(scoreBatiments(plateau({ ...voisins, '1,1': [socle, R] }), config)).toBe(5);
    }
  });

  it('la couleur prise en compte est celle du sommet des piles voisines', () => {
    // [M, V] compte comme vert, [G, R] comme rouge
    const p = plateau({ '1,1': [R, R], '1,0': [M, V], '1,2': [G, R], '0,1': [G] });
    expect(scoreBatiments(p, config)).toBe(5);
  });
});

describe('Cartes animaux', () => {
  const defs = Object.fromEntries(CARTES_ANIMAUX.map((c) => [c.id, c]));

  it('la carte rapporte la valeur de la dernière case couverte de sa piste', () => {
    expect(baremeCarte(defs.aigle, config)).toEqual([6, 14]);
    expect(baremeCarte(defs.coccinelle, config)).toEqual([2, 5, 9, 14, 20]);
    expect(gainsCarte(defs.coccinelle, config)).toEqual([2, 3, 4, 5, 6]);
    expect(scoreAnimaux([{ id: 'aigle', cubesPoses: 0 }], defs, config)).toBe(0);
    expect(scoreAnimaux([{ id: 'aigle', cubesPoses: 2 }], defs, config)).toBe(14);
    expect(scoreAnimaux([{ id: 'coccinelle', cubesPoses: 3 }], defs, config)).toBe(9);
  });

  it('un motif plus difficile rapporte davantage par animal', () => {
    const parAnimal = (id) => baremeCarte(defs[id], config)[0];
    // prairie + arbre d'1 pion  <  prairie + montagne de 3  <  forêt étagée (arbres de 3, 2 et 1)
    expect(parAnimal('coccinelle')).toBeLessThan(parAnimal('aigle'));
    expect(parAnimal('aigle')).toBeLessThan(parAnimal('chouette'));
    expect(difficulteMotif(defs.chouette, config)).toBe(8.5);
    // une forme à 3 cases coûte plus que la somme de ses cases
    expect(difficulteMotif(defs.martin, config)).toBe(3.5);
  });

  it('chaque animal rapporte strictement plus que le précédent', () => {
    for (const def of CARTES_ANIMAUX) {
      const g = gainsCarte(def, config);
      expect(g).toHaveLength(def.cubes);
      for (let i = 1; i < g.length; i++) expect(g[i]).toBeGreaterThan(g[i - 1]);
    }
  });

  it('une piste fixée à la main sur la carte est prioritaire', () => {
    expect(baremeCarte({ ...defs.aigle, points: [1, 50] }, config)).toEqual([1, 50]);
  });
});

describe('Score total', () => {
  it('additionne toutes les catégories', () => {
    const defs = Object.fromEntries(CARTES_ANIMAUX.map((c) => [c.id, c]));
    const joueur = {
      plateau: plateau({ '0,0': [V], '5,0': [B], '5,1': [B], '3,3': [J], '3,4': [J] }),
      cartes: [{ id: 'aigle', cubesPoses: 1 }],
    };
    expect(scoreJoueur(joueur, defs, config)).toEqual({
      arbres: 1, montagnes: 0, rivieres: 2, prairies: 5, batiments: 0, animaux: 6, total: 14,
    });
  });
});
