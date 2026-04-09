import { useState, useEffect } from "react";
import type { GameModel } from "@/types/game";
import { DIMS, computeTop1000, stripAccents } from "@/lib/similarity";
import { getDailyWordIndex } from "@/lib/dailyWord";

export function useModel() {
  const [model, setModel] = useState<GameModel | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [wordsRes, vecRes] = await Promise.all([
          fetch("/data/words.json"),
          fetch("/data/vectors.bin"),
        ]);

        if (!wordsRes.ok || !vecRes.ok) {
          throw new Error("Impossible de charger les données du jeu");
        }

        const words: string[] = await wordsRes.json();
        const buffer = await vecRes.arrayBuffer();
        const vectors = new Float32Array(buffer);

        // Vérification d'intégrité
        const expected = words.length * DIMS;
        if (vectors.length !== expected) {
          throw new Error(
            `Données corrompues : ${vectors.length} floats, attendu ${expected}`
          );
        }

        // Index exact
        const wordIndex = new Map<string, number>();
        words.forEach((w, i) => wordIndex.set(w, i));

        // Index sans accents pour matching approximatif
        const strippedIndex = new Map<string, number>();
        words.forEach((w, i) => {
          const stripped = stripAccents(w);
          // On ne met que si pas déjà présent (priorité au premier = plus fréquent)
          if (!strippedIndex.has(stripped)) {
            strippedIndex.set(stripped, i);
          }
        });

        // Mot du jour
        const dailyWordIndex = await getDailyWordIndex(words.length);

        // Top 1000 voisins
        const { indices, similarities } = computeTop1000(
          vectors,
          dailyWordIndex,
          words.length
        );

        if (cancelled) return;

        setModel({
          words,
          wordIndex,
          strippedIndex,
          vectors,
          dims: DIMS,
          dailyWordIndex,
          top1000Indices: indices,
          top1000Sims: similarities,
        });
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Erreur inconnue");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return { model, loading, error };
}
