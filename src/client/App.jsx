import { useState } from 'react';
import { Accueil } from './Accueil.jsx';
import { PartieDistante } from './PartieDistante.jsx';
import { PartieLocale } from './PartieLocale.jsx';

export function App() {
  // un lien « ?salle=CODE » ou une session mémorisée ouvre directement le mode distant
  const [ecran, setEcran] = useState(() => {
    let session = null;
    try {
      session = localStorage.getItem('canopee.session');
    } catch {
      // stockage indisponible
    }
    const lien = new URLSearchParams(globalThis.location?.search ?? '').has('salle');
    return { nom: lien || session ? 'distant' : 'accueil' };
  });
  const accueil = () => setEcran({ nom: 'accueil' });

  if (ecran.nom === 'local') {
    return <PartieLocale reglages={ecran.reglages} quitter={accueil} />;
  }
  if (ecran.nom === 'distant') return <PartieDistante quitter={accueil} />;
  return (
    <Accueil
      lancerLocal={(reglages) => setEcran({ nom: 'local', reglages })}
      allerDistant={() => setEcran({ nom: 'distant' })}
    />
  );
}
