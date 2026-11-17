# Graph Report - Content  (2026-11-17)

## Corpus Check
- 40 files · ~16,015 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 2 file(s) not represented in the graph (top: (none) 2)

## Summary
- 425 nodes · 712 edges · 20 communities
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 17 edges (avg confidence: 0.84)
- Token cost: 97,496 input · 0 output

## Graph Freshness
- Built from commit: `ae3440e9`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Weekly Review Process
- Stats Collection and Approval
- stage.tsx
- Package Dependencies
- render
- Approve Workflow
- render.yml
- Platform API Clients
- Publish Workflow Secrets
- Collect Workflow
- Brand.tsx
- Shared CI Setup
- TypeScript Config
- Publish Triggers
- tts.py
- steps
- jobs
- with
- env
- plan

## God Nodes (most connected - your core abstractions)
1. `api()` - 15 edges
2. `env` - 13 edges
3. `Lang` - 12 edges
4. `compilerOptions` - 11 edges
5. `Stroke()` - 10 edges
6. `Stage()` - 10 edges
7. `Engine()` - 10 edges
8. `env` - 9 edges
9. `with` - 9 edges
10. `remotion` - 9 edges

## Surprising Connections (you probably didn't know these)
- `Swap Points (voice, platforms, languages)` --references--> `LANGS`  [EXTRACTED]
  README.md → scripts/lib.ts
- `GitHub Actions Secrets (8)` --semantically_similar_to--> `Never Rules (no posting, no credentials, no workflow-owned files)`  [INFERRED] [semantically similar]
  docs/SETUP.md → CLAUDE.md
- `Stroke()` --calls--> `cycleState()`  [EXTRACTED]
  episodes/2026-W47/1-four-stroke/Scenes.tsx → src/stage.tsx
- `Stroke()` --calls--> `Engine()`  [EXTRACTED]
  episodes/2026-W47/1-four-stroke/Scenes.tsx → src/stage.tsx
- `Stroke()` --calls--> `Stage()`  [EXTRACTED]
  episodes/2026-W47/1-four-stroke/Scenes.tsx → src/stage.tsx

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Weekly collect-review-merge-publish pipeline** — github_workflows_collect, claude_stats_json, claude_weekly_procedure, claude_weekly_review_pr, github_workflows_render, github_workflows_approve, github_workflows_publish [EXTRACTED 1.00]
- **Episode quality rules against inauthentic content** — claude_fact_checking_rule, claude_narration_rules, claude_visual_rules, claude_inauthentic_content_policy [INFERRED 0.85]

## Communities (20 total, 0 thin omitted)

### Community 0 - "Weekly Review Process"
Cohesion: 0.05
Nodes (40): Weekly 7-Episode Batch, YouTube Inauthentic Content Policy, meta.json (episode metadata), state/posted.json, Reference Episode 2026-W47/1-wifi, Scenes.tsx (episode scenes), data/stats weekly JSON, strategy.json (+32 more)

### Community 1 - "Stats Collection and Approval"
Cohesion: 0.06
Nodes (46): {rejected, switchRejected}, build(), highlights(), seconds(), VOICES, checkMeta(), sceneCount(), WORDS (+38 more)

### Community 2 - "stage.tsx"
Cohesion: 0.11
Nodes (34): Compression(), Crank(), Exhaust(), Finale(), Hook(), Intake(), Power(), Stroke() (+26 more)

### Community 3 - "Package Dependencies"
Cohesion: 0.07
Nodes (35): dependencies, @fontsource/inter@5.3.0, react@19.2.0, react-dom@19.2.0, @react-three/fiber@9.8.2, remotion@4.0.543, @remotion/cli@4.0.543, @remotion/media@4.0.543 (+27 more)

### Community 4 - "render"
Cohesion: 0.20
Nodes (10): render, id, lang, if, needs, runs-on, strategy, timeout-minutes (+2 more)

### Community 5 - "Approve Workflow"
Cohesion: 0.08
Nodes (23): if, runs-on, steps, BASE_SHA, GH_TOKEN, PR_BODY, jobs, apply (+15 more)

### Community 6 - "render.yml"
Cohesion: 0.25
Nodes (7): name, on, pull_request, permissions, contents, pull-requests, paths

### Community 7 - "Platform API Clients"
Cohesion: 0.23
Nodes (18): api(), env(), checkInstagram(), FIX, GRAPH, igAccount(), igUser(), uploadInstagram() (+10 more)

### Community 8 - "Publish Workflow Secrets"
Cohesion: 0.10
Nodes (20): DRY, IG_TOKEN_EN, IG_TOKEN_ID, IG_USER_ID_EN, IG_USER_ID_ID, ONLY, POST_LANG, PRIVACY (+12 more)

### Community 9 - "Collect Workflow"
Cohesion: 0.11
Nodes (18): runs-on, steps, IG_TOKEN_EN, IG_TOKEN_ID, IG_USER_ID_EN, IG_USER_ID_ID, YT_CLIENT_ID, YT_CLIENT_SECRET (+10 more)

### Community 10 - "Brand.tsx"
Cohesion: 0.11
Nodes (34): react, remotion, ACCENT, Avatar(), AvatarLoop(), Banner(), gearPath(), Lockup() (+26 more)

### Community 11 - "Shared CI Setup"
Cohesion: 0.15
Nodes (12): description, name, runs, steps, using, run, shell, uses (+4 more)

### Community 12 - "TypeScript Config"
Cohesion: 0.15
Nodes (12): compilerOptions, allowImportingTsExtensions, jsx, module, moduleResolution, noEmit, resolveJsonModule, skipLibCheck (+4 more)

### Community 13 - "Publish Triggers"
Cohesion: 0.14
Nodes (14): default, type, dry_run, lang, only, default, description, on (+6 more)

### Community 14 - "tts.py"
Cohesion: 0.16
Nodes (8): chunks(), main(), pct(), prosody(), seconds(), self_check(), speak(), speak_chunk()

### Community 15 - "steps"
Cohesion: 0.31
Nodes (9): steps, steps, steps, id, if, name, run, uses (+1 more)

### Community 16 - "jobs"
Cohesion: 0.29
Nodes (7): if, needs, runs-on, jobs, comment, test, runs-on

### Community 17 - "with"
Cohesion: 0.29
Nodes (7): with, fetch-depth, merge-multiple, name, path, pattern, retention-days

### Community 18 - "env"
Cohesion: 0.40
Nodes (5): BASE_REF, GH_TOKEN, PR, REPO, env

### Community 19 - "plan"
Cohesion: 0.50
Nodes (4): plan, ids, outputs, runs-on

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Weekly Automation Schedule` connect `Weekly Review Process` to `render.yml`?**
  _High betweenness centrality (0.265) - this node is a cross-community bridge._
- **Should `Weekly Review Process` be split into smaller, more focused modules?**
  _Cohesion score 0.05142857142857143 - nodes in this community are weakly interconnected._
- **Why does `jobs` connect `jobs` to `plan`, `render`, `render.yml`?**
  _High betweenness centrality (0.165) - this node is a cross-community bridge._
- **Should `Stats Collection and Approval` be split into smaller, more focused modules?**
  _Cohesion score 0.06393442622950819 - nodes in this community are weakly interconnected._
- **Why does `Lang` connect `Brand.tsx` to `Stats Collection and Approval`, `Platform API Clients`?**
  _High betweenness centrality (0.140) - this node is a cross-community bridge._
- **Should `stage.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.11095305832147938 - nodes in this community are weakly interconnected._
- **Should `Package Dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.07301587301587302 - nodes in this community are weakly interconnected._