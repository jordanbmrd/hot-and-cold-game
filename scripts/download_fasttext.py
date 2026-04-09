"""
Télécharge les vecteurs FastText français (Common Crawl + Wikipedia).

Ce modèle offre une bien meilleure qualité sémantique que frWac pour le jeu
Chaud & Froid. Les mots proches correspondent mieux au sens intuitif.

Usage :
    python scripts/download_fasttext.py

Le fichier décompressé (~4.3 Go) sera placé dans data/cc.fr.300.vec.
Ensuite, lancez :
    python scripts/preprocess.py
"""

import gzip
import os
import shutil
import sys
import urllib.request

URL = "https://dl.fbaipublicfiles.com/fasttext/vectors-crawl/cc.fr.300.vec.gz"
OUT_DIR = "data"
GZ_PATH = os.path.join(OUT_DIR, "cc.fr.300.vec.gz")
VEC_PATH = os.path.join(OUT_DIR, "cc.fr.300.vec")


def download_with_progress(url: str, dest: str):
    """Télécharge un fichier avec une barre de progression."""
    print(f"Téléchargement : {url}")
    print(f"Destination    : {dest}")

    req = urllib.request.urlopen(url)
    total = int(req.headers.get("Content-Length", 0))
    downloaded = 0
    block_size = 1024 * 1024  # 1 MB

    with open(dest, "wb") as f:
        while True:
            chunk = req.read(block_size)
            if not chunk:
                break
            f.write(chunk)
            downloaded += len(chunk)
            if total > 0:
                pct = downloaded / total * 100
                mb = downloaded / (1024 * 1024)
                total_mb = total / (1024 * 1024)
                print(f"\r  {mb:.0f} / {total_mb:.0f} MB  ({pct:.1f}%)", end="", flush=True)
    print()


def main():
    os.makedirs(OUT_DIR, exist_ok=True)

    if os.path.exists(VEC_PATH):
        size_gb = os.path.getsize(VEC_PATH) / (1024 ** 3)
        print(f"Le fichier existe déjà : {VEC_PATH}  ({size_gb:.1f} Go)")
        print("Supprimez-le pour re-télécharger.")
        return

    # Téléchargement
    if not os.path.exists(GZ_PATH):
        print("Ce téléchargement fait ~1.3 Go. Assurez-vous d'avoir une bonne connexion.\n")
        download_with_progress(URL, GZ_PATH)
    else:
        print(f"Archive déjà présente : {GZ_PATH}")

    # Décompression
    print(f"\nDécompression vers {VEC_PATH}  (~4.3 Go, peut prendre quelques minutes)...")
    with gzip.open(GZ_PATH, "rb") as f_in:
        with open(VEC_PATH, "wb") as f_out:
            shutil.copyfileobj(f_in, f_out)

    # Nettoyage
    os.remove(GZ_PATH)
    size_gb = os.path.getsize(VEC_PATH) / (1024 ** 3)
    print(f"\nTerminé : {VEC_PATH}  ({size_gb:.1f} Go)")
    print("\nProchaine étape :")
    print("  python scripts/preprocess.py")


if __name__ == "__main__":
    main()
