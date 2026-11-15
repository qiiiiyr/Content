// The weekly review's arithmetic: medians, competitor hits and the keep/switch decision.
// Pure functions only, so the rule is testable and Claude never has to do the maths itself.

export type Strategy = {
	currentTheme: string;
	themeSince: string; // ISO date the current theme started
	testTheme: string;
	thresholds: {
		minWeeksOnTheme: number; // a theme gets at least this many weeks
		minTestEpisodes: number; // test episodes a candidate needs before it can win
		switchRatio: number; // candidate median / current median needed to switch
		fallingWeeks: number; // weeks of falling medians that count as "falling"
		hitMultiple: number; // competitor video >= this x its channel median = hit
		hitWindowDays: number;
		followupMultiple: number; // own episode >= this x own median gets a follow-up
		minAgeDays: number; // ignore own posts younger than this (views still climbing)
	};
	lessons: string[];
};

export type EpisodeScore = {id: string; theme: string; test: boolean; postedAt: string; score: number};
export type CompetitorVideo = {theme: string; platform: string; lang: string; account: string; title: string; url: string; views: number; publishedAt: string};
export type Hit = CompetitorVideo & {multiple: number};
export type Decision = {action: 'keep' | 'switch'; to?: string; reason: string; currentMedian: number; nextTestTheme: string};

const DAY = 86_400_000;

export const median = (xs: number[]): number => {
	if (!xs.length) return 0;
	const s = [...xs].sort((a, b) => a - b);
	const m = Math.floor(s.length / 2);
	return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};

/** "2026-W47" (ISO 8601 week) for a date. */
export const isoWeek = (d: Date): string => {
	const t = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
	t.setUTCDate(t.getUTCDate() + 4 - (t.getUTCDay() || 7));
	const week = Math.ceil(((t.getTime() - Date.UTC(t.getUTCFullYear(), 0, 1)) / DAY + 1) / 7);
	return `${t.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
};

/** Videos far above their own channel's median, published inside the window. */
export const findHits = (videos: CompetitorVideo[], multiple: number, windowDays: number, now: Date): Hit[] => {
	const byAccount = Map.groupBy(videos, (v) => `${v.platform}:${v.account}`);
	return [...byAccount.values()]
		.flatMap((vs) => {
			const m = median(vs.map((v) => v.views));
			return vs.filter((v) => m > 0 && v.views >= multiple * m && now.getTime() - Date.parse(v.publishedAt) <= windowDays * DAY).map((v) => ({...v, multiple: Math.round((v.views / m) * 10) / 10}));
		})
		.sort((a, b) => b.multiple - a.multiple);
};

export const decide = (episodes: EpisodeScore[], hits: Hit[], themes: string[], s: Strategy, now: Date): Decision => {
	const t = s.thresholds;
	const mature = episodes.filter((e) => now.getTime() - Date.parse(e.postedAt) >= t.minAgeDays * DAY);
	const current = mature.filter((e) => e.theme === s.currentTheme).sort((a, b) => a.postedAt.localeCompare(b.postedAt));
	const currentMedian = median(current.slice(-20).map((e) => e.score));
	const hitsFor = (theme: string) => hits.filter((h) => h.theme === theme).length;
	const others = themes.filter((th) => th !== s.currentTheme);
	const testCount = (th: string) => episodes.filter((e) => e.theme === th).length;
	// Rotate tests: the least-tested candidate next, competitor hits break ties.
	const nextTestTheme = [...others].sort((a, b) => testCount(a) - testCount(b) || hitsFor(b) - hitsFor(a))[0] ?? s.currentTheme;
	const keep = (reason: string): Decision => ({action: 'keep', reason, currentMedian, nextTestTheme});

	const weeksOn = Math.floor((now.getTime() - Date.parse(s.themeSince)) / (7 * DAY));
	if (weeksOn < t.minWeeksOnTheme) return keep(`"${s.currentTheme}" has run ${weeksOn} of the minimum ${t.minWeeksOnTheme} weeks`);

	const candidates = others
		.map((th) => ({th, eps: mature.filter((e) => e.theme === th)}))
		.filter((c) => c.eps.length >= t.minTestEpisodes)
		.map((c) => ({th: c.th, m: median(c.eps.map((e) => e.score))}))
		.sort((a, b) => b.m - a.m);
	const best = candidates[0];
	if (best && best.m >= t.switchRatio * currentMedian && best.m > 0) {
		return {action: 'switch', to: best.th, reason: `test episodes of "${best.th}" have median ${best.m} vs ${currentMedian} for "${s.currentTheme}" (>= ${t.switchRatio}x)`, currentMedian, nextTestTheme};
	}

	const weekly = [...Map.groupBy(current, (e) => isoWeek(new Date(e.postedAt))).entries()].sort(([a], [b]) => a.localeCompare(b)).map(([, es]) => median(es.map((e) => e.score)));
	const recent = weekly.slice(-(t.fallingWeeks + 1));
	const falling = recent.length === t.fallingWeeks + 1 && recent.every((m, i) => i === 0 || m < recent[i - 1]);
	const hottest = [...others].sort((a, b) => hitsFor(b) - hitsFor(a))[0];
	if (falling && hottest && hitsFor(hottest) > hitsFor(s.currentTheme)) {
		return {action: 'switch', to: hottest, reason: `"${s.currentTheme}" weekly median fell ${t.fallingWeeks} weeks running and "${hottest}" competitors have more hits (${hitsFor(hottest)} vs ${hitsFor(s.currentTheme)})`, currentMedian, nextTestTheme};
	}
	return keep(falling ? 'median is falling but no candidate theme looks stronger' : 'current theme is holding up');
};

/** Own episodes worth a follow-up: at least `multiple` x the median of all mature episodes. */
export const followups = (episodes: EpisodeScore[], multiple: number): EpisodeScore[] => {
	const m = median(episodes.map((e) => e.score));
	return episodes.filter((e) => m > 0 && e.score >= multiple * m).sort((a, b) => b.score - a.score);
};

/** Reads the weekly pull request's checklist: unticked episodes and an unticked theme switch are rejected. */
export const parseChecklist = (body: string): {rejected: string[]; switchRejected: boolean} => {
	const lines = body.split('\n').map((l) => l.match(/^\s*[-*]\s*\[( |x|X)\]\s*(.+)$/)).filter((m) => m !== null);
	const unticked = lines.filter((m) => m[1] === ' ').map((m) => m[2].trim());
	return {
		rejected: unticked.map((l) => l.match(/episodes\/(\d{4}-W\d{2}\/[\w-]+)/)?.[1]).filter((x): x is string => !!x),
		switchRejected: unticked.some((l) => /^switch theme/i.test(l)),
	};
};
