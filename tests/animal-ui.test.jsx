// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render } from '@testing-library/react';
import { PartieLocale } from '../src/client/PartieLocale.jsx';
import { appliquerAction, creerPartie } from '../src/moteur/partie.js';

afterEach(cleanup);

describe('Pose d\'un animal dans l\'interface', () => {
  it('poser un cube ne plante pas et affiche l\'animal', () => {
    let e = creerPartie({ nbJoueurs: 1, graine: 1 });
    e.joueurs[0].cartes.push({ uid: 'aigle-1', id: 'aigle', cubesPoses: 0 });
    e.joueurs[0].plateau.cases[0][0].pile = ['jaune'];
    e.joueurs[0].plateau.cases[0][1].pile = ['gris', 'gris', 'gris'];
    e = appliquerAction(e, 0, { type: 'prendreTas', tas: 0 }).etat;
    const r = { joueurs: [{ nom: 'A', bot: false }], graine: 1 };
    const { container } = render(<PartieLocale reglages={r} quitter={() => {}} etatInitial={e} />);
    const carte = container.querySelector('.carte.possible');
    expect(carte).toBeTruthy();
    fireEvent.click(carte);
    fireEvent.click(container.querySelector('[data-case="0,1"]'));
    expect(container.querySelector('[role="alert"]')).toBeNull();
    expect(container.querySelector('.plateau').textContent).toContain('🦅');
    expect(container.textContent).toContain('6 / 14 pts');
  });
});
