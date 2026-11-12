import { useState } from 'react';
import { Avatar } from './composants/Avatar.jsx';
import { Logo, Paysage } from './composants/Paysage.jsx';

const NOMS_PAR_DEFAUT = ['Alice', 'Bastien', 'Chloé', 'David'];

/** Écran d'accueil : réglage d'une partie locale. */
export function Accueil({ lancerLocal, allerDistant }) {
  const [nb, setNb] = useState(2);
  const [joueurs, setJoueurs] = useState(NOMS_PAR_DEFAUT.map((nom) => ({ nom, bot: false })));
  const [graine, setGraine] = useState('');

  function modifier(i, champ, valeur) {
    setJoueurs((js) => js.map((j, k) => (k === i ? { ...j, [champ]: valeur } : j)));
  }

  function lancer(e) {
    e.preventDefault();
    lancerLocal({
      joueurs: joueurs.slice(0, nb).map((j, i) => ({ nom: j.nom.trim() || `Joueur ${i + 1}`, bot: j.bot })),
      graine: graine.trim() || Date.now(),
    });
  }

  return (
    <main className="accueil">
      <Paysage />
      <header className="titre-accueil">
        <Logo taille={84} />
        <h1>Canopée</h1>
        <p className="sous-titre">Façonnez rivières, forêts et montagnes, et accueillez les animaux.</p>
      </header>

      <form className="fenetre" onSubmit={lancer}>
        <h2>Partie sur cet écran</h2>
        <fieldset className="choix-nb">
          <legend>Nombre de joueurs</legend>
          {[1, 2, 3, 4].map((n) => (
            <label key={n} className={nb === n ? 'actif' : ''}>
              <input type="radio" name="nb" value={n} checked={nb === n} onChange={() => setNb(n)} />
              {n}
            </label>
          ))}
        </fieldset>

        {joueurs.slice(0, nb).map((j, i) => (
          <div key={i} className="ligne-joueur">
            <Avatar nom={j.nom} index={i} taille={34} />
            <input
              aria-label={`Nom du joueur ${i + 1}`}
              value={j.nom}
              onChange={(e) => modifier(i, 'nom', e.target.value)}
              maxLength={20}
            />
            <label className="interrupteur">
              <input type="checkbox" checked={j.bot} onChange={(e) => modifier(i, 'bot', e.target.checked)} />
              <span className="interrupteur-piste" aria-hidden="true" />
              Ordinateur
            </label>
          </div>
        ))}

        <label className="ligne-graine">
          Graine (facultatif)
          <input value={graine} onChange={(e) => setGraine(e.target.value)} placeholder="aléatoire" />
        </label>

        <button type="submit" className="bouton principal">
          Commencer
        </button>
      </form>

      {allerDistant && (
        <button type="button" className="bouton bouton-verre" onClick={allerDistant}>
          🌍 Jouer à distance
        </button>
      )}
    </main>
  );
}
