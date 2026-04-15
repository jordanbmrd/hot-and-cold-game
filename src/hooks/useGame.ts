import { useReducer, useEffect, useCallback, useState } from "react";
import type { GameState, GuessResult, GameModel } from "@/types/game";
import { saveState, loadState } from "@/lib/storage";
import { getTodayUTC } from "@/lib/dailyWord";
import { computeScore } from "@/lib/scoring";
import { stripAccents } from "@/lib/similarity";

type GameAction =
  | { type: "ADD_GUESS"; payload: GuessResult }
  | { type: "HYDRATE"; payload: GameState };

function initialState(): GameState {
  return {
    date: getTodayUTC(),
    guesses: [],
    isWon: false,
    attemptCount: 0,
  };
}

function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case "HYDRATE":
      return action.payload;

    case "ADD_GUESS": {
      const guess = action.payload;
      if (state.guesses.some((g) => g.word === guess.word)) return state;
      const guesses = [...state.guesses, guess].sort((a, b) => {
        const rankA = a.rank ?? Infinity;
        const rankB = b.rank ?? Infinity;
        return rankA - rankB;
      });
      return {
        ...state,
        guesses,
        isWon: state.isWon || guess.isWin,
        attemptCount: state.attemptCount + 1,
      };
    }

    default:
      return state;
  }
}

export type SubmitResult =
  | { ok: true }
  | { ok: false; error: "unknown_word" | "already_guessed" | "no_model" };

export function useGame(model: GameModel | null) {
  const [state, dispatch] = useReducer(gameReducer, undefined, initialState);
  // Tracks how far we've walked into top-1000 for hints (starts at rank 1000, goes to rank 1)
  // Persisted in localStorage so progress survives page refreshes within the same day
  const today = getTodayUTC();
  const [hintRank, setHintRank] = useState<number>(() => {
    try {
      const raw = localStorage.getItem("chaud-froid-hint-rank");
      if (!raw) return 1000;
      const parsed = JSON.parse(raw) as { date: string; rank: number };
      return parsed.date === today ? parsed.rank : 1000;
    } catch {
      return 1000;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(
        "chaud-froid-hint-rank",
        JSON.stringify({ date: today, rank: hintRank })
      );
    } catch {
      // ignore storage errors
    }
  }, [hintRank, today]);

  // Hydratation depuis localStorage au montage
  useEffect(() => {
    const saved = loadState();
    if (saved && saved.date === getTodayUTC()) {
      dispatch({ type: "HYDRATE", payload: saved });
    }
  }, []);

  // Persistance à chaque changement d'état
  useEffect(() => {
    saveState(state);
  }, [state]);

  const submitGuess = useCallback(
    (rawWord: string): SubmitResult => {
      if (!model) return { ok: false, error: "no_model" };

      const word = rawWord.trim().toLowerCase();
      if (!word) return { ok: false, error: "unknown_word" };

      // Vérifier si déjà deviné
      if (state.guesses.some((g) => g.word === word)) {
        return { ok: false, error: "already_guessed" };
      }

      // Chercher le mot : d'abord exact, puis sans accents
      let guessIdx = model.wordIndex.get(word);
      let resolvedWord = word;

      if (guessIdx === undefined) {
        const stripped = stripAccents(word);
        guessIdx = model.strippedIndex.get(stripped);
        if (guessIdx !== undefined) {
          resolvedWord = model.words[guessIdx];
          // Vérifier le doublon avec le mot résolu
          if (state.guesses.some((g) => g.word === resolvedWord)) {
            return { ok: false, error: "already_guessed" };
          }
        }
      }

      if (guessIdx === undefined) {
        return { ok: false, error: "unknown_word" };
      }

      const result = computeScore(
        guessIdx,
        model.dailyWordIndex,
        model.top1000Sims,
        model.vectors,
        model.ranks
      );

      dispatch({
        type: "ADD_GUESS",
        payload: {
          word: resolvedWord,
          score: result.score,
          rank: result.rank,
          isWin: result.isWin,
          timestamp: Date.now(),
        },
      });

      return { ok: true };
    },
    [model, state.guesses]
  );

  /**
   * Returns the next hint word from the top-1000 list (progressively closer
   * to the target with each call). Returns null when all hints are exhausted.
   */
  const getHint = useCallback((): string | null => {
    if (!model || hintRank < 1) return null;
    const guessedWords = new Set(state.guesses.map((g) => g.word));

    for (let r = hintRank; r >= 1; r--) {
      const idx = model.top1000Indices[r];
      if (idx === undefined) continue;
      const word = model.words[idx];
      if (!guessedWords.has(word)) {
        setHintRank(r - 1);
        return word;
      }
    }
    return null;
  }, [model, state.guesses, hintRank]);

  return { state, submitGuess, getHint };
}
