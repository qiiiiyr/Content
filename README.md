# How It Actually Works

Automated "how technology works" Shorts and Reels in English and Indonesian, with a weekly review that adapts the
content to what performs, for us and for competitors, and switches theme when the numbers say so.

| When | What | Where |
|---|---|---|
| Fri night | own + competitor stats, keep/switch rule | `collect.yml` → `data/stats/` |
| Sat | report, strategy update, 7 new episodes, one PR | Claude scheduled task, `CLAUDE.md` |
| Sat | render previews | `render.yml` |
| Sun | you review and merge (about 10 min) | GitHub app |
| Daily | render and post one episode per language | `publish.yml` → `state/posted.json` |

- One-time setup: [`docs/SETUP.md`](docs/SETUP.md)
- Episode format and weekly procedure: [`CLAUDE.md`](CLAUDE.md)
- Theme switch rule and thresholds: `scripts/review.ts`, `strategy.json`; candidate themes: `themes.json`

```bash
npm test                                   # unit tests, episode validation, type check
npm run studio                             # preview episodes in the browser
node scripts/build.ts 2026-W47/1-wifi en   # render one episode -> out/
node scripts/publish.ts --lang en --dry-run
```

Swap points as it grows: voice in `scripts/tts.py` (e.g. ElevenLabs), platforms in `scripts/post/` +
`scripts/stats/` (e.g. TikTok), languages in `LANGS` (`scripts/lib.ts`) plus `src/types.ts`.
