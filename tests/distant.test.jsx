// @vitest-environment jsdom
// Interface distante : deux clients React reliés à un vrai serveur Socket.IO.
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, waitFor, within } from '@testing-library/react';
import { PartieDistante } from '../src/client/PartieDistante.jsx';
import { creerServeur } from '../src/serveur/serveur.js';

let serveur;
let url;

beforeAll(async () => {
  serveur = creerServeur({ port: 0, hote: '127.0.0.1', delaiBot: 0 });
  url = `http://127.0.0.1:${await serveur.ecouter()}`;
});
afterEach(cleanup);
afterAll(() => serveur.fermer());

function appareil() {
  const { container } = render(<PartieDistante url={url} memoriser={false} quitter={() => {}} />);
  return within(container);
}

const attendre = (fn) => waitFor(fn, { timeout: 5000 });

describe('Interface distante', () => {
  it('créer une salle, la rejoindre par code, lancer et jouer', async () => {
    const alice = appareil();
    const bastien = appareil();

    fireEvent.change(alice.getByLabelText('Votre nom'), { target: { value: 'Alice' } });
    await attendre(() => expect(alice.getByText('Créer une salle').disabled).toBe(false));
    fireEvent.click(alice.getByText('Créer une salle'));
    const code = (await alice.findByLabelText('Code à partager', {}, { timeout: 5000 })).textContent;
    expect(code).toMatch(/^[A-Z]{4}$/);

    fireEvent.change(bastien.getByLabelText('Votre nom'), { target: { value: 'Bastien' } });
    fireEvent.change(bastien.getByLabelText('Code de la salle'), { target: { value: code.toLowerCase() } });
    await attendre(() => expect(bastien.getByText('Rejoindre').disabled).toBe(false));
    fireEvent.click(bastien.getByText('Rejoindre'));

    // les deux voient la salle d'attente avec 2 joueurs ; seul l'hôte peut lancer
    await attendre(() => expect(alice.getByText(/Lancer la partie \(2 joueurs\)/)).toBeTruthy());
    await attendre(() => expect(bastien.getByText(/En attente du lancement/)).toBeTruthy());
    expect(bastien.queryByText(/Lancer la partie/)).toBeNull();

    fireEvent.click(alice.getByText(/Lancer la partie/));
    await attendre(() => expect(alice.getByText(/touchez un tas/)).toBeTruthy());
    await attendre(() => expect(bastien.getByText(/Au tour de Alice/)).toBeTruthy());
    // Bastien ne peut pas prendre de tas
    expect(bastien.getByLabelText('Tas 1').disabled).toBe(true);

    // Alice joue son tour
    fireEvent.click(alice.getByLabelText('Tas 1'));
    await attendre(() => expect(alice.getByText('Fin du tour')).toBeTruthy());
    for (const cle of ['0,0', '2,2', '4,4']) {
      const avant = alice.getAllByLabelText(/^Pion /).length;
      fireEvent.click(alice.getByRole('grid').querySelector(`[data-case="${cle}"]`));
      await attendre(() => expect(alice.queryAllByLabelText(/^Pion /).length).toBe(avant - 1));
    }
    fireEvent.click(alice.getByText('Fin du tour'));

    // c'est maintenant à Bastien, sur son appareil
    await attendre(() => expect(bastien.getByText(/touchez un tas/)).toBeTruthy());
    await attendre(() => expect(alice.getByText(/Au tour de Bastien/)).toBeTruthy());
    // le plateau d'Alice est visible depuis l'appareil de Bastien
    fireEvent.click(bastien.getByRole('tab', { name: /Alice/ }));
    expect(bastien.getByRole('grid').querySelectorAll('[data-case="0,0"] polygon').length).toBeGreaterThan(1);
  }, 20000);

  it('affiche une erreur pour un code inconnu', async () => {
    const zoe = appareil();
    fireEvent.change(zoe.getByLabelText('Votre nom'), { target: { value: 'Zoé' } });
    fireEvent.change(zoe.getByLabelText('Code de la salle'), { target: { value: 'ZZZZ' } });
    await attendre(() => expect(zoe.getByText('Rejoindre').disabled).toBe(false));
    fireEvent.click(zoe.getByText('Rejoindre'));
    expect((await zoe.findByRole('alert', {}, { timeout: 5000 })).textContent).toMatch(/introuvable/);
  });
});
