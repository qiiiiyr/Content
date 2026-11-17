import {readFileSync, statSync} from 'node:fs';
import {api, env} from '../http.ts';
import type {Lang} from '../../src/types.ts';

export const GRAPH = 'https://graph.facebook.com/v23.0';
export const igAccount = (lang: Lang) => ({user: env(`IG_USER_ID_${lang.toUpperCase()}`), token: env(`IG_TOKEN_${lang.toUpperCase()}`)});

/** Uploads the file directly (resumable), so the video never needs a public URL. */
export const uploadInstagram = async (file: string, lang: Lang, caption: string): Promise<string> => {
	const {user, token} = igAccount(lang);
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
	'190': 'the token is expired or invalid. Make a new Page token (docs/SETUP.md, Instagram part C).',
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
		const {user, token} = igAccount(lang);
		const r = await api(`${GRAPH}/${user}?fields=username,account_type&access_token=${token}`);
		console.log(`instagram ${lang}: login OK -> @${r.username} (${r.account_type ?? 'account'})`);
		return true;
	} catch (e) {
		const msg = (e as Error).message;
		const code = msg.match(/"code":\s*(\d+)/)?.[1];
		console.log(`instagram ${lang}: login FAILED (${msg.slice(0, 160)}). ${code ? (FIX[code] ?? '') : ''}`);
		return false;
	}
};
