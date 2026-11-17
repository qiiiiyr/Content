// Weekly: gathers our numbers and competitors' numbers, runs the review rule, writes data/stats/<week>.json.
// Usage: node scripts/collect.ts [--offline]   (--offline skips all API calls; for testing the pipeline)
import {existsSync, mkdirSync, readdirSync, writeFileSync} from 'node:fs';
import {LANGS, readJson, readMeta} from './lib.ts';
import {decide, findHits, followups, isoWeek, type CompetitorVideo, type EpisodeScore, type Strategy} from './review.ts';
import type {Posted} from './publish.ts';

type Theme = {key: string; name: string; competitors: {youtube: Record<string, string[]>; instagram: Record<string, string[]>}};

const offline = process.argv.includes('--offline');
const now = new Date();
const strategy = readJson<Strategy>('strategy.json', null as never);
const themes = readJson<{themes: Theme[]}>('themes.json', {themes: []}).themes;
const posted = readJson<Posted[]>('state/posted.json', []);
const unresolved: string[] = [];

// Our own numbers, per post.
const own: (Posted & {views: number; extra: Record<string, number>})[] = [];
if (!offline) {
	const {ownYoutube} = await import('./stats/youtube.ts');
	const {ownInstagram} = await import('./stats/instagram.ts');
	for (const lang of LANGS) {
		const yt = posted.some((p) => p.lang === lang && p.platform === 'youtube') ? await ownYoutube(lang) : {};
		for (const p of posted.filter((p) => p.lang === lang && !p.error)) {
			if (p.platform === 'youtube') {
				const s = yt[p.mediaId] ?? {views: 0, avgViewPct: 0, subsGained: 0};
				own.push({...p, views: s.views, extra: {avgViewPct: s.avgViewPct, subsGained: s.subsGained}});
			} else {
				const s = await ownInstagram(lang, p.mediaId).catch((e) => (console.warn(e.message), {views: 0}));
				own.push({...p, views: s.views ?? 0, extra: s});
			}
		}
	}
}

// One score per episode: views summed over both languages and platforms, dated by its first post.
// Frozen the first week it is minAgeDays old and reused after that, so every episode is compared at a similar age.
const lastStats = existsSync('data/stats') ? readdirSync('data/stats').sort().at(-1) : undefined;
const previous = lastStats ? readJson<{episodes: EpisodeScore[]}>(`data/stats/${lastStats}`, {episodes: []}).episodes : [];
const frozen = new Map(previous.filter((e) => e.frozen).map((e) => [e.id, e]));
// posts of deleted episodes (test uploads, removed folders) have no meta.json to read, so they are left out
const episodes: EpisodeScore[] = [...Map.groupBy(own.filter((p) => existsSync(`episodes/${p.id}/meta.json`)), (p) => p.id).entries()].map(([id, ps]) => {
	if (frozen.has(id)) return frozen.get(id)!;
	const meta = readMeta(id);
	const postedAt = ps.map((p) => p.postedAt).sort()[0];
	const old = now.getTime() - Date.parse(postedAt) >= strategy.thresholds.minAgeDays * 86_400_000;
	return {id, theme: meta.theme, test: meta.test, postedAt, score: ps.reduce((a, p) => a + p.views, 0), frozen: old};
});

// Competitors.
const videos: CompetitorVideo[] = [];
if (!offline) {
	const {competitorYoutube} = await import('./stats/youtube.ts');
	const {competitorInstagram} = await import('./stats/instagram.ts');
	const token = await (await import('./post/youtube.ts')).youtubeToken('en');
	for (const t of themes) {
		for (const [lang, handles] of Object.entries(t.competitors.youtube)) {
			for (const h of handles) {
				const vs = await competitorYoutube(token, h, t.key, lang).catch((e) => (console.warn(e.message), null));
				vs ? videos.push(...vs) : unresolved.push(`youtube ${h}`);
			}
		}
		for (const [lang, users] of Object.entries(t.competitors.instagram)) {
			for (const u of users) {
				const vs = await competitorInstagram(u, t.key, lang);
				vs ? videos.push(...vs) : unresolved.push(`instagram ${u}`);
			}
		}
	}
}

const th = strategy.thresholds;
const hits = findHits(videos, th.hitMultiple, th.hitWindowDays, now);
const decision = decide(episodes, hits, themes.map((t) => t.key), strategy, now);
const week = isoWeek(now);
const out = {
	week,
	collectedAt: now.toISOString(),
	decision,
	hitsByTheme: Object.fromEntries(themes.map((t) => [t.key, hits.filter((h) => h.theme === t.key).length])),
	followups: followups(episodes, th.followupMultiple),
	episodes: episodes.sort((a, b) => b.score - a.score),
	posts: own,
	competitorHits: hits.slice(0, 40),
	unresolvedCompetitors: unresolved,
};
mkdirSync('data/stats', {recursive: true});
writeFileSync(`data/stats/${week}.json`, JSON.stringify(out, null, 2) + '\n');
console.log(`data/stats/${week}.json: ${decision.action}${decision.to ? ` -> ${decision.to}` : ''} (${decision.reason}); ${hits.length} competitor hits; next test theme ${decision.nextTestTheme}`);
