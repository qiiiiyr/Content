# Graph Report - Content  (2026-11-15)

## Corpus Check
- 37 files · ~8,971 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 1 file(s) not represented in the graph (top: (none) 1)

## Summary
- 313 nodes · 507 edges · 15 communities (14 shown, 1 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 8 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `c4fe7132`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- collect.ts
- package.json
- env
- publish.ts
- steps
- steps
- kit.tsx
- types.ts
- publish.yml
- env
- api
- One-time setup (about 2 hours)
- steps
- compilerOptions
- tts.py

## God Nodes (most connected - your core abstractions)
1. `env` - 12 edges
2. `api()` - 12 edges
3. `compilerOptions` - 11 edges
4. `Title()` - 10 edges
5. `env` - 9 edges
6. `T()` - 9 edges
7. `Lang` - 9 edges
8. `remotion` - 8 edges
9. `readMeta()` - 8 edges
10. `steps` - 7 edges

## Surprising Connections (you probably didn't know these)
- `Hook()` --calls--> `Box()`  [EXTRACTED]
  episodes/2026-W47/1-wifi/Scenes.tsx → src/kit.tsx
- `Hook()` --calls--> `T()`  [EXTRACTED]
  episodes/2026-W47/1-wifi/Scenes.tsx → src/kit.tsx
- `Hook()` --calls--> `Title()`  [EXTRACTED]
  episodes/2026-W47/1-wifi/Scenes.tsx → src/kit.tsx
- `Hook()` --calls--> `Waves()`  [EXTRACTED]
  episodes/2026-W47/1-wifi/Scenes.tsx → src/kit.tsx
- `RadioStation()` --calls--> `Arrow()`  [EXTRACTED]
  episodes/2026-W47/1-wifi/Scenes.tsx → src/kit.tsx

## Import Cycles
- None detected.

## Communities (15 total, 1 thin omitted)

### Community 0 - "collect.ts"
Cohesion: 0.11
Nodes (25): {rejected, switchRejected}, decision, hits, now, offline, out, own, posted (+17 more)

### Community 1 - "package.json"
Cohesion: 0.09
Nodes (29): dependencies, @fontsource/inter@5.3.0, react@19.2.0, react-dom@19.2.0, remotion@4.0.543, @remotion/cli@4.0.543, @remotion/media@4.0.543, devDependencies (+21 more)

### Community 2 - "env"
Cohesion: 0.08
Nodes (25): runs-on, steps, IG_TOKEN_EN, IG_TOKEN_ID, IG_USER_ID_EN, IG_USER_ID_ID, YT_CLIENT_ID, YT_CLIENT_SECRET (+17 more)

### Community 3 - "publish.ts"
Cohesion: 0.15
Nodes (16): build(), seconds(), VOICES, checkMeta(), sceneCount(), WORDS, episodes, LANGS (+8 more)

### Community 4 - "steps"
Cohesion: 0.08
Nodes (23): if, runs-on, steps, BASE_SHA, GH_TOKEN, PR_BODY, jobs, apply (+15 more)

### Community 5 - "steps"
Cohesion: 0.08
Nodes (23): BASE_REF, GH_TOKEN, PR, REPO, jobs, render, name, on (+15 more)

### Community 6 - "kit.tsx"
Cohesion: 0.26
Nodes (21): Bands(), Encoding(), Hook(), Password(), RadioStation(), ROUTER, Sine(), Turns() (+13 more)

### Community 7 - "types.ts"
Cohesion: 0.20
Nodes (15): remotion, Captions(), Episode(), episodeIds, getEpisode(), metas, scenes, colors (+7 more)

### Community 8 - "publish.yml"
Cohesion: 0.10
Nodes (19): concurrency, default, type, dry_run, lang, jobs, publish, default (+11 more)

### Community 9 - "env"
Cohesion: 0.11
Nodes (19): DRY, IG_TOKEN_EN, IG_TOKEN_ID, IG_USER_ID_EN, IG_USER_ID_ID, POST_LANG, PRIVACY, YT_CLIENT_ID (+11 more)

### Community 10 - "api"
Cohesion: 0.30
Nodes (13): api(), env(), GRAPH, igAccount(), uploadInstagram(), uploadYoutube(), youtubeToken(), CompetitorVideo (+5 more)

### Community 11 - "One-time setup (about 2 hours)"
Cohesion: 0.12
Nodes (14): Episode rules, How It Actually Works — weekly review and batch, Never, Pull request, Verify, Weekly procedure (the scheduled task runs this), 1. Accounts, 2. YouTube API (free) (+6 more)

### Community 12 - "steps"
Cohesion: 0.15
Nodes (12): description, name, runs, steps, using, run, shell, uses (+4 more)

### Community 13 - "compilerOptions"
Cohesion: 0.15
Nodes (12): compilerOptions, allowImportingTsExtensions, jsx, module, moduleResolution, noEmit, resolveJsonModule, skipLibCheck (+4 more)

## Knowledge Gaps
- **1 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `remotion` connect `types.ts` to `package.json`, `kit.tsx`?**
  _High betweenness centrality (0.036) - this node is a cross-community bridge._
- **Should `collect.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.1053763440860215 - nodes in this community are weakly interconnected._
- **Why does `Lang` connect `api` to `publish.ts`, `kit.tsx`, `types.ts`?**
  _High betweenness centrality (0.025) - this node is a cross-community bridge._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.08505747126436781 - nodes in this community are weakly interconnected._
- **Why does `react` connect `package.json` to `kit.tsx`, `types.ts`?**
  _High betweenness centrality (0.020) - this node is a cross-community bridge._
- **Should `env` be split into smaller, more focused modules?**
  _Cohesion score 0.07692307692307693 - nodes in this community are weakly interconnected._
- **Should `steps` be split into smaller, more focused modules?**
  _Cohesion score 0.08333333333333333 - nodes in this community are weakly interconnected._