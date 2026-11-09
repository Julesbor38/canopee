// Démonstration du moteur : partie automatique entre bots, affichage texte.
// Usage : npm run demo -- [nbJoueurs] [graine]
import { creerPartie, jouerPartieAuto } from '../src/moteur/index.js';

const nb = Number(process.argv[2] ?? 2);
const graine = process.argv[3] ?? 2026;
const LETTRES = { bleu: 'B', gris: 'G', marron: 'M', vert: 'V', jaune: 'J', rouge: 'R' };

const final = jouerPartieAuto(creerPartie({ nbJoueurs: nb, graine }));

final.joueurs.forEach((j, i) => {
  console.log(`\n=== ${j.nom} ===`);
  j.plateau.cases.forEach((ligne, l) => {
    const cases = ligne.map((k) => {
      const t = k.pile.map((c) => LETTRES[c]).join('') || '.';
      return (t + (k.cube ? '*' : '')).padEnd(4);
    });
    console.log((l % 2 ? '  ' : '') + cases.join(''));
  });
  console.log('Cartes :', j.cartes.map((c) => `${final.definitions[c.id].nom} ${c.cubesPoses}/${final.definitions[c.id].cubes}`).join(', ') || 'aucune');
  console.log('Score :', final.finDePartie.scores[i]);
});
console.log(`\n${final.finDePartie.raison} (tour ${final.tour})`);
