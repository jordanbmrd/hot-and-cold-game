import type { GuessResult } from "@/types/game";
import { ScoreBar } from "./ScoreBar";
import { TemperatureBadge } from "./TemperatureBadge";
import { cn } from "@/lib/utils";

interface GuessRowProps {
  guess: GuessResult;
  isNew?: boolean;
}

export function GuessRow({ guess, isNew }: GuessRowProps) {
  return (
    <div
      className={cn(
        "grid grid-cols-[100px_1fr_auto] sm:grid-cols-[140px_1fr_auto] gap-3 items-center py-2.5 px-1",
        isNew && "animate-slide-in",
        guess.isWin && "bg-emerald-50 dark:bg-emerald-950/20 rounded-lg px-3 -mx-2"
      )}
    >
      <span
        className={cn(
          "font-medium text-sm truncate",
          guess.isWin && "text-emerald-700 dark:text-emerald-400"
        )}
        title={guess.word}
      >
        {guess.word}
      </span>
      <ScoreBar score={guess.score} />
      <TemperatureBadge score={guess.score} rank={guess.rank} />
    </div>
  );
}
