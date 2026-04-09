import { dotProduct } from "./similarity";

export interface ScoreResult {
  score: number; // 0-100
  rank: number | null; // 1-1000 if in top 1000, null otherwise
  isWin: boolean;
}

/**
 * Calcule le score d'un essai.
 *
 * - Mot exact → score 100
 * - Top 1000 : rank 1 = 99, rank 1000 = 30 (interpolation linéaire)
 * - Hors top 1000 : 0–29 basé sur la similarité relative
 */
export function computeScore(
  guessIdx: number,
  targetIdx: number,
  top1000Sims: Float32Array,
  vectors: Float32Array,
  ranks: Uint32Array
): ScoreResult {
  const rank = ranks[guessIdx];

  if (rank === 0) {
    return { score: 100, rank: 0, isWin: true };
  }

  if (rank > 0 && rank < 1001) {
    // rank 1 → 99, rank 1000 → 30
    const score = Math.round(99 - ((rank - 1) * 69) / 999);
    return { score, rank, isWin: false };
  }

  // Hors top 1000
  const similarity = dotProduct(vectors, guessIdx, targetIdx);
  const boundaryIdx = Math.min(1000, top1000Sims.length - 1);
  const boundarySim = top1000Sims[boundaryIdx];

  if (boundarySim <= 0) {
    return { score: 0, rank: null, isWin: false };
  }

  const ratio = Math.max(0, similarity / boundarySim);
  const score = Math.min(29, Math.round(ratio * 29));

  return { score, rank, isWin: false };
}

/**
 * Retourne la couleur Tailwind pour le score donné.
 */
export function scoreToColor(score: number): string {
  if (score === 100) return "bg-emerald-500";
  if (score >= 71) return "bg-red-500";
  if (score >= 51) return "bg-orange-500";
  if (score >= 31) return "bg-amber-400";
  if (score >= 16) return "bg-sky-400";
  return "bg-blue-500";
}

/**
 * Retourne le label de température pour le score.
 */
export function scoreToLabel(score: number): string {
  if (score === 100) return "Trouvé !";
  if (score >= 71) return "Brûlant";
  if (score >= 51) return "Chaud";
  if (score >= 31) return "Tiède";
  if (score >= 16) return "Froid";
  return "Glacial";
}

/**
 * Retourne les classes Tailwind pour le badge de température.
 */
export function scoreToBadgeClasses(score: number): string {
  if (score === 100) return "bg-emerald-100 text-emerald-800 border-emerald-300";
  if (score >= 71) return "bg-red-100 text-red-800 border-red-200";
  if (score >= 51) return "bg-orange-100 text-orange-800 border-orange-200";
  if (score >= 31) return "bg-amber-100 text-amber-800 border-amber-200";
  if (score >= 16) return "bg-sky-100 text-sky-800 border-sky-200";
  return "bg-blue-100 text-blue-800 border-blue-200";
}
