import {test} from 'node:test';
import assert from 'node:assert/strict';
import {competitorYoutube} from './stats/youtube.ts';
import {checkMeta, sceneCount} from './check.ts';
import {readMeta} from './lib.ts';
import {youtubeClient} from './post/youtube.ts';
import {igUser} from './post/instagram.ts';
import {isAuthError} from './publish.ts';

test('competitor YouTube: handle -> uploads -> view counts (recorded response shapes)', async () => {
	const replies: Record<string, unknown> = {
		'/channels': {items: [{contentDetails: {relatedPlaylists: {uploads: 'UU1'}}}]},
		'/playlistItems': {items: [{contentDetails: {videoId: 'v1'}}, {contentDetails: {videoId: 'v2'}}]},
		'/videos': {items: [{id: 'v1', snippet: {title: 'How GPS works', publishedAt: '2026-11-01T00:00:00Z'}, statistics: {viewCount: '1200'}}, {id: 'v2', snippet: {title: 'x', publishedAt: '2026-11-02T00:00:00Z'}, statistics: {}}]},
	};
	const real = globalThis.fetch;
	globalThis.fetch = (async (url: string) => new Response(JSON.stringify(replies[Object.keys(replies).find((k) => url.includes(k))!]))) as typeof fetch;
	try {
		const vs = await competitorYoutube('t', '@x', 'engines-inside', 'en');
		assert.deepEqual(vs?.map((v) => [v.title, v.views, v.url]), [['How GPS works', 1200, 'https://youtu.be/v1'], ['x', 0, 'https://youtu.be/v2']]);
		replies['/channels'] = {};
		assert.equal(await competitorYoutube('t', '@missing', 'engines-inside', 'en'), null);
	} finally {
		globalThis.fetch = real;
	}
});

test('episode validation catches the usual mistakes', () => {
	const m = readMeta('2026-W47/1-four-stroke');
	assert.deepEqual(checkMeta(m, 7, ['engines-inside']), []);
	const errs = checkMeta({...m, theme: 'nope', sources: ['x'], scenes: m.scenes.slice(0, 2)}, 7, ['engines-inside']);
	assert.ok(errs.some((e) => e.includes('themes.json')));
	assert.ok(errs.some((e) => e.includes('2 source')));
	assert.ok(errs.some((e) => e.includes('exports 7 scenes')));
	assert.equal(sceneCount('export default [A, B,\n C];'), 3);
});

test('YouTube client secrets: common paste mistakes are repaired', () => {
	const ID = '123456789012-abcdef123.apps.googleusercontent.com';
	assert.deepEqual(youtubeClient(ID, 'GOCSPX-s'), {id: ID, secret: 'GOCSPX-s', fixes: []});
	assert.deepEqual(youtubeClient('GOCSPX-s', ID).id, ID); // swapped
	assert.equal(youtubeClient(`Client ID: ${ID}`, 'GOCSPX-s').id, ID); // extra text
	const json = JSON.stringify({web: {client_id: ID, client_secret: 'GOCSPX-j'}});
	assert.deepEqual([youtubeClient(json, 'x').id, youtubeClient(json, 'x').secret], [ID, 'GOCSPX-j']); // whole JSON file
	assert.ok(isAuthError('POST https://oauth2.googleapis.com/token -> 401: {"error": "invalid_client"}'));
	assert.ok(!isAuthError('YouTube upload init -> 400: quotaExceeded'));
});

test('Instagram: a saved Facebook Page ID is resolved to the linked Instagram account', async () => {
	process.env.IG_USER_ID_EN = 'PAGE';
	process.env.IG_TOKEN_EN = 't';
	const real = globalThis.fetch;
	try {
		globalThis.fetch = (async (url: string) => new Response(url.includes('/PAGE?') ? JSON.stringify({instagram_business_account: {id: 'IG1'}}) : '{}')) as typeof fetch;
		assert.deepEqual(await igUser('en'), {user: 'IG1', token: 't', fromPage: true});
		globalThis.fetch = (async () => new Response('{"error":{"code":100}}', {status: 400})) as typeof fetch; // an Instagram ID rejects the field
		assert.deepEqual(await igUser('en'), {user: 'PAGE', token: 't', fromPage: false});
	} finally {
		globalThis.fetch = real;
	}
});
