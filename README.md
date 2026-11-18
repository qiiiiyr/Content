# Cutaway / Bongkar Pasang

Automated 3D "how motorcycles and cars work" Shorts and Reels in English (Cutaway) and Indonesian (Bongkar Pasang), with a weekly review that adapts the
content to what performs, for us and for competitors, and switches theme when the numbers say so.

| When | What | Where |
|---|---|---|
| Fri night | own + competitor stats, keep/switch rule | `collect.yml` → `data/stats/` |
| Sat | report, strategy update, 14 new episodes, one PR | Claude scheduled task, `CLAUDE.md` |
| Sat | render previews (one parallel job per episode and language) | `render.yml` |
| Sun | you review and merge (about 10 min) | GitHub app |
| Twice daily | post one episode per language each time | `publish.yml` → `state/posted.json` |

- One-time setup: [`docs/SETUP.md`](docs/SETUP.md)
- Episode format and weekly procedure: [`CLAUDE.md`](CLAUDE.md)
- Theme switch rule and thresholds: `scripts/review.ts`, `strategy.json`; candidate themes: `themes.json`

```bash
npm test                                   # unit tests, episode validation, type check
npm run studio                             # preview episodes in the browser
node scripts/build.ts 2026-W47/1-four-stroke en   # render one episode -> out/ (3D: about 10 min)
node scripts/publish.ts --lang en --dry-run
```

Swap points as it grows: voice in `scripts/tts.py` (e.g. ElevenLabs), platforms in `scripts/post/` +
`scripts/stats/` (e.g. TikTok), languages in `LANGS` (`scripts/lib.ts`) plus `src/types.ts`.
