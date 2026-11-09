// Lancement du serveur multijoueur : node src/serveur/index.js
import { networkInterfaces } from 'node:os';
import { fileURLToPath } from 'node:url';
import { creerServeur } from './serveur.js';

const port = Number(process.env.PORT ?? 3000);
const dossierStatique = fileURLToPath(new URL('../../dist', import.meta.url));

const serveur = creerServeur({ port, dossierStatique });
const portReel = await serveur.ecouter();

console.log(`Canopée — serveur prêt sur le port ${portReel}`);
for (const liste of Object.values(networkInterfaces())) {
  for (const i of liste ?? []) {
    if (i.family === 'IPv4' && !i.internal) console.log(`  → http://${i.address}:${portReel}`);
  }
}
console.log(`  → http://localhost:${portReel}`);
