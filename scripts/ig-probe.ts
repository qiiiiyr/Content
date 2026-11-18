// Usage: node scripts/ig-probe.ts --lang en|id <file.mp4>...
// Debugging only: uploads each file to that Instagram account's Reels upload and reports what Meta says about it.
// NEVER publishes (no media_publish call); an unpublished upload is invisible and expires after 24 hours.
import {readFileSync, statSync} from 'node:fs';
import {api} from './http.ts';
import {GRAPH, igUser} from './post/instagram.ts';
import type {Lang} from '../src/types.ts';

const lang = process.argv[process.argv.indexOf('--lang') + 1] as Lang;
const files = process.argv.slice(2).filter((a, i, all) => a !== '--lang' && all[i - 1] !== '--lang');
const {user, token} = await igUser(lang);
const show = (label: string, v: unknown) => console.log(`  ${label}: ${typeof v === 'string' ? v : JSON.stringify(v)}`.slice(0, 900));
const tryApi = (url: string, init?: RequestInit) => api(url, init).catch((e: Error) => ({failed: e.message}));
show('account', await tryApi(`${GRAPH}/${user}?fields=username,media_count&access_token=${token}`));
show('publishing limit', await tryApi(`${GRAPH}/${user}/content_publishing_limit?fields=quota_usage,config&access_token=${token}`));
for (const file of files) {
	console.log(`== ${file} (${statSync(file).size} bytes)`);
	const q = new URLSearchParams({media_type: 'REELS', upload_type: 'resumable', caption: 'upload test', access_token: token});
	const container = await tryApi(`${GRAPH}/${user}/media?${q}`, {method: 'POST'});
	show('container', container);
	if (!container.id) continue;
	// Raw fetch so the full response (status, headers, body) is visible, not only the error line.
	const res = await fetch(container.uri, {method: 'POST', headers: {Authorization: `OAuth ${token}`, offset: '0', file_size: String(statSync(file).size)}, body: readFileSync(file)});
	show('upload', `${res.status} ${await res.text()}`);
	show('upload headers', Object.fromEntries([...res.headers].filter(([k]) => /fb|error|debug|x-/i.test(k))));
	for (let i = 0; i < 18; i++) {
		const s = await tryApi(`${GRAPH}/${container.id}?fields=status_code,status&access_token=${token}`);
		if (i === 17 || s.failed || ['FINISHED', 'ERROR', 'EXPIRED'].includes(s.status_code)) {
			show('processing', s);
			break;
		}
		await new Promise((r) => setTimeout(r, 10_000));
	}
}
