/**
 * Calcule l'index du mot du jour via SHA-256 de la date UTC.
 * Pioche parmi la liste de mots cibles (noms, adjectifs, infinitifs…)
 * pour garantir un mot « devinable » avec des voisins sémantiques cohérents.
 *
 * toISOString() renvoie TOUJOURS la date UTC — tous les joueurs
 * du monde calculent le même hash au même instant → même mot.
 * Le mot change à minuit UTC.
 */
export async function getDailyWordIndex(targets: number[]): Promise<number> {
  const today = new Date().toISOString().slice(0, 10); // "2026-04-09" UTC
  const encoded = new TextEncoder().encode(today);
  const hashBuffer = await crypto.subtle.digest("SHA-256", encoded);
  const hashArray = new Uint32Array(hashBuffer);
  return targets[hashArray[0] % targets.length];
}

export function getTodayUTC(): string {
  return new Date().toISOString().slice(0, 10);
}
