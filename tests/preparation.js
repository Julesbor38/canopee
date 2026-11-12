// Préparation commune des tests : l'ordre des tours est fixe (le joueur 0 commence),
// sauf dans les tests qui activent explicitement l'ordre aléatoire.
import config from '../rules.config.js';

config.ordreAleatoire = false;
