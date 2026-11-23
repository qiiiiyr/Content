# Looks (visual styles)

An episode picks its look with `"look"` in `meta.json` (default `workshop`). The look changes the set, lights,
on-screen graphics and captions; the 3D parts and the narration stay the same. Techniques are learned from the
references in `docs/look.md`, never their artwork. Sample: one episode rendered in every look
(`node scripts/build.ts <id> en --look <name>`).

| Look | Set and light | Graphics | Captions |
|---|---|---|---|
| `workshop` | Warm plaster wall, wood bench, props; soft studio light | none | Inter 800, white with dark outline, tan box on key words |
| `golden` | Sunset sky (amber to dusk), dark silhouette hills, dark asphalt floor; low sun behind the subject so edges glow; warm haze | Cyan gauge top left whose arc fills with the scene (scene n of N), mono label of the key words; a thin cyan ring on the floor under the part, slowly turning; vignette | Upper-case Inter 800 left-aligned behind an orange slash; words light up as they are spoken; key words amber |
| `editorial` | Near-black studio, glossy dark floor, soft spot from above, cool rim from behind | Red tag top left naming the step; the key number counts up big in serif with a small-caps label | Serif italic, sentence case, white; key words in a lighter weight of red |
| `blueprint` | Navy room, cyan grid floor and wall, cool light | Drawing title block "FIG. n — key words" with a dimension line that draws itself across the top | JetBrains Mono, white on a navy band, key words in a cyan box |

## Rules for every look

- Frame 1 is already moving; graphics slide in with direction (never only fade), under 0.4 s.
- Graphics stay out of the caption band (y 1130-1390 of 1920) and the bottom 350 px (platform UI).
- One accent colour per look (cyan, red, cyan). Every word must read on a phone at arm's length.
- A graphic shows information (progress, the key number, the step), never decoration.
- Render time stays within about 10% of `workshop`.
