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

  // Le dernier ajouté (par timestamp) — épinglé en haut
  const latestTimestamp = Math.max(...guesses.map((g) => g.timestamp));
  const latestGuess = guesses.find((g) => g.timestamp === latestTimestamp);
  const otherGuesses = guesses.filter((g) => g.timestamp !== latestTimestamp);

  if (!latestGuess) return null;

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

      {/* Dernier essai épinglé en haut */}
      <div className="rounded-lg border border-border bg-muted/40 px-2 py-1 mb-1">
        <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-0.5">
          Dernier essai
        </p>
        <GuessRow guess={latestGuess} isNew />
      </div>

      {otherGuesses.length > 0 && (
        <>
          <Separator />
          <div className="divide-y divide-border">
            {otherGuesses.map((guess) => (
              <GuessRow key={guess.word} guess={guess} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
