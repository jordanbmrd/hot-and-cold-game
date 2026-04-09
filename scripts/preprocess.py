"""
Prétraitement d'embeddings → format compact pour le navigateur.

Supporte deux sources de vecteurs (par ordre de préférence) :
  1. FastText Common Crawl  (data/cc.fr.300.vec)  — meilleure qualité sémantique
  2. frWac Word2Vec          (data/frWac_...bin)   — modèle original

Usage :
    python3 scripts/preprocess.py
    python3 scripts/preprocess.py --model data/cc.fr.300.vec

Pour télécharger FastText (recommandé) :
    python3 scripts/download_fasttext.py

Génère :
    public/data/words.json    — vocabulaire complet (array JSON, trié par fréquence)
    public/data/vectors.bin   — vecteurs Float32 bruts (N × PCA_DIMS × 4 bytes)
    public/data/targets.json  — indices des mots cibles valides pour le jeu

Dépendances : numpy scikit-learn  (pip3 install numpy scikit-learn)
  → pas besoin de gensim, les formats sont lus nativement.
"""

import argparse
import json
import os
import random
import re
import struct
import sys

import numpy as np
from sklearn.decomposition import PCA
from sklearn.preprocessing import normalize

# ── Constantes ──────────────────────────────────────────────────────────────

OUT_DIR   = "public/data"
MAX_VOCAB = 50_000
PCA_DIMS  = 100
MIN_LEN   = 3
MAX_LEN   = 20

# Mots cibles : sous-ensemble « devinable »
TARGET_MAX_RANK = 12_000
TARGET_MIN_LEN  = 4
TARGET_MAX_LEN  = 15

VALID_RE = re.compile(r'^[a-zàâäéèêëîïôùûüÿœæç]+$')

CONJUGATED_SUFFIXES = [
    # Conditionnel (-er / -ir)
    'erais', 'erait', 'erions', 'eriez', 'eraient',
    'irais', 'irait', 'irions', 'iriez', 'iraient',
    # Futur (-er / -ir)
    'erons', 'erez', 'eront',
    'irons', 'irez', 'iront',
    # Futur (-dre : répondra, prendra, viendra…)
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
    # Mots-outils
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

DEFAULT_MODELS = [
    ("data/cc.fr.300.vec", "fasttext_vec"),
    ("data/cc.fr.300.bin", "fasttext_bin"),
    ("data/frWac_non_lem_no_postag_no_phrase_200_skip_cut100.bin", "word2vec_bin"),
]


# ── Lecteurs de modèles (sans gensim) ───────────────────────────────────────

def load_fasttext_vec(path: str, max_words: int):
    """Lit un fichier FastText texte (.vec).  Format :
        <vocab_size> <dims>
        mot  v1 v2 v3 ...
    Retourne (words, matrix) triés par ordre d'apparition (= fréquence desc).
    """
    words, vecs = [], []
    print(f"  Lecture de {path} …", flush=True)
    with open(path, "r", encoding="utf-8", errors="replace") as f:
        header = f.readline().split()
        total, dims = int(header[0]), int(header[1])
        print(f"  En-tête : {total:,} mots × {dims} dims")
        for line in f:
            if len(words) >= max_words:
                break
            parts = line.rstrip().split(" ")
            if len(parts) != dims + 1:
                continue
            words.append(parts[0])
            vecs.append(parts[1:])
            if len(words) % 50_000 == 0:
                print(f"  … {len(words):,} mots lus", flush=True)
    matrix = np.array(vecs, dtype=np.float32)
    return words, matrix, dims


def load_word2vec_bin(path: str, max_words: int):
    """Lit un fichier Word2Vec binaire (.bin).  Format :
        <vocab_size> <dims>\\n
        <mot><espace><4*dims bytes float32>
    Retourne (words, matrix) triés par fréquence décroissante.
    """
    words, vecs = [], []
    print(f"  Lecture de {path} …", flush=True)
    with open(path, "rb") as f:
        header = f.readline().decode("utf-8").split()
        total, dims = int(header[0]), int(header[1])
        print(f"  En-tête : {total:,} mots × {dims} dims")
        for _ in range(total):
            if len(words) >= max_words:
                break
            # Lire le mot (jusqu'à l'espace)
            word_bytes = b""
            while True:
                c = f.read(1)
                if c in (b" ", b"\t"):
                    break
                if c == b"\n":
                    continue
                if c == b"":
                    break
                word_bytes += c
            word = word_bytes.decode("utf-8", errors="replace")
            vec = np.frombuffer(f.read(4 * dims), dtype=np.float32).copy()
            words.append(word)
            vecs.append(vec)
            if len(words) % 50_000 == 0:
                print(f"  … {len(words):,} mots lus", flush=True)
    matrix = np.array(vecs, dtype=np.float32)
    return words, matrix, dims


def load_fasttext_bin(path: str, max_words: int):
    """Lit un fichier FastText binaire (.bin). Format propriétaire FastText.
    Seule la partie word-vectors est extraite (pas les subwords).
    """
    words, vecs = [], []
    print(f"  Lecture de {path} (format binaire FastText) …", flush=True)
    with open(path, "rb") as f:
        # Magic number et version
        magic = struct.unpack("<i", f.read(4))[0]
        version = struct.unpack("<i", f.read(4))[0]
        if magic != 793712314:
            raise ValueError(f"Magic number invalide : {magic} (attendu 793712314)")

        # Hyperparamètres (skipgram)
        dims        = struct.unpack("<i", f.read(4))[0]
        window_size = struct.unpack("<i", f.read(4))[0]
        epoch       = struct.unpack("<i", f.read(4))[0]
        min_count   = struct.unpack("<i", f.read(4))[0]
        neg         = struct.unpack("<i", f.read(4))[0]
        loss        = struct.unpack("<i", f.read(4))[0]
        model       = struct.unpack("<i", f.read(4))[0]
        bucket      = struct.unpack("<i", f.read(4))[0]
        minn        = struct.unpack("<i", f.read(4))[0]
        maxn        = struct.unpack("<i", f.read(4))[0]
        lr_update   = struct.unpack("<i", f.read(4))[0]
        t           = struct.unpack("<d", f.read(8))[0]
        # depuis version 12 : label_prefix
        if version >= 12:
            label_len = struct.unpack("<i", f.read(4))[0]
            f.read(label_len)

        print(f"  Format FastText v{version} : {dims} dims, minn={minn}, maxn={maxn}")

        # Dictionnaire
        nwords = struct.unpack("<i", f.read(4))[0]
        nlabels = struct.unpack("<i", f.read(4))[0]
        ntokens = struct.unpack("<q", f.read(8))[0]
        pruneidx_size = struct.unpack("<q", f.read(8))[0]
        print(f"  Dictionnaire : {nwords:,} mots + {nlabels} labels")

        word_list = []
        for _ in range(nwords + nlabels):
            wlen = struct.unpack("<i", f.read(4))[0]
            w = f.read(wlen).decode("utf-8", errors="replace")
            count = struct.unpack("<q", f.read(8))[0]
            wtype = struct.unpack("<i", f.read(4))[0]   # 0=word, 1=label
            word_list.append((w, wtype))

        if pruneidx_size > 0:
            for _ in range(pruneidx_size):
                f.read(8)   # int, int

        # Matrice de vecteurs (mots + subwords buckets)
        nrows = struct.unpack("<q", f.read(8))[0]
        ncols = struct.unpack("<q", f.read(8))[0]
        print(f"  Matrice : {nrows:,} × {ncols}")

        # Lire tous les vecteurs de mots (indexes 0..nwords-1)
        # Puis on peut arrêter avant les buckets
        for i, (w, wtype) in enumerate(word_list[:nwords]):
            vec = np.frombuffer(f.read(4 * ncols), dtype=np.float32).copy()
            if wtype == 0:
                words.append(w)
                vecs.append(vec)
            if len(words) >= max_words:
                break
            if (i + 1) % 50_000 == 0:
                print(f"  … {i+1:,} entrées lues", flush=True)

    matrix = np.array(vecs, dtype=np.float32)
    return words, matrix, dims


# ── Filtres de vocabulaire ───────────────────────────────────────────────────

def is_valid(word: str) -> bool:
    return (
        MIN_LEN <= len(word) <= MAX_LEN
        and word == word.lower()
        and bool(VALID_RE.match(word))
    )


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


# ── Main ────────────────────────────────────────────────────────────────────

def find_model(explicit: str | None):
    if explicit:
        if not os.path.exists(explicit):
            print(f"ERREUR : introuvable → {explicit}", file=sys.stderr)
            sys.exit(1)
        if explicit.endswith(".bin"):
            # Distinguer Word2Vec .bin de FastText .bin par le magic number
            with open(explicit, "rb") as f:
                magic = struct.unpack("<i", f.read(4))[0]
            fmt = "fasttext_bin" if magic == 793712314 else "word2vec_bin"
        else:
            fmt = "fasttext_vec"
        return explicit, fmt

    for path, fmt in DEFAULT_MODELS:
        if os.path.exists(path):
            return path, fmt

    print("ERREUR : aucun modèle trouvé dans data/.", file=sys.stderr)
    print("  → python3 scripts/download_fasttext.py", file=sys.stderr)
    sys.exit(1)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--model", help="Chemin explicite vers le modèle")
    args = parser.parse_args()

    model_path, fmt = find_model(args.model)
    print(f"Modèle : {model_path}  (format : {fmt})")

    # 1. Chargement
    if fmt == "fasttext_vec":
        raw_words, matrix, src_dims = load_fasttext_vec(model_path, MAX_VOCAB * 4)
    elif fmt == "fasttext_bin":
        raw_words, matrix, src_dims = load_fasttext_bin(model_path, MAX_VOCAB * 4)
    else:
        raw_words, matrix, src_dims = load_word2vec_bin(model_path, MAX_VOCAB * 4)

    # 2. Filtrage
    pairs = [(w, matrix[i]) for i, w in enumerate(raw_words) if is_valid(w)]
    pairs = pairs[:MAX_VOCAB]
    filtered = [p[0] for p in pairs]
    mat_filtered = np.array([p[1] for p in pairs], dtype=np.float32)
    print(f"  Vocabulaire filtré : {len(filtered):,} mots (sur {len(raw_words):,})")

    # 3. PCA
    if src_dims > PCA_DIMS:
        print(f"  PCA {src_dims} → {PCA_DIMS} dims …", flush=True)
        pca = PCA(n_components=PCA_DIMS, random_state=42)
        reduced = pca.fit_transform(mat_filtered).astype(np.float32)
        variance = pca.explained_variance_ratio_.sum()
        print(f"  Variance expliquée : {variance:.1%}")
        if variance < 0.50:
            print("  ⚠  Variance < 50 % — envisager d'augmenter PCA_DIMS", file=sys.stderr)
    else:
        reduced = mat_filtered

    # 4. Normalisation L2
    normalized = normalize(reduced, norm="l2").astype(np.float32)

    # 5. Cibles
    targets = [i for i, w in enumerate(filtered) if is_good_target(w, i)]
    print(f"  Mots cibles : {len(targets):,}")

    # 6. Export
    os.makedirs(OUT_DIR, exist_ok=True)
    words_path   = os.path.join(OUT_DIR, "words.json")
    vectors_path = os.path.join(OUT_DIR, "vectors.bin")
    targets_path = os.path.join(OUT_DIR, "targets.json")

    with open(words_path, "w", encoding="utf-8") as f:
        json.dump(filtered, f, ensure_ascii=False)
    normalized.tofile(vectors_path)
    with open(targets_path, "w", encoding="utf-8") as f:
        json.dump(targets, f)

    expected = len(filtered) * PCA_DIMS * 4
    actual = os.path.getsize(vectors_path)
    if actual != expected:
        print(f"ERREUR taille : {actual} ≠ {expected}", file=sys.stderr)
        sys.exit(1)

    print(f"\n  words.json   : {os.path.getsize(words_path)//1024} KB  ({len(filtered):,} mots)")
    print(f"  vectors.bin  : {os.path.getsize(vectors_path)/1024/1024:.1f} MB")
    print(f"  targets.json : {os.path.getsize(targets_path)//1024} KB  ({len(targets):,} cibles)")

    # 7. Vérification
    print("\n  Voisins sémantiques :")
    wi = {w: i for i, w in enumerate(filtered)}
    for test in ["chien", "voiture", "musique", "soleil"]:
        if test in wi:
            v = normalized[wi[test]]
            sims = normalized @ v
            top = [filtered[j] for j in np.argsort(sims)[::-1][1:7]]
            print(f"    {test:10s} → {top}")

    random.seed(42)
    sample = sorted([filtered[i] for i in random.sample(targets, min(25, len(targets)))])
    print(f"\n  Exemples de cibles : {sample}")
    print("\nTerminé.")


if __name__ == "__main__":
    main()
