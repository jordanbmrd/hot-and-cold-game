import { useState } from "react";
import { useModel } from "@/hooks/useModel";
import { useGame } from "@/hooks/useGame";
import { Header } from "@/components/Header";
import { GuessInput } from "@/components/GuessInput";
import { GuessList } from "@/components/GuessList";
import { WinDialog } from "@/components/WinDialog";
import { Loader2, Lightbulb, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

function LoadingScreen() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      <p className="text-sm text-muted-foreground">
        Chargement du vocabulaire...
      </p>
    </div>
  );
}

function ErrorScreen({ message }: { message: string }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-4">
      <p className="text-destructive text-center">{message}</p>
      <p className="text-sm text-muted-foreground text-center">
        Vérifiez que les fichiers <code>words.json</code> et{" "}
        <code>vectors.bin</code> sont présents dans <code>public/data/</code>.
      </p>
    </div>
  );
}

export default function App() {
  const { model, loading, error } = useModel();
  const { state, submitGuess, getHint } = useGame(model);

  const [hintWord, setHintWord] = useState<string | null>(null);
  const [revealOpen, setRevealOpen] = useState(false);
  const [isRevealed, setIsRevealed] = useState(false);

  if (loading) return <LoadingScreen />;
  if (error) return <ErrorScreen message={error} />;

  const secretWord = model ? model.words[model.dailyWordIndex] : "";

  function handleHint() {
    const hint = getHint();
    setHintWord(hint);
  }

  function handleRevealConfirm() {
    setIsRevealed(true);
    setRevealOpen(false);
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main className="max-w-lg mx-auto px-4 py-6 space-y-4">
        <GuessInput onGuess={submitGuess} disabled={state.isWon} />

        {/* Actions : indice + voir le mot */}
        {!state.isWon && (
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-xs"
              onClick={handleHint}
            >
              <Lightbulb className="h-3.5 w-3.5" />
              Indice
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 text-xs text-muted-foreground"
              onClick={() => setRevealOpen(true)}
            >
              <Eye className="h-3.5 w-3.5" />
              Voir le mot
            </Button>
          </div>
        )}

        {/* Dernier indice affiché */}
        {hintWord && (
          <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800 px-3 py-2 text-sm animate-slide-in">
            <Lightbulb className="h-4 w-4 text-amber-500 shrink-0" />
            <span>
              Indice :{" "}
              <strong className="text-amber-700 dark:text-amber-300">
                {hintWord}
              </strong>
            </span>
            <button
              className="ml-auto text-muted-foreground hover:text-foreground"
              onClick={() => setHintWord(null)}
              aria-label="Fermer l'indice"
            >
              <EyeOff className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {/* Mot révélé (abandon) */}
        {isRevealed && !state.isWon && (
          <div className="rounded-lg border border-border bg-muted/40 px-4 py-3 text-center animate-slide-in">
            <p className="text-xs text-muted-foreground mb-1">Le mot du jour était</p>
            <p className="text-2xl font-bold text-foreground">{secretWord}</p>
          </div>
        )}

        <GuessList guesses={state.guesses} attemptCount={state.attemptCount} />
      </main>

      {/* Dialogue de confirmation avant révélation */}
      <Dialog open={revealOpen} onOpenChange={setRevealOpen}>
        <DialogContent className="w-[90vw] max-w-sm text-center">
          <DialogHeader className="items-center">
            <DialogTitle>Voir le mot du jour ?</DialogTitle>
            <DialogDescription>
              Cela mettra fin à votre partie. Êtes-vous sûr ?
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 justify-center pt-2">
            <Button variant="outline" onClick={() => setRevealOpen(false)}>
              Annuler
            </Button>
            <Button variant="destructive" onClick={handleRevealConfirm}>
              Oui, révéler
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <WinDialog
        open={state.isWon}
        guesses={state.guesses}
        attemptCount={state.attemptCount}
        secretWord={secretWord}
      />
    </div>
  );
}
