import {readFileSync, statSync} from 'node:fs';
import {api, env} from '../http.ts';
import type {Lang} from '../../src/types.ts';

/** Access token for the EN or ID channel, from its long-lived refresh token. */
export const youtubeToken = async (lang: Lang): Promise<string> =>
	(
		await api('https://oauth2.googleapis.com/token', {
			method: 'POST',
			body: new URLSearchParams({client_id: env('YT_CLIENT_ID'), client_secret: env('YT_CLIENT_SECRET'), refresh_token: env(`YT_REFRESH_TOKEN_${lang.toUpperCase()}`), grant_type: 'refresh_token'}),
		})
	).access_token;

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
