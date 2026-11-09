// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { App } from '../src/client/App.jsx';
import { PartieLocale } from '../src/client/PartieLocale.jsx';
import { Plateau } from '../src/client/composants/Plateau.jsx';
import { creerPartie } from '../src/moteur/partie.js';

afterEach(cleanup);

const reglages = (n = 2) => ({
  joueurs: Array.from({ length: n }, (_, i) => ({ nom: `J${i + 1}`, bot: false })),
  graine: 42,
});

function cliquerCase(conteneur, cle) {
  fireEvent.click(conteneur.querySelector(`[data-case="${cle}"]`));
}

describe('Plateau', () => {
  it('affiche 48 cases (6 × 8)', () => {
    const e = creerPartie({ nbJoueurs: 1, graine: 1 });
    const { container } = render(<Plateau plateau={e.joueurs[0].plateau} definitions={e.definitions} />);
    expect(container.querySelectorAll('[data-case]')).toHaveLength(48);
  });
});

describe('Accueil', () => {
  it('lance une partie locale à 3 joueurs', () => {
    render(<App />);
    fireEvent.click(screen.getByLabelText('3'));
    fireEvent.change(screen.getByLabelText('Nom du joueur 1'), { target: { value: 'Zoé' } });
    fireEvent.click(screen.getByText('Commencer'));
    expect(screen.getAllByRole('tab')).toHaveLength(3);
    expect(screen.getByRole('tab', { name: /Zoé/ })).toBeTruthy();
  });
});

describe('Partie locale', () => {
  it('un tour complet : prendre un tas, poser 3 pions, finir le tour', () => {
    const { container } = render(<PartieLocale reglages={reglages()} quitter={() => {}} />);
    expect(screen.getByText(/touchez un tas/)).toBeTruthy();

    fireEvent.click(screen.getByLabelText('Tas 1'));
    const fin = screen.getByText('Fin du tour');
    expect(fin.disabled).toBe(true);
    expect(container.querySelectorAll('.case.cliquable')).toHaveLength(48);

    cliquerCase(container, '0,0');
    cliquerCase(container, '2,2');
    cliquerCase(container, '4,4');
    expect(container.querySelectorAll('[data-case="0,0"] polygon').length).toBeGreaterThan(1);
    expect(fin.disabled).toBe(false);

    fireEvent.click(fin);
    expect(screen.getByRole('tab', { selected: true }).textContent).toMatch(/J2/);
  });

  it('prendre une carte animal avec le tas', () => {
    const { container } = render(<PartieLocale reglages={reglages()} quitter={() => {}} />);
    const centre = within(screen.getByLabelText('Centre de la table'));
    const premiereCarte = container.querySelector('.centre-table .carte');
    const nom = premiereCarte.querySelector('.carte-titre').textContent.trim();
    fireEvent.click(premiereCarte);
    expect(premiereCarte.getAttribute('aria-pressed')).toBe('true');
    fireEvent.click(centre.getByLabelText('Tas 2'));
    const cartesJoueur = container.querySelector('.cartes-joueur');
    expect(cartesJoueur.textContent).toContain(nom.replace(/^\S+\s/, ''));
  });

  it('une partie entre ordinateurs se termine et affiche le classement', async () => {
    const r = { joueurs: [{ nom: 'Bot', bot: true }], graine: 3 };
    render(<PartieLocale reglages={r} quitter={() => {}} delaiBot={0} />);
    // les bots jouent avec un délai : on attend la fenêtre de fin
    expect(await screen.findByRole('dialog', {}, { timeout: 20000 })).toBeTruthy();
    expect(screen.getByText(/Score final/)).toBeTruthy();
  }, 30000);
});
