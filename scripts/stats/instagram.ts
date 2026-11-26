import {api} from '../http.ts';
import {GRAPH, igAccount, igUser} from '../post/instagram.ts';
import type {Lang} from '../../src/types.ts';
import type {CompetitorVideo} from '../review.ts';

/** views, reach, saves, shares and average watch time (ms) for one of our Reels. */
export const ownInstagram = async (lang: Lang, mediaId: string): Promise<Record<string, number>> => {
	const {token} = igAccount(lang);
	const {data} = await api(`${GRAPH}/${mediaId}/insights?metric=views,reach,saved,shares,ig_reels_avg_watch_time&access_token=${token}`);
	return Object.fromEntries(data.map((d: any) => [d.name, d.values?.[0]?.value ?? d.total_value?.value ?? 0]));
};

/** A competitor's latest posts via business_discovery (Business/Creator accounts only). Likes stand in for views,
 * which this endpoint does not return. Returns null if the account is not found or not a professional account. */
let me: ReturnType<typeof igUser> | undefined; // our account, looked up once per run

export const competitorInstagram = async (username: string, theme: string, lang: string): Promise<CompetitorVideo[] | null> => {
	const {user, token} = await (me ??= igUser('en'));
	const fields = `business_discovery.username(${username}){media.limit(50){caption,like_count,comments_count,timestamp,permalink,thumbnail_url,media_url}}`;
	try {
		const res = await api(`${GRAPH}/${user}?fields=${encodeURIComponent(fields)}&access_token=${token}`);
		return (res.business_discovery?.media?.data ?? []).map((m: any) => ({theme, platform: 'instagram', lang, account: username, title: [...(m.caption ?? '').split('\n')[0]].slice(0, 120).join('') /* whole characters: never half an emoji */, url: m.permalink, views: m.like_count ?? 0, publishedAt: m.timestamp, likes: m.like_count ?? 0, comments: m.comments_count ?? 0, thumb: m.thumbnail_url ?? m.media_url}));
	} catch (e) {
		console.warn(`instagram @${username}: ${(e as Error).message.slice(0, 200)}`);
		return null;
	}
};
