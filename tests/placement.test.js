import { describe, expect, it } from 'vitest';
import { casesPossibles, poser, verifierPose } from '../src/moteur/plateau.js';
import { voisins } from '../src/moteur/hex.js';
import { creerPartie } from '../src/moteur/partie.js';
import { B, G, J, M, R, V, config, plateau } from './aides.js';

const ok = (p, l, c, couleur) => verifierPose(p, l, c, couleur, config).ok;

describe('Géométrie', () => {
  it('le plateau de jeu fait 5 de haut sur 7 de large', () => {
    const p = creerPartie({ nbJoueurs: 1, graine: 1 }).joueurs[0].plateau;
    expect(p.cases.length).toBe(5);
    expect(p.cases.every((l) => l.length === 7)).toBe(true);
  });

  it('une case intérieure a 6 voisins, un coin en a 2 ou 3', () => {
    expect(voisins(2, 3, 6, 8)).toHaveLength(6);
    expect(voisins(0, 0, 6, 8)).toHaveLength(2);
    expect(voisins(5, 0, 6, 8)).toHaveLength(3);
    expect(voisins(5, 7, 6, 8)).toHaveLength(2);
  });
});

describe("Règles d'empilement", () => {
  it('toutes les couleurs se posent sur une case vide', () => {
    for (const c of [B, G, M, V, J, R]) expect(ok(plateau(), 0, 0, c)).toBe(true);
  });

  it('rivière et prairie : uniquement au sol, rien par-dessus', () => {
    const p = plateau({ '0,0': [B], '0,1': [J] });
    for (const c of [B, G, M, V, J, R]) {
      expect(ok(p, 0, 0, c)).toBe(false);
      expect(ok(p, 0, 1, c)).toBe(false);
    }
  });

  it('montagne : gris sur gris, 3 de haut maximum', () => {
    const p = plateau({ '0,0': [G], '0,1': [G, G], '0,2': [G, G, G] });
    expect(ok(p, 0, 0, G)).toBe(true);
    expect(ok(p, 0, 1, G)).toBe(true);
    expect(ok(p, 0, 2, G)).toBe(false);
  });

  it('arbre : vert sur 0, 1 ou 2 marron ; rien sur le vert', () => {
    const p = plateau({ '0,0': [M], '0,1': [M, M], '0,2': [V], '0,3': [M, V] });
    expect(ok(p, 0, 0, V)).toBe(true);
    expect(ok(p, 0, 1, V)).toBe(true);
    expect(ok(p, 0, 0, M)).toBe(true);
    expect(ok(p, 0, 1, M)).toBe(false); // 3 marron interdit
    for (const c of [B, G, M, V, J]) {
      expect(ok(p, 0, 2, c)).toBe(false);
      expect(ok(p, 0, 3, c)).toBe(false);
    }
    expect(ok(p, 0, 3, R)).toBe(false); // un arbre complet ne porte rien
  });

  it('bâtiment : rouge sur un tronc, un feuillage, une roche ou un bâtiment seul', () => {
    const p = plateau({ '0,0': [G], '0,1': [M], '0,2': [R], '0,3': [G, G], '0,4': [G, R], '0,5': [V] });
    expect(ok(p, 0, 0, R)).toBe(true);
    expect(ok(p, 0, 1, R)).toBe(true);
    expect(ok(p, 0, 2, R)).toBe(true);
    expect(ok(p, 0, 5, R)).toBe(true);
    expect(ok(p, 0, 3, R)).toBe(false); // trop haut
    expect(ok(p, 0, 4, R)).toBe(false); // déjà 2 de haut
    expect(ok(p, 0, 2, G)).toBe(false); // rien d'autre que du rouge sur un rouge
  });

  it('pose hors plateau refusée', () => {
    expect(ok(plateau(), 6, 0, B)).toBe(false);
    expect(ok(plateau(), 0, -1, B)).toBe(false);
  });
});

describe('Cube animal', () => {
  it('une case qui porte un cube animal est bloquée pour toute pose', () => {
    const p = plateau({ '0,0': [G], '0,1': [M] });
    p.cases[0][0].cube = 'aigle-1';
    p.cases[0][1].cube = 'ours-1';
    for (const c of [B, G, M, V, J, R]) {
      expect(ok(p, 0, 0, c)).toBe(false);
      expect(ok(p, 0, 1, c)).toBe(false);
    }
    expect(verifierPose(p, 0, 0, G, config).raison).toMatch(/cube/);
    expect(() => poser(p, 0, 0, G, config)).toThrow();
    expect(casesPossibles(p, G, config)).not.toContainEqual({ ligne: 0, colonne: 0 });
  });

  it("une montagne qui porte un cube ne peut pas être agrandie", () => {
    const p = plateau({ '2,2': [G, G] });
    expect(ok(p, 2, 2, G)).toBe(true);
    p.cases[2][2].cube = 'chamois-1';
    expect(ok(p, 2, 2, G)).toBe(false);
  });
});
