export const DIMS = 100;

/**
 * Produit scalaire entre deux vecteurs L2-normalisés = similarité cosinus.
 */
export function dotProduct(
  vectors: Float32Array,
  idxA: number,
  idxB: number
): number {
  const offsetA = idxA * DIMS;
  const offsetB = idxB * DIMS;
  let sum = 0;
  for (let d = 0; d < DIMS; d++) {
    sum += vectors[offsetA + d] * vectors[offsetB + d];
  }
  return sum;
}

/**
 * Calcule les 1000 voisins les plus proches du mot cible.
 * Retourne les indices triés par similarité décroissante
 * et un Float32Array des similarités correspondantes.
 */
export function computeTop1000(
  vectors: Float32Array,
  targetIdx: number,
  vocabSize: number
): { indices: number[]; similarities: Float32Array } {
  const targetOffset = targetIdx * DIMS;
  const scores = new Float32Array(vocabSize);

  for (let i = 0; i < vocabSize; i++) {
    const offset = i * DIMS;
    let sum = 0;
    for (let d = 0; d < DIMS; d++) {
      sum += vectors[targetOffset + d] * vectors[offset + d];
    }
    scores[i] = sum;
  }

  // Tri par similarité décroissante
  const allIndices = Array.from({ length: vocabSize }, (_, i) => i);
  allIndices.sort((a, b) => scores[b] - scores[a]);

  // Le premier est le mot lui-même (score ≈ 1.0), on le garde
  const top = allIndices.slice(0, 1001);
  const topSims = new Float32Array(1001);
  for (let i = 0; i < 1001; i++) {
    topSims[i] = scores[top[i]];
  }

  return { indices: top, similarities: topSims };
}

/**
 * Supprime les accents d'un mot pour le matching approximatif.
 */
export function stripAccents(word: string): string {
  return word.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}
