# Graph Report - Content  (2026-11-15)

## Corpus Check
- Corpus is ~8,971 words - fits in a single context window. You may not need a graph.

## Summary
- 329 nodes · 549 edges · 15 communities (14 shown, 1 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 14 edges (avg confidence: 0.84)
- Token cost: 97,496 input · 0 output

## Community Hubs (Navigation)
- Weekly Review Process
- Stats Collection and Approval
- Episode Content Rules
- Package Dependencies
- Build, Validation and Tests
- Approve Workflow
- Render Preview Workflow
- Platform API Clients
- Publish Workflow Secrets
- Collect Workflow
- Remotion Video Player
- Shared CI Setup
- TypeScript Config
- Publish Triggers
- Voiceover (TTS)

## God Nodes (most connected - your core abstractions)
1. `env` - 12 edges
2. `api()` - 12 edges
3. `compilerOptions` - 11 edges
4. `T()` - 10 edges
5. `Title()` - 10 edges
6. `env` - 9 edges
7. `Lang` - 9 edges
8. `remotion` - 8 edges
9. `readMeta()` - 8 edges
10. `steps` - 7 edges

## Surprising Connections (you probably didn't know these)
- `Swap Points (voice, platforms, languages)` --references--> `LANGS`  [EXTRACTED]
  README.md → scripts/lib.ts
- `GitHub Actions Secrets (8)` --semantically_similar_to--> `Never Rules (no posting, no credentials, no workflow-owned files)`  [INFERRED] [semantically similar]
  docs/SETUP.md → CLAUDE.md
- `Visual Rules` --references--> `T()`  [EXTRACTED]
  CLAUDE.md → src/kit.tsx
- `Hook()` --calls--> `Box()`  [EXTRACTED]
  episodes/2026-W47/1-wifi/Scenes.tsx → src/kit.tsx
- `Hook()` --calls--> `T()`  [EXTRACTED]
  episodes/2026-W47/1-wifi/Scenes.tsx → src/kit.tsx

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Weekly collect-review-merge-publish pipeline** — github_workflows_collect, claude_stats_json, claude_weekly_procedure, claude_weekly_review_pr, github_workflows_render, github_workflows_approve, github_workflows_publish [EXTRACTED 1.00]
- **Episode artifact structure** — claude_meta_json, claude_scenes_tsx, src_kit, src_kit_t [EXTRACTED 1.00]
- **Episode quality rules against inauthentic content** — claude_fact_checking_rule, claude_narration_rules, claude_visual_rules, claude_inauthentic_content_policy [INFERRED 0.85]

## Communities (15 total, 1 thin omitted)

### Community 0 - "Weekly Review Process"
Cohesion: 0.06
Nodes (35): Weekly 7-Episode Batch, state/posted.json, data/stats weekly JSON, strategy.json, themes.json, unresolvedCompetitors, Weekly Report reports/W.md, Weekly Review Pull Request (+27 more)

### Community 1 - "Stats Collection and Approval"
Cohesion: 0.10
Nodes (26): {rejected, switchRejected}, decision, hits, now, offline, out, own, posted (+18 more)

### Community 2 - "Episode Content Rules"
Cohesion: 0.17
Nodes (25): YouTube Inauthentic Content Policy, meta.json (episode metadata), Reference Episode 2026-W47/1-wifi, Scenes.tsx (episode scenes), Bands(), Encoding(), Hook(), Password() (+17 more)

### Community 3 - "Package Dependencies"
Cohesion: 0.09
Nodes (29): dependencies, @fontsource/inter@5.3.0, react@19.2.0, react-dom@19.2.0, remotion@4.0.543, @remotion/cli@4.0.543, @remotion/media@4.0.543, devDependencies (+21 more)

### Community 4 - "Build, Validation and Tests"
Cohesion: 0.15
Nodes (16): build(), seconds(), VOICES, checkMeta(), sceneCount(), WORDS, episodes, LANGS (+8 more)

### Community 5 - "Approve Workflow"
Cohesion: 0.08
Nodes (23): if, runs-on, steps, BASE_SHA, GH_TOKEN, PR_BODY, jobs, apply (+15 more)

### Community 6 - "Render Preview Workflow"
Cohesion: 0.08
Nodes (23): BASE_REF, GH_TOKEN, PR, REPO, jobs, render, name, on (+15 more)

### Community 7 - "Platform API Clients"
Cohesion: 0.25
Nodes (15): api(), env(), GRAPH, igAccount(), uploadInstagram(), uploadYoutube(), youtubeToken(), competitorInstagram() (+7 more)

### Community 8 - "Publish Workflow Secrets"
Cohesion: 0.11
Nodes (19): DRY, IG_TOKEN_EN, IG_TOKEN_ID, IG_USER_ID_EN, IG_USER_ID_ID, POST_LANG, PRIVACY, YT_CLIENT_ID (+11 more)

### Community 9 - "Collect Workflow"
Cohesion: 0.11
Nodes (18): runs-on, steps, IG_TOKEN_EN, IG_TOKEN_ID, IG_USER_ID_EN, IG_USER_ID_ID, YT_CLIENT_ID, YT_CLIENT_SECRET (+10 more)

### Community 10 - "Remotion Video Player"
Cohesion: 0.24
Nodes (12): remotion, Captions(), Episode(), episodeIds, getEpisode(), metas, scenes, colors (+4 more)

### Community 11 - "Shared CI Setup"
Cohesion: 0.15
Nodes (12): description, name, runs, steps, using, run, shell, uses (+4 more)

### Community 12 - "TypeScript Config"
Cohesion: 0.15
Nodes (12): compilerOptions, allowImportingTsExtensions, jsx, module, moduleResolution, noEmit, resolveJsonModule, skipLibCheck (+4 more)

### Community 13 - "Publish Triggers"
Cohesion: 0.18
Nodes (11): default, type, dry_run, lang, default, description, on, schedule (+3 more)

## Knowledge Gaps
- **1 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Weekly Automation Schedule` connect `Weekly Review Process` to `Render Preview Workflow`?**
  _High betweenness centrality (0.218) - this node is a cross-community bridge._
- **Should `Weekly Review Process` be split into smaller, more focused modules?**
  _Cohesion score 0.06387921022067364 - nodes in this community are weakly interconnected._
- **Why does `Weekly Review Pull Request` connect `Weekly Review Process` to `Approve Workflow`?**
  _High betweenness centrality (0.132) - this node is a cross-community bridge._
- **Should `Stats Collection and Approval` be split into smaller, more focused modules?**
  _Cohesion score 0.1028225806451613 - nodes in this community are weakly interconnected._
- **Should `Package Dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.08505747126436781 - nodes in this community are weakly interconnected._
- **Should `Approve Workflow` be split into smaller, more focused modules?**
  _Cohesion score 0.08333333333333333 - nodes in this community are weakly interconnected._
- **Should `Render Preview Workflow` be split into smaller, more focused modules?**
  _Cohesion score 0.08333333333333333 - nodes in this community are weakly interconnected._