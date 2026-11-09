import { useState } from 'react';
import { Accueil } from './Accueil.jsx';
import { PartieLocale } from './PartieLocale.jsx';

export function App() {
  const [ecran, setEcran] = useState({ nom: 'accueil' });

  if (ecran.nom === 'local') {
    return <PartieLocale reglages={ecran.reglages} quitter={() => setEcran({ nom: 'accueil' })} />;
  }
  return <Accueil lancerLocal={(reglages) => setEcran({ nom: 'local', reglages })} />;
}
