import { useState } from "react";
import { Flame, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HowToPlayDialog } from "./HowToPlayDialog";

export function Header() {
  const [helpOpen, setHelpOpen] = useState(false);

  const today = new Date().toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <>
      <header className="flex items-center justify-between px-4 py-4 border-b">
        <div className="flex items-center gap-2">
          <Flame className="h-6 w-6 text-orange-500" />
          <h1 className="text-xl font-bold tracking-tight">Chaud & Froid</h1>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground hidden sm:block">
            {today}
          </span>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setHelpOpen(true)}
            aria-label="Comment jouer"
          >
            <HelpCircle className="h-5 w-5" />
          </Button>
        </div>
      </header>
      <HowToPlayDialog open={helpOpen} onOpenChange={setHelpOpen} />
    </>
  );
}
