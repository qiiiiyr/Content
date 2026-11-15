import {api} from '../http.ts';
import {youtubeToken} from '../post/youtube.ts';
import type {Lang} from '../../src/types.ts';
import type {CompetitorVideo} from '../review.ts';

const YT = 'https://www.googleapis.com/youtube/v3';

/** views, average % watched and subscribers gained for every video on the EN or ID channel. */
export const ownYoutube = async (lang: Lang): Promise<Record<string, {views: number; avgViewPct: number; subsGained: number}>> => {
	const token = await youtubeToken(lang);
	const rows: [string, number, number, number][] = [];
	for (let startIndex = 1; ; startIndex += 200) {
		const q = new URLSearchParams({ids: 'channel==MINE', startDate: '2020-01-01', endDate: new Date().toISOString().slice(0, 10), metrics: 'views,averageViewPercentage,subscribersGained', dimensions: 'video', sort: '-views', maxResults: '200', startIndex: String(startIndex)});
		const page = (await api(`https://youtubeanalytics.googleapis.com/v2/reports?${q}`, {headers: {Authorization: `Bearer ${token}`}})).rows ?? [];
		rows.push(...page);
		if (page.length < 200) break;
	}
	return Object.fromEntries(rows.map(([id, views, avgViewPct, subsGained]) => [id, {views, avgViewPct, subsGained}]));
};

/** The latest ~50 uploads of a competitor channel, by @handle. Returns null if the handle does not exist. */
export const competitorYoutube = async (token: string, handle: string, theme: string, lang: string): Promise<CompetitorVideo[] | null> => {
	const h = {headers: {Authorization: `Bearer ${token}`}};
	const ch = (await api(`${YT}/channels?part=contentDetails&forHandle=${encodeURIComponent(handle)}`, h)).items?.[0];
	if (!ch) return null;
	const items = (await api(`${YT}/playlistItems?part=contentDetails&maxResults=50&playlistId=${ch.contentDetails.relatedPlaylists.uploads}`, h)).items ?? [];
	if (!items.length) return [];
	const videos = (await api(`${YT}/videos?part=snippet,statistics&id=${items.map((i: any) => i.contentDetails.videoId).join(',')}`, h)).items ?? [];
	return videos.map((v: any) => ({theme, platform: 'youtube', lang, account: handle, title: v.snippet.title, url: `https://youtu.be/${v.id}`, views: Number(v.statistics.viewCount ?? 0), publishedAt: v.snippet.publishedAt}));
};
