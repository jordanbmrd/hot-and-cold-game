"""
Génère targets.json à partir du words.json existant.
Ne nécessite aucune dépendance externe (ni gensim, ni sklearn).

Usage (depuis la racine du projet) :
    python3 scripts/generate_targets.py
"""

import json
import os
import random
import re

OUT_DIR = "public/data"
WORDS_PATH = os.path.join(OUT_DIR, "words.json")
TARGETS_PATH = os.path.join(OUT_DIR, "targets.json")

TARGET_MAX_RANK = 12_000
TARGET_MIN_LEN = 4
TARGET_MAX_LEN = 15

# Suffixes de formes conjuguées (haute confiance)
CONJUGATED_SUFFIXES = [
    # Conditionnel (-er / -ir)
    'erais', 'erait', 'erions', 'eriez', 'eraient',
    'irais', 'irait', 'irions', 'iriez', 'iraient',
    # Futur (-er / -ir)
    'erons', 'erez', 'eront',
    'irons', 'irez', 'iront',
    # Futur (-dre : répondra, prendra, viendra, attendra…)
    'ndra', 'ndras', 'ndront',
    # Futur (-oir / irréguliers : pourra, voudra, faudra…)
    'oudra', 'oudras', 'oudront',
    'ourra', 'ourras', 'ourront',
    # Passé simple
    'âmes', 'âtes', 'èrent',
    'îmes', 'îtes',
    'ûmes', 'ûtes', 'urent',
    # Subjonctif imparfait
    'assions', 'assiez', 'assent',
    'issions', 'issiez', 'issent',
    'ussions', 'ussiez', 'ussent',
    # Imparfait 3e singulier (rendait, donnait, faisait…) — mots >5 chars seulement
    'ait',
    # Imparfait 3e pluriel
    'aient',
]

STOPWORDS = {
    # Mots-outils / pronoms / déterminants
    'pour', 'dans', 'avec', 'plus', 'sans', 'tout', 'mais', 'aussi',
    'comme', 'bien', 'nous', 'vous', 'leur', 'elle', 'elles',
    'leurs', 'cette', 'même', 'autre', 'alors', 'entre', 'encore',
    'très', 'après', 'avant', 'depuis', 'donc', 'moins', 'sous',
    'chez', 'vers', 'cela', 'ceci', 'dont', 'quand', 'quel', 'quoi',
    # Formes verbales courantes (trop courtes pour les suffixes)
    'sera', 'sont', 'soit', 'être', 'avoir', 'fait', 'faire', 'peut',
    'doit', 'faut', 'était', 'tous', 'toute', 'toutes',
    'pourra', 'faudra', 'aura', 'fera', 'dira', 'verra', 'saura',
    'avait', 'avais', 'serait', 'aurait', 'ferait',
    'étant', 'ayant', 'faisant',
}


def is_good_target(word: str, rank: int) -> bool:
    if rank >= TARGET_MAX_RANK:
        return False
    if len(word) < TARGET_MIN_LEN or len(word) > TARGET_MAX_LEN:
        return False
    if word in STOPWORDS:
        return False
    for suffix in CONJUGATED_SUFFIXES:
        if word.endswith(suffix) and len(word) > len(suffix) + 2:
            return False
    return True


def main():
    with open(WORDS_PATH, "r", encoding="utf-8") as f:
        words = json.load(f)

    targets = [i for i, w in enumerate(words) if is_good_target(w, i)]

    with open(TARGETS_PATH, "w", encoding="utf-8") as f:
        json.dump(targets, f)

    # Exemples
    random.seed(42)
    sample = random.sample(targets, min(25, len(targets)))
    sample_words = sorted([words[i] for i in sample])

    print(f"Vocabulaire total : {len(words)} mots")
    print(f"Mots cibles : {len(targets)}")
    print(f"Exemples : {sample_words}")
    print(f"\nÉcrit : {TARGETS_PATH}")


if __name__ == "__main__":
    main()
