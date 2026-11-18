// Daily: our channel totals and per-post numbers for YouTube and Instagram, in one file the dashboard reads.
// Writes data/snapshot.json: {at, channels, posts, history}. Usage: node scripts/snapshot.ts
import {existsSync, mkdirSync, writeFileSync} from 'node:fs';
import {LANGS, readJson, readMeta} from './lib.ts';
import {api} from './http.ts';
import {youtubeToken} from './post/youtube.ts';
import {GRAPH, igUser} from './post/instagram.ts';
import {ownInstagram} from './stats/instagram.ts';
import type {Posted} from './publish.ts';
import type {Lang} from '../src/types.ts';

const YT = 'https://www.googleapis.com/youtube/v3';
type Channel = {lang: Lang; platform: string; name: string; followers: number; views: number; posts: number};
type Post = {id: string; title: string; lang: Lang; platform: string; url: string; postedAt: string; views: number; likes: number; comments: number; reach?: number; saves?: number; shares?: number};
type Row = {date: string; lang: Lang; platform: string; followers: number; views: number};

/** One account's numbers. A failing platform is reported and left out, so the other still updates. */
const safe = async <T>(what: string, f: () => Promise<T>): Promise<T | undefined> => f().catch((e) => (console.warn(`${what}: ${e.message.slice(0, 300)}`), undefined));

export const youtubeNumbers = async (lang: Lang, ids: string[]) => {
	const h = {headers: {Authorization: `Bearer ${await youtubeToken(lang)}`}};
	const ch = (await api(`${YT}/channels?part=snippet,statistics&mine=true`, h)).items?.[0];
	if (!ch) throw new Error('no YouTube channel for this login');
	const videos = ids.length ? (await api(`${YT}/videos?part=statistics&id=${ids.join(',')}`, h)).items ?? [] : [];
	return {
		channel: {name: ch.snippet.title, followers: Number(ch.statistics.subscriberCount ?? 0), views: Math.max(Number(ch.statistics.viewCount ?? 0), [...videos].reduce((t: number, v: any) => t + Number(v.statistics.viewCount ?? 0), 0)), posts: Number(ch.statistics.videoCount ?? 0)},
		videos: new Map<string, {views: number; likes: number; comments: number}>(videos.map((v: any) => [v.id, {views: Number(v.statistics.viewCount ?? 0), likes: Number(v.statistics.likeCount ?? 0), comments: Number(v.statistics.commentCount ?? 0)}])),
	};
};

export const instagramNumbers = async (lang: Lang, mediaIds: string[]) => {
	const {user, token} = await igUser(lang);
	const a = await api(`${GRAPH}/${user}?fields=username,followers_count,media_count&access_token=${token}`);
	const media = new Map<string, {likes: number; comments: number; url: string; views: number; reach: number; saves: number; shares: number}>();
	for (const id of mediaIds) {
		const m = await api(`${GRAPH}/${id}?fields=like_count,comments_count,permalink&access_token=${token}`);
		const s = await safe(`instagram insights ${id}`, () => ownInstagram(lang, id));
		media.set(id, {likes: m.like_count ?? 0, comments: m.comments_count ?? 0, url: m.permalink ?? '', views: s?.views ?? 0, reach: s?.reach ?? 0, saves: s?.saved ?? 0, shares: s?.shares ?? 0});
	}
	// Instagram has no total-views number for an account, so the views column is the sum over our Reels.
	return {channel: {name: `@${a.username}`, followers: a.followers_count ?? 0, views: [...media.values()].reduce((t, m) => t + m.views, 0), posts: a.media_count ?? 0}, media};
};

// test uploads of episodes that no longer exist are not part of the series, so they stay out of the numbers
const posted = readJson<Posted[]>('state/posted.json', []).filter((p) => !p.error && existsSync(`episodes/${p.id}/meta.json`));
const channels: Channel[] = [];
const posts: Post[] = [];
for (const lang of LANGS) {
	const mine = (platform: string) => posted.filter((p) => p.lang === lang && p.platform === platform);
	const title = (p: Posted) => {
		try {
			return readMeta(p.id).title[lang].replace(/ #shorts$/i, '');
		} catch {
			return p.id; // a test upload whose episode folder is gone
		}
	};
	const yt = await safe(`youtube ${lang}`, () => youtubeNumbers(lang, mine('youtube').map((p) => p.mediaId)));
	if (yt) {
		channels.push({lang, platform: 'youtube', ...yt.channel});
		for (const p of mine('youtube')) {
			const v = yt.videos.get(p.mediaId);
			if (v) posts.push({id: p.id, title: title(p), lang, platform: 'youtube', url: `https://youtu.be/${p.mediaId}`, postedAt: p.postedAt, ...v});
		}
	}
	const ig = await safe(`instagram ${lang}`, () => instagramNumbers(lang, mine('instagram').map((p) => p.mediaId)));
	if (ig) {
		channels.push({lang, platform: 'instagram', ...ig.channel});
		for (const p of mine('instagram')) {
			const m = ig.media.get(p.mediaId)!;
			posts.push({id: p.id, title: title(p), lang, platform: 'instagram', url: m.url, postedAt: p.postedAt, views: m.views, likes: m.likes, comments: m.comments, reach: m.reach, saves: m.saves, shares: m.shares});
		}
	}
}

// One row per account per day, kept for 120 days: the dashboard draws its growth line from this.
const date = new Date().toISOString().slice(0, 10);
const old = readJson<{history: Row[]}>('data/snapshot.json', {history: []}).history;
const history = [...old.filter((r) => r.date !== date || !channels.some((c) => c.lang === r.lang && c.platform === r.platform)), ...channels.map((c) => ({date, lang: c.lang, platform: c.platform, followers: c.followers, views: c.views}))].sort((a, b) => a.date.localeCompare(b.date)).slice(-120 * 4);

mkdirSync('data', {recursive: true});
writeFileSync('data/snapshot.json', JSON.stringify({at: new Date().toISOString(), channels, posts, history}, null, 1) + '\n');
console.log(`data/snapshot.json: ${channels.length}/4 accounts, ${posts.length} posts`);
if (channels.length < 4) process.exitCode = 1; // the file is still written; a red run tells you a login needs fixing
