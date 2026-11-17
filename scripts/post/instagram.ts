import {readFileSync, statSync} from 'node:fs';
import {api, env} from '../http.ts';
import type {Lang} from '../../src/types.ts';

export const GRAPH = 'https://graph.facebook.com/v23.0';
export const igAccount = (lang: Lang) => ({user: env(`IG_USER_ID_${lang.toUpperCase()}`), token: env(`IG_TOKEN_${lang.toUpperCase()}`)});

/**
 * The Instagram user ID to post as. If the saved ID is a Facebook Page ID (a common copy mistake), the linked Instagram
 * account is looked up from it, so the secret does not have to be exact. Only Pages answer instagram_business_account.
 */
const resolved = new Map<string, Promise<{user: string; token: string; fromPage: boolean}>>();
export const igUser = (lang: Lang): Promise<{user: string; token: string; fromPage: boolean}> => {
	const {user, token} = igAccount(lang);
	// Looked up once per run and reused, so the login check and the upload always use the same account.
	const key = `${user}:${token}`;
	if (!resolved.has(key)) {
		const p = api(`${GRAPH}/${user}?fields=instagram_business_account&access_token=${token}`).then(
			(r) => (r.instagram_business_account?.id ? {user: r.instagram_business_account.id, token, fromPage: true} : {user, token, fromPage: false}),
			(e: Error) => {
				// Only an Instagram account rejects that field, which means the saved ID is already right; anything else
				// (rate limit, network, permissions) must stop the upload, never fall back to a Page ID.
				if (/nonexisting field \(instagram_business_account\)/.test(e.message)) return {user, token, fromPage: false};
				resolved.delete(key);
				throw e;
			},
		);
		resolved.set(key, p);
	}
	return resolved.get(key)!;
};

/** Uploads the file directly (resumable), so the video never needs a public URL. */
export const uploadInstagram = async (file: string, lang: Lang, caption: string): Promise<string> => {
	const {user, token} = await igUser(lang);
	const q = new URLSearchParams({media_type: 'REELS', upload_type: 'resumable', share_to_feed: 'true', caption, access_token: token});
	const container = await api(`${GRAPH}/${user}/media?${q}`, {method: 'POST'});
	await api(container.uri, {method: 'POST', headers: {Authorization: `OAuth ${token}`, offset: '0', file_size: String(statSync(file).size)}, body: readFileSync(file)});
	for (let i = 0; i < 60; i++) {
		const {status_code, status} = await api(`${GRAPH}/${container.id}?fields=status_code,status&access_token=${token}`);
		if (status_code === 'FINISHED') return (await api(`${GRAPH}/${user}/media_publish?creation_id=${container.id}&access_token=${token}`, {method: 'POST'})).id;
		if (status_code === 'ERROR' || status_code === 'EXPIRED') throw new Error(`Instagram processing failed: ${status}`);
		await new Promise((r) => setTimeout(r, 10_000));
	}
	throw new Error('Instagram processing timed out after 10 minutes');
};

const FIX: Record<string, string> = {
	'190': 'the token is expired or invalid. Make a new Page token from an EXTENDED user token, so it never expires (docs/SETUP.md part 4B step 3, then 4C).',
	'10': 'the app lacks a permission. Add instagram_content_publish and instagram_basic and make a new token.',
	'100': 'the Instagram user ID is wrong, or this token cannot see that account. Re-run the instagram_business_account lookup with the same Page.',
};

/** Checks the Instagram secrets of one language without posting. Skips quietly when they are not set yet. Never prints a secret. */
export const checkInstagram = async (lang: Lang): Promise<boolean> => {
	const L = lang.toUpperCase();
	if (!process.env[`IG_USER_ID_${L}`] && !process.env[`IG_TOKEN_${L}`]) {
		console.log(`instagram ${lang}: not set up yet (skipped)`);
		return true;
	}
	try {
		const {user, token, fromPage} = await igUser(lang);
		const r = await api(`${GRAPH}/${user}?fields=username,media_count&access_token=${token}`);
		// A Page token made from a short-lived user token dies within hours; one made from an extended token never expires.
		// Meta may refuse debug_token for a Page token; then the expiry is unknown and the check does not block posting.
		const exp: number | null = await api(`${GRAPH}/debug_token?input_token=${token}&access_token=${token}`).then((d) => d.data?.expires_at ?? 0, () => null);
		const hours = exp ? (exp * 1000 - Date.now()) / 3_600_000 : Infinity;
		console.log(`instagram ${lang}: login OK -> @${r.username} (${r.media_count} posts); token ${exp === null ? 'expiry unknown' : exp ? `EXPIRES in ${Math.max(0, Math.round(hours))} h` : 'never expires'}${fromPage ? `; IG_USER_ID_${L} holds the Facebook Page ID, found the linked Instagram account automatically (you can leave it)` : ''}`);
		if (hours < 7 * 24) console.log(`instagram ${lang}: token FAILS soon. ${FIX['190']}`);
		return hours >= 7 * 24;
	} catch (e) {
		const msg = (e as Error).message;
		const code = msg.match(/"code":\s*(\d+)/)?.[1];
		if (/nonexisting field \(media_count\)/.test(msg)) {
			console.log(`instagram ${lang}: login FAILED. IG_USER_ID_${L} is not an Instagram account, most likely it is the Facebook Page ID. Use the id inside instagram_business_account (docs/SETUP.md part 4C step 2).`);
			return false;
		}
		console.log(`instagram ${lang}: login FAILED (${msg.slice(0, 160)}). ${code ? (FIX[code] ?? '') : ''}`);
		return false;
	}
};
