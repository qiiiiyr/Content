// Usage: node scripts/analyze.ts   (read-only; prints JSON lines for a deep look at what each post gets and from where)
// YouTube: per-video watch numbers, viewer countries and traffic sources. Instagram: every insight Meta gives per Reel,
// and the audience breakdowns it will release (those need about 100 engaged accounts first).
import {api} from './http.ts';
import {readJson} from './lib.ts';
import {youtubeToken} from './post/youtube.ts';
import {GRAPH, igUser} from './post/instagram.ts';
import type {Posted} from './publish.ts';
import type {Lang} from '../src/types.ts';

const out = (what: string, data: unknown) => console.log(JSON.stringify({what, data}));
const safe = async (what: string, f: () => Promise<unknown>) => out(what, await f().catch((e: Error) => ({failed: e.message.slice(0, 300)})));
const posted = readJson<Posted[]>('state/posted.json', []).filter((p) => !p.error);
const today = new Date().toISOString().slice(0, 10);

for (const lang of ['en', 'id'] as Lang[]) {
	const token = await youtubeToken(lang);
	const h = {headers: {Authorization: `Bearer ${token}`}};
	const report = (metrics: string, dimensions: string, extra: Record<string, string> = {}) =>
		api(`https://youtubeanalytics.googleapis.com/v2/reports?${new URLSearchParams({ids: 'channel==MINE', startDate: '2026-11-01', endDate: today, metrics, dimensions, ...extra})}`, h).then((r) => ({columns: r.columnHeaders?.map((c: any) => c.name), rows: r.rows}));
	const ids = posted.filter((p) => p.lang === lang && p.platform === 'youtube').map((p) => p.mediaId);
	await safe(`${lang} youtube live stats`, async () => (await api(`https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics,contentDetails,status&id=${ids.join(',')}`, h)).items?.map((v: any) => ({id: v.id, title: v.snippet.title, published: v.snippet.publishedAt, duration: v.contentDetails.duration, lang: v.snippet.defaultAudioLanguage ?? v.snippet.defaultLanguage, ...v.status, ...v.statistics})));
	await safe(`${lang} youtube per video`, () => report('views,engagedViews,estimatedMinutesWatched,averageViewDuration,averageViewPercentage,likes,shares,subscribersGained', 'video', {sort: '-views', maxResults: '50'}));
	await safe(`${lang} youtube countries`, () => report('views,averageViewPercentage', 'country', {sort: '-views', maxResults: '15'}));
	await safe(`${lang} youtube traffic sources`, () => report('views', 'insightTrafficSourceType', {sort: '-views'}));
	await safe(`${lang} youtube age and gender`, () => report('viewerPercentage', 'ageGroup,gender'));

	const {user, token: igToken} = await igUser(lang);
	await safe(`${lang} instagram account`, () => api(`${GRAPH}/${user}?fields=username,followers_count,follows_count,media_count&access_token=${igToken}`));
	const metrics = ['views', 'reach', 'likes', 'comments', 'shares', 'saved', 'total_interactions', 'ig_reels_avg_watch_time', 'ig_reels_video_view_total_time'];
	for (const p of posted.filter((x) => x.lang === lang && x.platform === 'instagram')) {
		await safe(`${lang} instagram reel ${p.id}`, async () => {
			const m = await api(`${GRAPH}/${p.mediaId}?fields=timestamp,permalink,like_count,comments_count&access_token=${igToken}`);
			const ins: Record<string, unknown> = {};
			for (const metric of metrics) ins[metric] = await api(`${GRAPH}/${p.mediaId}/insights?metric=${metric}&access_token=${igToken}`).then((r) => r.data?.[0]?.values?.[0]?.value ?? r.data?.[0]?.total_value?.value, (e: Error) => `n/a: ${e.message.slice(0, 120)}`);
			return {...m, ...ins};
		});
	}
	for (const breakdown of ['country', 'age,gender']) await safe(`${lang} instagram reached audience by ${breakdown}`, () => api(`${GRAPH}/${user}/insights?metric=reached_audience_demographics&period=lifetime&timeframe=this_week&metric_type=total_value&breakdown=${breakdown}&access_token=${igToken}`));
	await safe(`${lang} instagram account reach and views (days)`, () => api(`${GRAPH}/${user}/insights?metric=reach,views,profile_views,accounts_engaged&period=day&metric_type=total_value&access_token=${igToken}`));
}
