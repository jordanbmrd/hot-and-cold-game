import { useState, useEffect } from "react";
import { Trophy, Copy, Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { GuessResult } from "@/types/game";

interface WinDialogProps {
  open: boolean;
  guesses: GuessResult[];
  attemptCount: number;
  secretWord: string;
}

function scoreToEmoji(score: number): string {
  if (score === 100) return "✅";
  if (score >= 71) return "🔥";
  if (score >= 51) return "🌡️";
  if (score >= 31) return "😐";
  if (score >= 16) return "❄️";
  return "🧊";
}

function getCountdown(): string {
  const now = new Date();
  const tomorrow = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1)
  );
  const diff = tomorrow.getTime() - now.getTime();
  const hours = Math.floor(diff / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  const seconds = Math.floor((diff % 60000) / 1000);
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function WinDialog({
  open,
  guesses,
  attemptCount,
  secretWord,
}: WinDialogProps) {
  const [copied, setCopied] = useState(false);
  const [countdown, setCountdown] = useState(getCountdown());

  useEffect(() => {
    if (!open) return;
    const interval = setInterval(() => setCountdown(getCountdown()), 1000);
    return () => clearInterval(interval);
  }, [open]);

  async function handleShare() {
    const today = new Date().toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    // Emojis des essais dans l'ordre chronologique
    const sortedByTime = [...guesses].sort(
      (a, b) => a.timestamp - b.timestamp
    );
    const emojis = sortedByTime.map((g) => scoreToEmoji(g.score)).join("");

    const text = `Chaud & Froid — ${today}\nJ'ai trouvé le mot en ${attemptCount} essai${attemptCount > 1 ? "s" : ""} !\n${emojis}`;

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback silencieux
    }
  }

  return (
    <Dialog open={open}>
      <DialogContent
        className="w-[90vw] max-w-sm text-center"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader className="items-center">
          <div className="text-6xl mb-2 animate-bounce">
            <Trophy className="h-16 w-16 text-amber-500 mx-auto" />
          </div>
          <DialogTitle className="text-2xl">Félicitations !</DialogTitle>
          <DialogDescription>
            Vous avez trouvé le mot du jour
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
            {secretWord}
          </p>

          <p className="text-muted-foreground">
            en{" "}
            <strong className="text-foreground">
              {attemptCount} essai{attemptCount > 1 ? "s" : ""}
            </strong>
          </p>

          <Button
            onClick={handleShare}
            variant="outline"
            className="gap-2 w-full"
          >
            {copied ? (
              <Check className="h-4 w-4 text-emerald-500" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
            {copied ? "Copié !" : "Partager mon résultat"}
          </Button>

          <div className="pt-2">
            <p className="text-xs text-muted-foreground">
              Prochain mot dans
            </p>
            <p className="text-lg font-mono font-medium">{countdown}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
