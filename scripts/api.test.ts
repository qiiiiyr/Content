import {test} from 'node:test';
import assert from 'node:assert/strict';
import {competitorYoutube} from './stats/youtube.ts';
import {checkMeta, sceneCount} from './check.ts';
import {readMeta} from './lib.ts';
import {youtubeClient} from './post/youtube.ts';
import {igUser, instagramCopy, publish, uploadInstagram} from './post/instagram.ts';
import {execFileSync} from 'node:child_process';
import {mkdtempSync, readFileSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {isAuthError} from './publish.ts';
import {api} from './http.ts';

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
	assert.ok(isAuthError('YouTube upload init -> 403: {"error":{"errors":[{"reason":"quotaExceeded"}]}}')); // resets daily: stay queued
	assert.ok(!isAuthError('YouTube upload init -> 400: invalidTitle'));
	assert.ok(isAuthError('GET https://graph.facebook.com/v23.0/1 -> 400: {"error":{"type":"OAuthException","code":190}}'));
	assert.ok(isAuthError('POST https://rupload.facebook.com/ig-api-upload/v27.0/1 -> 400: {"debug_info":{"type":"ProcessingFailedError"}}'));
	assert.ok(!isAuthError('POST https://graph.facebook.com/v23.0/1/media -> 400: {"error":{"message":"aspect ratio","type":"OAuthException","code":36003}}'));
	assert.ok(isAuthError('POST https://graph.facebook.com/v23.0/1/media -> 403: {"error":{"type":"OAuthException","code":10}}')); // permission
	assert.ok(isAuthError('POST https://graph.facebook.com/v23.0/1/media -> 400: {"error":{"type":"OAuthException","code":613}}')); // rate limit
	assert.ok(!isAuthError('POST https://graph.facebook.com/v23.0/1/media -> 400: {"error":{"type":"OAuthException","code":2207026}}')); // video format
	assert.ok(isAuthError('POST https://graph.facebook.com/v23.0/1/media -> network error: fetch failed (other side closed)')); // retried tomorrow
});

test('a dropped connection is retried on a new one', async () => {
	const real = globalThis.fetch;
	let calls = 0;
	globalThis.fetch = (async () => {
		if (++calls === 1) throw new TypeError('fetch failed', {cause: new Error('other side closed')});
		return new Response('{"ok":1}');
	}) as typeof fetch;
	try {
		assert.deepEqual(await api('https://x.test/a'), {ok: 1});
		assert.equal(calls, 2);
	} finally {
		globalThis.fetch = real;
	}
});

test('Instagram: a saved Facebook Page ID is resolved to the linked Instagram account', async () => {
	process.env.IG_USER_ID_EN = 'PAGE';
	process.env.IG_TOKEN_EN = 't';
	const real = globalThis.fetch;
	try {
		globalThis.fetch = (async (url: string) => new Response(url.includes('/PAGE?') ? JSON.stringify({instagram_business_account: {id: 'IG1'}}) : '{}')) as typeof fetch;
		assert.deepEqual(await igUser('en'), {user: 'IG1', token: 't', fromPage: true});
		process.env.IG_USER_ID_EN = 'IG2'; // an Instagram ID rejects the field: kept as is
		globalThis.fetch = (async () => new Response('{"error":{"message":"(#100) Tried accessing nonexisting field (instagram_business_account)","code":100}}', {status: 400})) as typeof fetch;
		assert.deepEqual(await igUser('en'), {user: 'IG2', token: 't', fromPage: false});
		process.env.IG_USER_ID_EN = 'PAGE2'; // any other failure stops, never falls back to the saved Page ID
		globalThis.fetch = (async () => new Response('{"error":{"message":"rate limit","code":4}}', {status: 400})) as typeof fetch;
		await assert.rejects(igUser('en'), /rate limit/);
	} finally {
		globalThis.fetch = real;
	}
});

test('the Instagram copy meets the Reels spec: audio at most 128 kbps, no edit lists', () => {
	const dir = mkdtempSync(join(tmpdir(), 'ig-'));
	const src = join(dir, 'x.mp4');
	// A 2-second clip with 320 kbps audio, like our renders.
	execFileSync('ffmpeg', ['-v', 'error', '-f', 'lavfi', '-i', 'testsrc=size=720x1280:rate=30:duration=2', '-f', 'lavfi', '-i', 'sine=duration=2', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '320k', '-shortest', src]);
	const out = instagramCopy(src);
	assert.equal(out, join(dir, 'x.ig.mp4'));
	const rate = Number(execFileSync('ffprobe', ['-v', 'error', '-select_streams', 'a', '-show_entries', 'stream=bit_rate', '-of', 'csv=p=0', out]).toString());
	assert.ok(rate <= 130_000, `audio ${rate} bps`);
	assert.ok(!readFileSync(out).includes('elst'));
});

test('Instagram: a refused direct upload falls back to Instagram fetching the public link', async () => {
	const dir = mkdtempSync(join(tmpdir(), 'igu-'));
	const file = join(dir, 'x.mp4');
	writeFileSync(file, 'not a video'); // ffmpeg fails on it, so the original is sent: fine for this test
	const calls: string[] = [];
	const real = globalThis.fetch;
	const env = {...process.env};
	Object.assign(process.env, {IG_USER_ID_ID: '17841400000000000', IG_TOKEN_ID: 'tok'});
	globalThis.fetch = (async (url: string, init?: RequestInit) => {
		calls.push(`${init?.method ?? 'GET'} ${url}`);
		const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {status});
		if (url.includes('fields=instagram_business_account')) return json({error: {message: 'nonexisting field (instagram_business_account)'}}, 400);
		if (url.includes('rupload')) return json({debug_info: {retriable: false, type: 'ProcessingFailedError', message: 'Request processing failed'}}, 400);
		if (url.includes('/media?') && url.includes('upload_type=resumable')) return json({id: 'c1', uri: 'https://rupload.facebook.com/ig-api-upload/v27.0/c1'});
		if (url.includes('/media?') && url.includes('video_url=')) return json({id: 'c2'});
		if (url.includes('/c2?fields=status_code')) return json({status_code: 'FINISHED', status: 'Finished'});
		if (url.includes('media_publish?creation_id=c2')) return json({id: 'posted-1'});
		return json({error: {message: `unexpected ${url}`}}, 500);
	}) as typeof fetch;
	try {
		assert.equal(await uploadInstagram(file, 'id', 'caption', 'https://github.com/o/r/releases/download/videos/x.mp4'), 'posted-1');
		assert.ok(calls.some((c) => c.includes('video_url=https%3A%2F%2Fgithub.com%2Fo%2Fr%2Freleases%2Fdownload%2Fvideos%2Fx.mp4')));
		// without a public link the refusal is passed on (the episode stays queued)
		await assert.rejects(uploadInstagram(file, 'id', 'caption'), /ProcessingFailedError/);
	} finally {
		globalThis.fetch = real;
		process.env = env;
	}
});

test('Instagram publish is sent once; a lost answer after it went out still finds the live post', async () => {
	const real = globalThis.fetch;
	let publishCalls = 0;
	let status = 'PUBLISHED';
	globalThis.fetch = (async (url: string) => {
		const json = (body: unknown, code = 200) => new Response(JSON.stringify(body), {status: code});
		if (url.includes('media_publish')) {
			publishCalls++;
			throw new TypeError('fetch failed'); // the connection drops before the answer arrives
		}
		if (url.includes('fields=status_code')) return json({status_code: status});
		if (url.includes('/media?fields=id&limit=1')) return json({data: [{id: 'live-1'}]});
		return json({error: {message: 'unexpected'}}, 500);
	}) as typeof fetch;
	try {
		assert.equal(await publish('u1', 'tok', 'c9'), 'live-1');
		assert.equal(publishCalls, 1); // never sent twice
		status = 'FINISHED'; // not published: the failure stands, so the episode stays queued (network error)
		await assert.rejects(publish('u1', 'tok', 'c9'), /network error/);
	} finally {
		globalThis.fetch = real;
	}
});
