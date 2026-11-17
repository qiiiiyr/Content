import {readFileSync, statSync} from 'node:fs';
import {api, env} from '../http.ts';
import type {Lang} from '../../src/types.ts';

const ID_RE = /\d+-[a-z0-9]+\.apps\.googleusercontent\.com/;

/**
 * The OAuth client from the two secrets, repairing the usual paste mistakes: the whole downloaded client JSON pasted
 * into a secret, the ID and secret swapped, or the ID buried in extra text ("Client ID: ...").
 */
export const youtubeClient = (rawId: string, rawSecret: string): {id: string; secret: string; fixes: string[]} => {
	const fixes: string[] = [];
	let [id, secret] = [rawId, rawSecret];
	for (const raw of [rawId, rawSecret]) {
		if (!raw.startsWith('{')) continue;
		try {
			const j = JSON.parse(raw);
			const c = j.web ?? j.installed ?? j;
			if (c.client_id && c.client_secret) [id, secret] = [c.client_id, c.client_secret];
			fixes.push('read the client ID and secret from a pasted client JSON file');
		} catch {}
	}
	if (ID_RE.test(secret) && !ID_RE.test(id)) {
		[id, secret] = [secret, id];
		fixes.push('YT_CLIENT_ID and YT_CLIENT_SECRET were swapped');
	}
	const m = id.match(ID_RE);
	if (m && m[0] !== id) {
		id = m[0];
		fixes.push('removed extra text around the client ID');
	}
	return {id, secret, fixes};
};

/** Access token for the EN or ID channel, from its long-lived refresh token. */
export const youtubeToken = async (lang: Lang): Promise<string> => {
	const {id, secret} = youtubeClient(env('YT_CLIENT_ID'), env('YT_CLIENT_SECRET'));
	return (
		await api('https://oauth2.googleapis.com/token', {
			method: 'POST',
			body: new URLSearchParams({client_id: id, client_secret: secret, refresh_token: env(`YT_REFRESH_TOKEN_${lang.toUpperCase()}`), grant_type: 'refresh_token'}),
		})
	).access_token;
};

const WHY: Record<string, string> = {
	invalid_client: 'Google does not know this client ID, or the secret does not belong to it. Copy both again from Google Cloud > APIs & Services > Credentials > your OAuth client (same project as the consent screen).',
	invalid_grant: 'the refresh token is revoked, expired (app still in "Testing" = 7 days) or was made with a different client. Redo it in the OAuth Playground with the same client ID and secret.',
	unauthorized_client: 'the refresh token was made with a different client ID. Redo it in the OAuth Playground with the client saved in GitHub.',
};

/** Checks the YouTube secrets without posting anything and says which one is wrong. Never prints a secret. */
export const checkYoutube = async (lang: Lang): Promise<boolean> => {
	const L = lang.toUpperCase();
	const raw = {id: process.env.YT_CLIENT_ID ?? '', secret: process.env.YT_CLIENT_SECRET ?? '', token: process.env[`YT_REFRESH_TOKEN_${L}`] ?? ''};
	if (!raw.id || !raw.secret || !raw.token) {
		console.log(`youtube ${lang}: missing ${Object.entries(raw).filter(([, v]) => !v).map(([k]) => k).join(', ')}`);
		return false;
	}
	const {id, secret, fixes} = youtubeClient(env('YT_CLIENT_ID'), env('YT_CLIENT_SECRET'));
	const token = env(`YT_REFRESH_TOKEN_${L}`);
	const ws = Object.entries(raw).filter(([, v]) => v !== v.trim()).map(([k]) => k);
	console.log(
		`youtube ${lang} secrets: client ID ${ID_RE.test(id) ? `ok, Google project ${id.split('-')[0]}` : 'NOT a client ID (should end in .apps.googleusercontent.com)'}; ` +
			`secret ${secret.length} chars${secret.startsWith('GOCSPX-') ? '' : ' (unusual: new secrets start with GOCSPX-)'}; ` +
			`refresh token ${token.length} chars${token.startsWith('1//') ? '' : ' (unusual: refresh tokens start with 1//)'}` +
			(ws.length ? `; trimmed spaces/newlines from ${ws.join(', ')}` : '') +
			(fixes.length ? `; auto-fixed: ${fixes.join(', ')}` : ''),
	);
	try {
		const access = await youtubeToken(lang);
		const ch = (await api('https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true', {headers: {Authorization: `Bearer ${access}`}})).items?.[0];
		console.log(`youtube ${lang}: login OK -> channel "${ch?.snippet?.title ?? '(no channel on this account)'}"`);
		return Boolean(ch);
	} catch (e) {
		const msg = (e as Error).message;
		const code = Object.keys(WHY).find((k) => msg.includes(`"${k}"`));
		console.log(`youtube ${lang}: login FAILED (${code ?? msg.slice(0, 200)}). ${code ? WHY[code] : ''}`);
		return false;
	}
};

export const uploadYoutube = async (file: string, lang: Lang, title: string, description: string, tags: string[]): Promise<string> => {
	const token = await youtubeToken(lang);
	const init = await fetch('https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status', {
		method: 'POST',
		headers: {Authorization: `Bearer ${token}`, 'Content-Type': 'application/json; charset=UTF-8', 'X-Upload-Content-Type': 'video/mp4', 'X-Upload-Content-Length': String(statSync(file).size)},
		body: JSON.stringify({
			snippet: {title: title.slice(0, 100), description, tags, categoryId: '28', defaultLanguage: lang, defaultAudioLanguage: lang}, // 28 = Science & Technology
			status: {privacyStatus: process.env.PRIVACY ?? 'public', selfDeclaredMadeForKids: false, containsSyntheticMedia: false},
		}),
	});
	const location = init.headers.get('location');
	if (!init.ok || !location) throw new Error(`YouTube upload init -> ${init.status}: ${await init.text()}`);
	return (await api(location, {method: 'PUT', headers: {'Content-Type': 'video/mp4'}, body: readFileSync(file)})).id;
};
