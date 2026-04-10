# 🔥 Chaud & Froid

A French daily word-guessing game inspired by semantic similarity — find the secret word of the day by getting "warmer" with each guess.

## How It Works

Each day a new secret word is chosen. Enter any French word and receive a **score from 0 to 100** based on how semantically close it is to the secret word. The closer your guess, the hotter you get!

| Score | Temperature |
|-------|-------------|
| 0–15  | 🔵 Glacial  |
| 16–30 | 🩵 Froid    |
| 31–50 | 🟡 Tiède    |
| 51–70 | 🟠 Chaud    |
| 71–99 | 🔴 Brûlant  |
| 100   | 🟢 Trouvé ! |

If your guess is among the **top 1000** closest words to the secret, its rank is also shown. Scores are computed using cosine similarity on PCA-reduced FastText word embeddings — all client-side, no server required.

Progress is saved in `localStorage` so you can pick up where you left off.

## Tech Stack

- **React 19** + **TypeScript**
- **Vite** — build tooling
- **Tailwind CSS** + **Radix UI** — styling and accessible components
- Word vectors processed offline with **Python** (FastText / Word2Vec)

## Getting Started

### Prerequisites

- Node.js ≥ 18
- Python 3.9+ (for data preprocessing only)

### Install dependencies

```bash
npm install
```

### Generate game data

The game requires three files in `public/data/`:

| File | Description |
|------|-------------|
| `words.json` | Full vocabulary array (sorted by frequency) |
| `vectors.bin` | Raw Float32 word vectors (N × 100 dims) |
| `targets.json` | Indices of valid daily-word candidates |

**1. Download the FastText French model** (~1.3 GB download, ~4.3 GB uncompressed):

```bash
python3 scripts/download_fasttext.py
```

**2. Preprocess the vectors:**

```bash
python3 scripts/preprocess.py
```

This filters vocabulary, runs PCA (300 → 100 dims), L2-normalises the vectors, and writes the three output files.

```bash
# Optional: use an explicit model path
python3 scripts/preprocess.py --model data/cc.fr.300.vec

# Dependencies
pip3 install numpy scikit-learn
```

**3. (Optional) Regenerate `targets.json` from an existing `words.json`:**

```bash
python3 scripts/generate_targets.py
```

### Run the dev server

```bash
npm run dev
```

### Build for production

```bash
npm run build
```

Preview the production build locally:

```bash
npm run preview
```

## Project Structure

```
├── public/
│   └── data/            # Game data (words.json, vectors.bin, targets.json)
├── scripts/
│   ├── download_fasttext.py   # Downloads the FastText French vectors
│   ├── preprocess.py          # Builds words.json, vectors.bin, targets.json
│   └── generate_targets.py    # Regenerates targets.json from existing words.json
└── src/
    ├── components/      # UI components (GuessInput, GuessList, WinDialog, …)
    ├── hooks/           # useGame, useModel
    ├── lib/             # Similarity, scoring, daily word selection, storage
    └── types/           # TypeScript interfaces
```
