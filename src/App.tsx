import { useModel } from "@/hooks/useModel";
import { useGame } from "@/hooks/useGame";
import { Header } from "@/components/Header";
import { GuessInput } from "@/components/GuessInput";
import { GuessList } from "@/components/GuessList";
import { WinDialog } from "@/components/WinDialog";
import { Loader2 } from "lucide-react";

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
  const { state, submitGuess } = useGame(model);

  if (loading) return <LoadingScreen />;
  if (error) return <ErrorScreen message={error} />;

  const secretWord = model ? model.words[model.dailyWordIndex] : "";

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main className="max-w-lg mx-auto px-4 py-6 space-y-6">
        <GuessInput onGuess={submitGuess} disabled={state.isWon} />
        <GuessList guesses={state.guesses} attemptCount={state.attemptCount} />
      </main>
      <WinDialog
        open={state.isWon}
        guesses={state.guesses}
        attemptCount={state.attemptCount}
        secretWord={secretWord}
      />
    </div>
  );
}
