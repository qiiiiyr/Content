import {test} from 'node:test';
import assert from 'node:assert/strict';
import {decide, findHits, followups, isoWeek, median, parseChecklist, untick, type EpisodeScore, type Strategy} from './review.ts';
import {duePlatforms, mergePosted, missingSecrets, nextToPost} from './publish.ts';
import {missedYesterday, queueDays} from './health.ts';
import {ramp} from '../src/motion.ts';
import {voiceFor} from './build.ts';

const now = new Date('2026-12-20T00:00:00Z');
const strategy: Strategy = {
	currentTheme: 'a',
	themeSince: '2026-11-01',
	testTheme: 'b',
	thresholds: {minWeeksOnTheme: 4, minTestEpisodes: 4, switchRatio: 1.5, fallingWeeks: 3, hitMultiple: 3, hitWindowDays: 30, followupMultiple: 2, minAgeDays: 3},
	lessons: [],
};
const ep = (theme: string, score: number, postedAt: string, i = 0, test = theme !== 'a'): EpisodeScore => ({id: `${theme}${score}${i}`, theme, test, postedAt, score, frozen: true});

test('median and iso week', () => {
	assert.equal(median([]), 0);
	assert.equal(median([3, 1, 2]), 2);
	assert.equal(median([4, 1, 2, 3]), 2.5);
	assert.equal(isoWeek(new Date('2026-11-15')), '2026-W46');
	assert.equal(isoWeek(new Date('2027-01-01')), '2026-W53');
});

test('hits: 3x the channel median, inside the window', () => {
	const v = (views: number, publishedAt = '2026-12-10') => ({theme: 'a', platform: 'youtube', lang: 'en', account: 'x', title: '', url: '', views, publishedAt});
	const hits = findHits([v(100), v(100), v(120), v(400), v(900, '2026-10-01')], 3, 30, now);
	assert.deepEqual(hits.map((h) => h.views), [400]);
});

test('hits carry engagement (likes + comments per view) on YouTube only', () => {
	const v = (platform: string, views: number) => ({theme: 'a', platform, lang: 'en', account: platform, title: '', url: '', views, publishedAt: '2026-12-10', likes: views / 10, comments: views / 100});
	const hits = findHits([v('youtube', 100), v('youtube', 100), v('youtube', 1000), v('instagram', 10), v('instagram', 10), v('instagram', 100)], 3, 30, now);
	assert.deepEqual(hits.map((h) => [h.platform, h.engagement]), [['youtube', 11], ['instagram', undefined]]);
});

test('keeps a young theme even when a candidate is far ahead', () => {
	const young = {...strategy, themeSince: '2026-12-01'};
	const eps = [ep('a', 10, '2026-12-05'), ...[1, 2, 3, 4].map((i) => ep('b', 1000, '2026-12-05', i))];
	assert.equal(decide(eps, [], ['a', 'b'], young, now).action, 'keep');
});

test('switches when 4+ test episodes beat the current median by 1.5x', () => {
	const eps = [...[1, 2, 3].map((i) => ep('a', 100, '2026-12-01', i)), ...[1, 2, 3, 4].map((i) => ep('b', 160, '2026-12-01', i))];
	const d = decide(eps, [], ['a', 'b', 'c'], strategy, now);
	assert.equal(d.action, 'switch');
	assert.equal(d.to, 'b');
	assert.equal(d.nextTestTheme, 'c'); // least tested
	// 3 test episodes are not enough, and 1.4x is not enough
	assert.equal(decide(eps.slice(0, 6), [], ['a', 'b'], strategy, now).action, 'keep');
	assert.equal(decide([...eps.slice(0, 3), ...[1, 2, 3, 4].map((i) => ep('b', 140, '2026-12-01', i))], [], ['a', 'b'], strategy, now).action, 'keep');
});

test('switches on 3 falling weeks only if a candidate has more competitor hits', () => {
	const eps = [ep('a', 400, '2026-11-17'), ep('a', 300, '2026-11-24'), ep('a', 200, '2026-12-01'), ep('a', 100, '2026-12-08')];
	const hit = (theme: string) => ({theme, platform: 'youtube', lang: 'en', account: 'x', title: '', url: '', views: 1, publishedAt: '', multiple: 3});
	assert.equal(decide(eps, [], ['a', 'c'], strategy, now).action, 'keep');
	const d = decide(eps, [hit('c'), hit('c')], ['a', 'c'], strategy, now);
	assert.deepEqual([d.action, d.to], ['switch', 'c']);
	// not falling every week -> keep
	const bumpy = [ep('a', 400, '2026-11-17'), ep('a', 100, '2026-11-24'), ep('a', 200, '2026-12-01'), ep('a', 50, '2026-12-08')];
	assert.equal(decide(bumpy, [hit('c')], ['a', 'c'], strategy, now).action, 'keep');
});

test('ignores scores that are not frozen yet', () => {
	const eps = [ep('a', 100, '2026-12-01'), ...[1, 2, 3, 4].map((i) => ({...ep('b', 1000, '2026-12-19', i), frozen: false}))];
	assert.equal(decide(eps, [], ['a', 'b'], strategy, now).action, 'keep');
});

test('after a switch, the old theme regular episodes are not counted as tests (no switch back)', () => {
	const old = [1, 2, 3, 4, 5].map((i) => ep('a', 900, '2026-10-01', i, false)); // A was the main theme before
	const eps = [...old, ...[1, 2, 3].map((i) => ep('b', 100, '2026-12-01', i, false))];
	assert.equal(decide(eps, [], ['a', 'b'], {...strategy, currentTheme: 'b'}, now).action, 'keep');
});

test('the next test theme is never the theme being switched to', () => {
	const hit = (theme: string) => ({theme, platform: 'youtube', lang: 'en', account: 'x', title: '', url: '', views: 1, publishedAt: '', multiple: 3});
	const eps = [ep('a', 400, '2026-11-17'), ep('a', 300, '2026-11-24'), ep('a', 200, '2026-12-01'), ep('a', 100, '2026-12-08'), ep('b', 50, '2026-12-01')];
	const d = decide(eps, [hit('c')], ['a', 'b', 'c'], strategy, now); // c: hottest and least tested
	assert.deepEqual([d.action, d.to, d.nextTestTheme], ['switch', 'c', 'b']);
});

test('follow-ups are 2x the median of mature episodes; young ones do not drag the median down', () => {
	assert.deepEqual(followups([ep('a', 10, ''), ep('a', 10, ''), ep('a', 30, '')], 2).map((e) => e.score), [30]);
	const young = [1, 2, 3, 4].map((i) => ({...ep('a', 1, '', i), frozen: false}));
	assert.deepEqual(followups([ep('a', 1000, '', 1), ep('a', 1000, '', 2), ep('a', 1000, '', 3), ...young], 2), []);
});

test('checklist parsing', () => {
	const body = `## Episodes\n- [x] episodes/2026-W48/1-gps — How GPS works\n- [ ] episodes/2026-W48/2-qr-codes — QR codes\n* [X] episodes/2026-W48/3-ssd\n\n- [ ] Switch theme to "internet" from next week`;
	assert.deepEqual(parseChecklist(body), {rejected: ['2026-W48/2-qr-codes'], switchRejected: true});
	assert.deepEqual(parseChecklist('- [x] Switch theme to "ai"'), {rejected: [], switchRejected: false});
});

test('posting queue: oldest unposted episode per language, only missing platforms', () => {
	const ids = ['2026-W47/1-wifi', '2026-W47/2-gps'];
	const posted = [
		{id: '2026-W47/1-wifi', lang: 'en' as const, platform: 'youtube' as const, mediaId: 'y', postedAt: ''},
		{id: '2026-W47/1-wifi', lang: 'en' as const, platform: 'instagram' as const, mediaId: 'i', postedAt: ''},
		{id: '2026-W47/1-wifi', lang: 'id' as const, platform: 'youtube' as const, mediaId: 'y2', postedAt: ''},
	];
	assert.deepEqual(nextToPost(ids, posted, 'en'), {id: '2026-W47/2-gps', platforms: ['youtube', 'instagram']});
	assert.deepEqual(nextToPost(ids, posted, 'id'), {id: '2026-W47/1-wifi', platforms: ['instagram']});
	assert.equal(nextToPost(ids.slice(0, 1), posted.slice(0, 2), 'en'), null);
	// a failed upload is recorded, so the queue moves on instead of retrying it forever
	const failed = [...posted, {id: '2026-W47/1-wifi', lang: 'id' as const, platform: 'instagram' as const, mediaId: '', postedAt: '', error: 'ERROR'}];
	assert.deepEqual(nextToPost(ids, failed, 'id'), {id: '2026-W47/2-gps', platforms: ['youtube', 'instagram']});
	// each platform has its own place: an Instagram-only run skips past episodes Instagram already has
	assert.deepEqual(nextToPost(ids, posted, 'id', (_, p) => p === 'youtube'), {id: '2026-W47/2-gps', platforms: ['youtube']});
	assert.deepEqual(nextToPost(ids, posted, 'en', (id, p) => !(p === 'youtube' && id.endsWith('gps'))), {id: '2026-W47/2-gps', platforms: ['instagram']});
});

test('dashboard decisions untick exactly the rejected lines, and parse back the same', () => {
	const body = 'Report: reports/2026-W48.md\n## Episodes\n- [x] episodes/2026-W49/1-abs — ABS (a)\n- [x] episodes/2026-W49/2-abs-2 — B (a)\n## Theme\n- [x] Switch theme to "b" from 2026-12-07';
	const out = untick(body, ['2026-W49/1-abs'], true);
	assert.deepEqual(parseChecklist(out), {rejected: ['2026-W49/1-abs'], switchRejected: true});
	assert.equal(untick(body, [], false), body);
});

test('saving posts merges with what another run saved meanwhile', () => {
	const a = {id: 'w/1', lang: 'id' as const, platform: 'instagram' as const, mediaId: 'a', postedAt: ''};
	const b = {id: 'w/1', lang: 'id' as const, platform: 'youtube' as const, mediaId: 'b', postedAt: ''};
	assert.deepEqual(mergePosted([a], [a, b]), [a, b]);
	assert.deepEqual(mergePosted([a, b], [a]), [a, b]);
});

test('hourly run posts what is due today and catches up missed slots', () => {
	const ig = (postedAt: string) => ({id: 'w/1', lang: 'id' as const, platform: 'instagram' as const, mediaId: 'x', postedAt});
	assert.deepEqual(duePlatforms([], 'id', new Date('2026-11-19T04:00:00Z')), []);
	assert.deepEqual(duePlatforms([], 'id', new Date('2026-11-19T05:41:00Z')), ['instagram']);
	assert.deepEqual(duePlatforms([ig('2026-11-19T05:41:10Z')], 'id', new Date('2026-11-19T06:41:00Z')), []);
	// both slots passed, one post made: Instagram still owes one; YouTube owes its one
	assert.deepEqual(duePlatforms([ig('2026-11-19T05:41:10Z')], 'id', new Date('2026-11-19T12:41:00Z')), ['youtube', 'instagram']);
	// yesterday's posts do not count for today
	assert.deepEqual(duePlatforms([ig('2026-11-18T12:41:00Z')], 'id', new Date('2026-11-19T05:41:00Z')), ['instagram']);
	// days are the audience's: a New York slot caught up at 00:24 UTC still belongs to the day before
	const en = (platform: 'youtube' | 'instagram', postedAt: string) => ({id: 'x', lang: 'en' as const, platform, mediaId: 'm', postedAt});
	assert.deepEqual(duePlatforms([en('youtube', '2026-11-19T00:24:00Z')], 'en', new Date('2026-11-19T17:30:00Z')), ['youtube', 'instagram']);
	assert.deepEqual(duePlatforms([en('youtube', '2026-11-19T17:30:00Z'), en('instagram', '2026-11-19T17:31:00Z')], 'en', new Date('2026-11-19T23:41:00Z')), ['instagram']);
	assert.deepEqual(duePlatforms([en('youtube', '2026-11-19T17:30:00Z')], 'en', new Date('2026-11-20T03:41:00Z')), ['instagram']); // 22:41 New York, still the 19th
});

test('missing secrets are named per language and platform', () => {
	assert.deepEqual(missingSecrets(['youtube', 'instagram'], 'id', {YT_CLIENT_ID: 'x', YT_CLIENT_SECRET: 'x', YT_REFRESH_TOKEN_EN: 'x', IG_USER_ID_ID: 'x'}), ['YT_REFRESH_TOKEN_ID', 'IG_TOKEN_ID']);
	assert.deepEqual(missingSecrets(['instagram'], 'en', {IG_USER_ID_EN: 'x', IG_TOKEN_EN: 'x'}), []);
});

test('health: missed slots of yesterday and days left in the queue', () => {
	const mk = (lang: 'en' | 'id', platform: 'youtube' | 'instagram', postedAt: string, id = 'x') => ({id, lang, platform, mediaId: 'm', postedAt});
	// id day 2026-11-19 (WIB): youtube once, instagram twice. Only one Instagram post was made.
	const posted = [mk('id', 'youtube', '2026-11-18T10:00:00Z'), mk('id', 'youtube', '2026-11-19T10:00:00Z'), mk('id', 'instagram', '2026-11-19T04:50:00Z')];
	assert.deepEqual(missedYesterday(posted, new Date('2026-11-20T03:00:00Z')).filter(([l]) => l === 'id'), [['id', 'instagram', 1]]);
	// nothing existed before that day: not a miss
	assert.deepEqual(missedYesterday([mk('id', 'youtube', '2026-11-19T10:00:00Z')], new Date('2026-11-20T03:00:00Z')), []);
	// 3 episodes, one posted to Instagram in en: 2 left = 1 day
	assert.equal(queueDays(['a', 'b', 'c'], [mk('en', 'instagram', '2026-11-18T10:00:00Z', 'a')], () => false)['en instagram'], 1);
	assert.equal(queueDays(['a', 'b', 'c'], [], (id) => id !== 'a')['id youtube'], 1);
});

test('slow-motion ramp: slow inside the window, still ends on time, never goes backwards', () => {
	const qs = Array.from({length: 101}, (_, i) => ramp(i / 100, 0.4, 0.7, 0.25));
	assert.equal(qs[0].q, 0);
	assert.ok(Math.abs(qs[100].q - 1) < 1e-9);
	assert.ok(qs.every((x, i) => i === 0 || x.q >= qs[i - 1].q));
	assert.ok(qs[50].slow && !qs[20].slow && !qs[80].slow);
	assert.ok(qs[60].q - qs[50].q < qs[30].q - qs[20].q); // slower inside than outside
});

test('narrator: English alternates Andrew and Ava by slot, Indonesian is Ardi', () => {
	assert.match(voiceFor('2026-W50/1-honda-idle-stop', 'en').voice, /Andrew/);
	assert.match(voiceFor('2026-W50/2-x', 'en').voice, /Ava/);
	assert.match(voiceFor('2026-W50/13-x', 'en').voice, /Andrew/);
	assert.match(voiceFor('2026-W50/2-x', 'id').voice, /Ardi/);
});
