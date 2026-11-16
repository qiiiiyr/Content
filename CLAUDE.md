# How It Actually Works — weekly review and batch

Two faceless channels (English `en`, Indonesian `id`) on YouTube Shorts and Instagram Reels. Each episode is a
45-60 second animated explainer. GitHub Actions render and post; a weekly Claude session (you) reviews the numbers
and writes next week's batch as one pull request. A human approves by merging.

## Weekly procedure (the scheduled task runs this)

Let `W` = this ISO week (e.g. `2026-W47`) and `N` = next ISO week. The batch you write is for `N`.

1. **Read the numbers.** Open the newest `data/stats/*.json` (written Friday night by `collect.yml`). It holds
   `decision` (keep/switch, computed in code: do not redo or override the arithmetic), `followups`, `competitorHits`,
   `hitsByTheme`, `episodes`, and `unresolvedCompetitors`. If it is missing or older than 3 days, say so in the
   report and continue with web research only.
2. **Research competitors.** Look at the hit videos' titles and topics. Use web search for what is trending in the
   current theme. Fix every handle in `unresolvedCompetitors` in `themes.json` (find the real handle or remove it).
   Add Instagram competitors (Business/Creator usernames) where `instagram` lists are empty.
3. **Write `reports/W.md`**: a short table of last week's episodes (views, avg % watched where present), the top
   3 competitor hits and what made them work (topic, hook, title pattern), the decision and its reason, and 3-6
   concrete adjustments for next week. Plain language, under 400 words.
4. **Update `strategy.json`**: set `testTheme` to `decision.nextTestTheme`. Keep `lessons` to the 10 most useful,
   each one short and actionable ("first scene must show the object, not a title card"). If `decision.action` is
   `switch`, set `currentTheme` to `decision.to` and `themeSince` to the Monday of week N+1 (the switch starts the
   week after this batch). Never edit `thresholds` unless the human asked.
5. **Write 7 episodes in `episodes/N/`**, folders `1-<slug>` … `7-<slug>`, posted in that order, one per day:
   - 5 on `currentTheme` (`"test": false`) and 2 on `testTheme` (`"test": true`) in slots 3 and 6.
   - Topic priority: follow-ups of `followups`, then topics suggested by competitor hits (rewritten in our own
     words and visuals, never copied), then `themes.json` ideas. Never repeat a topic already in `episodes/`.
   - Copy the structure of `episodes/2026-W47/1-wifi/`: `meta.json` (narration per scene in both languages,
     titles ending in ` #shorts`, description, 4-6 hashtags, at least 2 sources) and `Scenes.tsx` (one component
     per scene, built from `src/kit.tsx`).
6. **Verify, then open the pull request** (see below). `npm test` must pass.

## Episode rules

- **Facts:** check every claim with web search; cite at least 2 sources, prefer primary ones (standards bodies,
  manufacturers, universities) over blogs. If unsure, leave the claim out. A wrong fact is worse than a weak video.
- **Narration:** 6-8 scenes, 90-150 English words in total (`npm run check` enforces the range). Scene 1 is a hook
  that works in under 2 seconds: a surprising fact or question, never "In this video". Last scene ends with a short
  follow line. Indonesian must sound natural and casual (use "kamu"), not a literal translation; keep tech terms
  people actually say (router, chip, Bluetooth).
- **Visuals:** every scene gets its own diagram that shows the mechanism: what moves where, what changes. Do not
  reuse a previous episode's layout. All on-screen text goes through `<T en="…" id="…" />`. Keep diagrams between
  y=220 and y=1300; captions are drawn automatically below. Use `colors` from the kit; no images, emoji or fonts
  from the internet. Add new kit components to `src/kit.tsx` only if two or more episodes need them.
- YouTube's "inauthentic content" policy removes monetization from template-like, repetitive videos. Variety in
  topic, hook, layout and pacing is the defence; so is accuracy.

## Verify

```bash
npm test
REMOTION_BROWSER=/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell node scripts/build.ts <week>/<n-slug> en
```

Render episode 1 in English only, then build ONE contact sheet and view that single image:

```bash
ffmpeg -v error -y -i out/<week>__1-<slug>.en.mp4 -vf "fps=1/6,scale=360:-1,tile=8x1" out/sheet.png
```

Check: text inside the frame, nothing overlapping the captions, the diagram readable on a phone. Fix what you see.
CI renders and checks every episode in both languages on the pull request, so do not render the others here.

## Keep the run cheap

Each run should cost well under the first one (about $4). Use at most 8 web searches in total (the stats file already
holds the competitor data). Do not read `graphify-out/` or run graphify. Do not re-read files you already read.
Write each episode file once; `npm test` is the check, not a second read. Stop after a green `npm test`, the one
contact-sheet image and the pull request.

## Pull request

Branch `review/W`, base `main`, title `Weekly review W: <decision in 5 words>`. Body, exactly this shape (the
`apply review` workflow parses the checklist):

```
Report: reports/W.md
<2-3 sentence summary: what worked, what changes next week>

## Episodes for N (untick to reject)
- [x] episodes/N/1-<slug> — <English title> (<theme>)
...
## Theme
- [x] Switch theme to "<to>" from <date>      <- only when decision.action is "switch"
```

## Never

- Edit `state/posted.json` or `data/stats/` (written by workflows), or anything under `.github/` unless asked.
- Post, publish, or touch credentials. Posting is the `publish` workflow's job, after a human merges.
