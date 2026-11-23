# Competitor analysis (2026-11-23)

Data: `data/stats/2026-W47.json` (40 competitor hits, YouTube Data API and Instagram business_discovery), our own
posts (`scripts/analyze.ts`), and 3 web searches. Instagram gives competitors' likes, not views: their "views" column
there is likes.

## What wins

| Account | Format | Best recent | Signal |
|---|---|---|---|
| scroll.engineer (IG) | 3D explainer, golden-hour HUD | "Mercedes headlights can cut a moving hole in their own high beams… 👀": 174k likes, 1,325 comments | 187x its median; 9 of its top 10 name a real brand or game |
| EngineeringExplained (YT) | host + whiteboard | "I Fact-Checked Every Stunt in the Tesla Roadster Reveal": 2.9M views | news-reactive, a famous product |
| carwow (YT) | drag races, records | 3-4M views per video, ~1.2-2.5% likes+comments per view | named cars against each other |
| RevZilla (YT) | moto reviews | up to 116x median on a torture test | stunts and tests with real bikes |
| Branch Education, Jared Owen (YT, long) | 3D explainers | "How a Car Engine Works": 18M | the 3D look we compete with |

**Indonesian:** no Indonesian 3D mechanical explainer account turned up on Instagram or YouTube. The slot is empty.

## Us against them

| | Us | scroll.engineer |
|---|---|---|
| Topic | textbook ("how a four-stroke works") | a hidden feature of a named product ("Porsche has an EV with a 2-speed transmission 🤯") |
| Title | a fact | brand + surprising capability + curiosity emoji |
| Frame 1 | the part on a bench | the product already moving in a real place |
| Graphics | captions only | HUD tags that label what you see ("REAR · EST.", "RECREATED") |
| Comments per 1k likes | about 0 | 5-12 (they ask "would you trust this?" style questions) |

Our English YouTube four-stroke (3% likes per view) already matches carwow's rate: the 3D works when it reaches the
right people. Reach and comments are what lag.

## Changes (into strategy.json lessons and the next batch)

1. **Anchor every topic on a real, named product** people know, with the mechanism as the payoff: "Why a Honda Beat
   needs no gears", "The part that lets a Ducati lean 60°". Indonesian episodes use bikes and cars Indonesians own
   (Beat, Vario, NMAX, Avanza, Xpander, Innova). Facts about the product need 2 sources, as always.
2. **Title = brand + surprising capability + one emoji** (👀 🤯 😳), under 70 characters, no "how X works".
3. **End on a question that splits people** ("Would you buy a bike with no clutch lever?") instead of "follow for
   more" on half the episodes: comments are the signal we have none of.
4. **Animation that changes every 1-2 s** (see docs/styles.md, animation language): cold open mid-action, X-ray focus
   on the part being named, labels pinned to parts, slow-motion with a time tag at the key moment, 2-3 shots per scene.
5. **Indonesian first-mover:** post the Indonesian version of the strongest English hooks, rewritten around local
   bikes; add Indonesian competitors as they appear (none found yet).

Sources: [Branch Education/3D channels list](https://blog.autonolab.com/niches/2026-02-10-faceless-youtube-engineering/),
[Jared Owen](https://borntoengineer.com/?p=25383), [Opus Pro 13.5M clips](https://www.opus.pro/blog/video-editing-tips),
[Toptal Shorts retention](https://www.toptal.com/creator/post/youtube-shorts-length).
