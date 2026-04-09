import type { GuessResult } from "@/types/game";
import { GuessRow } from "./GuessRow";
import { Separator } from "@/components/ui/separator";

interface GuessListProps {
  guesses: GuessResult[];
  attemptCount: number;
}

export function GuessList({ guesses, attemptCount }: GuessListProps) {
  if (guesses.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground text-sm">
          Faites votre premier essai...
        </p>
      </div>
    );
  }

  // Le dernier ajouté (par timestamp) pour l'animation
  const latestTimestamp = Math.max(...guesses.map((g) => g.timestamp));

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between px-1 pb-2">
        <p className="text-xs text-muted-foreground">
          {attemptCount} essai{attemptCount > 1 ? "s" : ""}
        </p>
        <p className="text-xs text-muted-foreground">
          {guesses.length} mot{guesses.length > 1 ? "s" : ""} unique
          {guesses.length > 1 ? "s" : ""}
        </p>
      </div>
      <Separator />
      <div className="divide-y divide-border">
        {guesses.map((guess) => (
          <GuessRow
            key={guess.word}
            guess={guess}
            isNew={guess.timestamp === latestTimestamp}
          />
        ))}
      </div>
    </div>
  );
}
