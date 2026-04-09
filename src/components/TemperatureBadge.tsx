import { cn } from "@/lib/utils";
import { scoreToLabel, scoreToBadgeClasses } from "@/lib/scoring";

interface TemperatureBadgeProps {
  score: number;
  rank: number | null;
}

export function TemperatureBadge({ score, rank }: TemperatureBadgeProps) {
  const label = scoreToLabel(score);
  const badgeClasses = scoreToBadgeClasses(score);

  return (
    <div className="flex items-center gap-1.5 shrink-0">
      <span
        className={cn(
          "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
          badgeClasses
        )}
      >
        {label}
      </span>
      {rank !== null && rank > 0 && (
        <span className="text-xs text-muted-foreground font-mono">
          #{rank}
        </span>
      )}
    </div>
  );
}
