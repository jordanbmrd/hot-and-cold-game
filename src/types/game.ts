export interface GuessResult {
  word: string;
  score: number; // 0-100
  rank: number | null; // 1-1000 if in top 1000, else null
  isWin: boolean;
  timestamp: number;
}

export interface GameState {
  date: string; // "YYYY-MM-DD" UTC
  guesses: GuessResult[];
  isWon: boolean;
  attemptCount: number;
}

export interface GameModel {
  words: string[];
  wordIndex: Map<string, number>;
  strippedIndex: Map<string, number>; // accent-stripped → original index
  vectors: Float32Array;
  dims: number;
  dailyWordIndex: number;
  top1000Indices: number[];
  top1000Sims: Float32Array;
  ranks: Uint32Array; // index mot -> rang global par similarité (0 = cible)
}
