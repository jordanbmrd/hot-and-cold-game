"""
Script de prétraitement Word2Vec -> format compact pour le navigateur.
À exécuter une seule fois depuis la racine du projet :
    python scripts/preprocess.py

Génère :
    public/data/words.json   — liste de mots français (array JSON)
    public/data/vectors.bin  — vecteurs Float32 bruts (N × PCA_DIMS × 4 bytes)

Dépendances :
    pip install gensim numpy scikit-learn
"""

import json
import os
import re
import sys

import numpy as np
from gensim.models import KeyedVectors
from sklearn.decomposition import PCA
from sklearn.preprocessing import normalize

# ── Constantes ──────────────────────────────────────────────────────────────

BIN_PATH  = "data/frWac_non_lem_no_postag_no_phrase_200_skip_cut100.bin"
OUT_DIR   = "public/data"
MAX_VOCAB = 18_000   # nombre de mots à conserver
PCA_DIMS  = 100      # 100 dims pour une bonne qualité de similarité
MIN_LEN   = 4
MAX_LEN   = 20

# Caractères autorisés : lettres latines + accents français courants
VALID_RE = re.compile(r'^[a-zàâäéèêëîïôùûüÿœæç]+$')

# ── Filtrage du vocabulaire ──────────────────────────────────────────────────

def is_valid(word: str) -> bool:
    return (
        MIN_LEN <= len(word) <= MAX_LEN
        and word == word.lower()
        and bool(VALID_RE.match(word))
    )

# ── Main ─────────────────────────────────────────────────────────────────────

def main():
    # 1. Chargement du modèle
    print(f"Chargement du modèle : {BIN_PATH}  (~15 s)")
    if not os.path.exists(BIN_PATH):
        print(f"ERREUR : fichier introuvable -> {BIN_PATH}", file=sys.stderr)
        sys.exit(1)

    model = KeyedVectors.load_word2vec_format(BIN_PATH, binary=True)
    print(f"  Modèle chargé : {len(model.key_to_index)} mots, {model.vector_size} dims")

    # 2. Filtrage + tri par fréquence
    # key_to_index est ordonné par fréquence décroissante dans gensim 4.x
    filtered = [w for w in model.key_to_index if is_valid(w)]
    filtered = filtered[:MAX_VOCAB]
    print(f"  Vocabulaire filtré : {len(filtered)} mots (max {MAX_VOCAB})")

    # 3. Extraction des vecteurs
    matrix = np.array([model[w] for w in filtered], dtype=np.float32)  # (N, 200)
    print(f"  Matrice extraite : {matrix.shape}")

    # 4. PCA
    pca = PCA(n_components=PCA_DIMS, random_state=42)
    reduced = pca.fit_transform(matrix).astype(np.float32)             # (N, 50)
    variance = pca.explained_variance_ratio_.sum()
    print(f"  PCA {model.vector_size} -> {PCA_DIMS} dims  (variance expliquée : {variance:.1%})")
    if variance < 0.60:
        print("  WARNING:  Variance < 60 % — envisager d'augmenter PCA_DIMS à 100", file=sys.stderr)

    # 5. Normalisation L2 (cosine sim = produit scalaire après cette étape)
    normalized = normalize(reduced, norm='l2').astype(np.float32)      # (N, 50)
    print("  Normalisation L2 effectuée")

    # 6. Export
    os.makedirs(OUT_DIR, exist_ok=True)

    words_path   = os.path.join(OUT_DIR, "words.json")
    vectors_path = os.path.join(OUT_DIR, "vectors.bin")

    with open(words_path, "w", encoding="utf-8") as f:
        json.dump(filtered, f, ensure_ascii=False)

    with open(vectors_path, "wb") as f:
        normalized.tofile(f)   # row-major Float32, sans header

    words_size   = os.path.getsize(words_path)
    vectors_size = os.path.getsize(vectors_path)
    expected     = len(filtered) * PCA_DIMS * 4

    print(f"\n  Écrit : {words_path}  ({words_size:,} bytes, {len(filtered)} mots)")
    print(f"  Écrit : {vectors_path}  ({vectors_size:,} bytes)")

    if vectors_size != expected:
        print(f"ERREUR : taille inattendue ({vectors_size} ≠ {expected})", file=sys.stderr)
        sys.exit(1)

    # 7. Vérification de qualité : voisins de "chien"
    print("\n  Vérification — voisins de 'chien' :")
    wi = {w: i for i, w in enumerate(filtered)}
    if "chien" in wi:
        target = normalized[wi["chien"]]
        sims   = normalized @ target
        top6   = [filtered[i] for i in np.argsort(sims)[::-1][:6]]
        print(f"    {top6}")
    else:
        print("    (mot 'chien' absent du vocabulaire filtré)")

    print("\nTerminé.")


if __name__ == "__main__":
    main()
