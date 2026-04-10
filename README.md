# 🌡️ Chaud & Froid

A French daily word-guessing game inspired by Semantle. Each day a secret word is chosen, and players try to guess it by entering words and receiving a **semantic similarity score** — the closer your guess is in meaning, the hotter it gets.

## How to Play

1. Type any French word and submit it.
2. You receive a score from **0 to 100** based on how semantically similar your guess is to the secret word.
3. Use the temperature feedback to guide your next guess.
4. Find the exact word to win!

### Temperature scale

| Score | Label     | Color  |
|-------|-----------|--------|
| 100   | Trouvé !  | 🟢 Green  |
| 71–99 | Brûlant   | 🔴 Red    |
| 51–70 | Chaud     | 🟠 Orange |
| 31–50 | Tiède     | 🟡 Yellow |
| 16–30 | Froid     | 🔵 Sky    |
| 0–15  | Glacial   | 🔵 Blue   |

If your word is among the **top 1000** closest words to the secret, its rank (1 = closest) is also shown.

The secret word changes every day at **midnight UTC** — the same word for all players worldwide, determined by a SHA-256 hash of the current UTC date.

## Tech Stack

- **React 19** + **TypeScript**
- **Vite** (dev server & build)
- **Tailwind CSS** + **Radix UI** (components)
- Word embeddings loaded as binary `Float32Array` in the browser (no server needed)

## Getting Started

### Prerequisites

- Node.js ≥ 18
- Python 3 with `numpy` and `scikit-learn` (for data generation only)

### Install dependencies

```bash
npm install
```

### Generate the data files

The game requires three files in `public/data/`:

| File            | Description                                      |
|-----------------|--------------------------------------------------|
| `words.json`    | Full vocabulary (array of strings, by frequency) |
| `vectors.bin`   | L2-normalised PCA-reduced Float32 vectors        |
| `targets.json`  | Indices of valid daily-word candidates           |

#### Option A — FastText (recommended, best semantic quality)

```bash
# 1. Download French FastText vectors (~1.3 GB compressed, ~4.3 GB decompressed)
python3 scripts/download_fasttext.py

# 2. Preprocess into browser-friendly format
python3 scripts/preprocess.py
```

#### Option B — Custom model

```bash
# Point to any .vec (FastText text) or .bin (Word2Vec / FastText binary) file
python3 scripts/preprocess.py --model path/to/your/model.vec
```

#### Regenerate targets only (if you already have `words.json`)

```bash
python3 scripts/generate_targets.py
```

### Run the dev server

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Build for production

```bash
npm run build
```

The output is in `dist/`. The app is fully static and can be hosted on any CDN or static hosting service (GitHub Pages, Netlify, Vercel, etc.).

## Project Structure

```
├── public/
│   └── data/              # Generated data files (not committed)
│       ├── words.json
│       ├── vectors.bin
│       └── targets.json
├── scripts/
│   ├── download_fasttext.py   # Downloads FastText FR embeddings
│   ├── preprocess.py          # Builds words.json / vectors.bin / targets.json
│   └── generate_targets.py    # Regenerates targets.json from words.json
└── src/
    ├── components/            # React UI components
    ├── hooks/                 # useGame, useModel
    ├── lib/                   # Scoring, similarity, daily word, storage
    └── types/                 # TypeScript interfaces
```

## Scoring Details

- **Exact match** → score 100 (win)
- **Top 1 000 neighbours** → score interpolated linearly from 99 (rank 1) to 30 (rank 1 000)
- **Outside top 1 000** → score 0–29 based on raw cosine similarity relative to the 1 000th neighbour

Accent-insensitive matching is supported: typing `etudiant` will match `étudiant`.

## License

MIT
