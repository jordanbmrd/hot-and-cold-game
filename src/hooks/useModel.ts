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
        const base = import.meta.env.BASE_URL;
        const [wordsRes, vecRes, targetsRes] = await Promise.all([
          fetch(`${base}data/words.json`),
          fetch(`${base}data/vectors.bin`),
          fetch(`${base}data/targets.json`),
        ]);

        if (!wordsRes.ok || !vecRes.ok) {
          throw new Error("Impossible de charger les données du jeu");
        }

        const words: string[] = await wordsRes.json();
        const buffer = await vecRes.arrayBuffer();
        const vectors = new Float32Array(buffer);

        // Mots cibles (fallback : tout le vocabulaire si targets.json absent)
        let targets: number[];
        if (targetsRes.ok) {
          targets = await targetsRes.json();
        } else {
          targets = Array.from({ length: words.length }, (_, i) => i);
        }

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

        // Mot du jour (pioche parmi les cibles curées)
        const dailyWordIndex = await getDailyWordIndex(targets);

        // Top 1000 voisins
        const { indices, similarities, ranks } = computeTop1000(
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
          ranks,
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
