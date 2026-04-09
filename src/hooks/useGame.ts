import { useReducer, useEffect, useCallback } from "react";
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
      const guesses = [...state.guesses, guess].sort(
        (a, b) => b.score - a.score
      );
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

  return { state, submitGuess };
}
