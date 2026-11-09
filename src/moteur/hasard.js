// Générateur pseudo-aléatoire déterministe (mulberry32).
// L'état est un simple entier, stocké dans l'état de partie pour qu'une
// partie reste sérialisable et reproductible à partir de sa graine.

/** Convertit une graine (nombre ou texte) en entier 32 bits. */
export function normaliserGraine(graine) {
  if (typeof graine === 'number') return graine >>> 0;
  let h = 2166136261;
  for (const ch of String(graine)) {
    h ^= ch.charCodeAt(0);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Tire un nombre dans [0, 1) et renvoie { valeur, etat } (nouvel état). */
export function tirer(etat) {
  const suivant = (etat + 0x6d2b79f5) >>> 0;
  let t = suivant;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return { valeur: ((t ^ (t >>> 14)) >>> 0) / 4294967296, etat: suivant };
}

/** Mélange (Fisher-Yates) un tableau en place ; renvoie le nouvel état du générateur. */
export function melanger(tableau, etat) {
  let e = etat;
  for (let i = tableau.length - 1; i > 0; i--) {
    const t = tirer(e);
    e = t.etat;
    const j = Math.floor(t.valeur * (i + 1));
    [tableau[i], tableau[j]] = [tableau[j], tableau[i]];
  }
  return e;
}
