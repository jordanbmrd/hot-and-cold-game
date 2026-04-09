import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface HowToPlayDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function HowToPlayDialog({ open, onOpenChange }: HowToPlayDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[90vw] max-w-md">
        <DialogHeader>
          <DialogTitle>Comment jouer</DialogTitle>
          <DialogDescription>
            Trouvez le mot secret du jour par similarité sémantique.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 text-sm">
          <p>
            Chaque jour, un <strong>mot secret</strong> est choisi. Votre
            objectif est de le deviner en proposant des mots.
          </p>
          <p>
            Pour chaque mot proposé, vous recevez un{" "}
            <strong>score de 0 à 100</strong> basé sur la proximité sémantique
            avec le mot secret.
          </p>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="inline-block w-3 h-3 rounded-full bg-blue-500" />
              <span>
                <strong>0-15</strong> — Glacial
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-block w-3 h-3 rounded-full bg-sky-400" />
              <span>
                <strong>16-30</strong> — Froid
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-block w-3 h-3 rounded-full bg-amber-400" />
              <span>
                <strong>31-50</strong> — Tiède
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-block w-3 h-3 rounded-full bg-orange-500" />
              <span>
                <strong>51-70</strong> — Chaud
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-block w-3 h-3 rounded-full bg-red-500" />
              <span>
                <strong>71-99</strong> — Brûlant
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-block w-3 h-3 rounded-full bg-emerald-500" />
              <span>
                <strong>100</strong> — Trouvé !
              </span>
            </div>
          </div>

          <p className="text-muted-foreground">
            Si votre mot est dans le <strong>top 1000</strong> des mots les plus
            proches, son rang sera affiché.
          </p>
          <p className="text-muted-foreground">
            Le mot secret est toujours un mot courant (nom, adjectif, verbe
            à l'infinitif…). Il change tous les jours à minuit UTC.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
