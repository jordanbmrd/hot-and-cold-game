import { Progress } from "@/components/ui/progress";
import { scoreToColor } from "@/lib/scoring";

interface ScoreBarProps {
  score: number;
}

export function ScoreBar({ score }: ScoreBarProps) {
  return (
    <div className="flex items-center gap-2 flex-1 min-w-0">
      <Progress
        value={score}
        className="h-2.5 flex-1"
        indicatorClassName={scoreToColor(score)}
      />
      <span className="text-xs font-mono text-muted-foreground w-8 text-right shrink-0">
        {score}
      </span>
    </div>
  );
}
