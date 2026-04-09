import { useState, useRef } from "react";
import { Send } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { SubmitResult } from "@/hooks/useGame";

interface GuessInputProps {
  onGuess: (word: string) => SubmitResult;
  disabled: boolean;
}

export function GuessInput({ onGuess, disabled }: GuessInputProps) {
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const word = value.trim();
    if (!word) return;

    const result = onGuess(word);

    if (result.ok) {
      setValue("");
    } else {
      switch (result.error) {
        case "unknown_word":
          setError("Mot inconnu — essayez un autre mot");
          break;
        case "already_guessed":
          setError("Mot déjà proposé");
          break;
        case "no_model":
          setError("Chargement en cours...");
          break;
      }
    }

    inputRef.current?.focus();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <div className="flex gap-2">
        <Input
          ref={inputRef}
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setError(null);
          }}
          placeholder="Proposez un mot..."
          disabled={disabled}
          autoComplete="off"
          autoCapitalize="off"
          spellCheck={false}
          className="flex-1"
        />
        <Button type="submit" disabled={disabled || !value.trim()} size="icon">
          <Send className="h-4 w-4" />
        </Button>
      </div>
      {error && (
        <p className="text-sm text-destructive animate-slide-in">{error}</p>
      )}
    </form>
  );
}
