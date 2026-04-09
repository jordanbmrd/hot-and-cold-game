import type { GameState } from "@/types/game";
import { getTodayUTC } from "./dailyWord";

const KEY_PREFIX = "chaud-froid-";

function todayKey(): string {
  return KEY_PREFIX + getTodayUTC();
}

export function saveState(state: GameState): void {
  try {
    localStorage.setItem(todayKey(), JSON.stringify(state));
  } catch {
    // quota exceeded — ignore
  }
}

export function loadState(): GameState | null {
  try {
    const raw = localStorage.getItem(todayKey());
    if (!raw) return null;
    return JSON.parse(raw) as GameState;
  } catch {
    return null;
  }
}
