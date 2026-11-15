import {test} from 'node:test';
import assert from 'node:assert/strict';
import {decide, findHits, followups, isoWeek, median, parseChecklist, type EpisodeScore, type Strategy} from './review.ts';
import {nextToPost} from './publish.ts';

const now = new Date('2026-12-20T00:00:00Z');
const strategy: Strategy = {
	currentTheme: 'a',
	themeSince: '2026-11-01',
	testTheme: 'b',
	thresholds: {minWeeksOnTheme: 4, minTestEpisodes: 4, switchRatio: 1.5, fallingWeeks: 3, hitMultiple: 3, hitWindowDays: 30, followupMultiple: 2, minAgeDays: 3},
	lessons: [],
};
const ep = (theme: string, score: number, postedAt: string, i = 0): EpisodeScore => ({id: `${theme}${score}${i}`, theme, test: theme !== 'a', postedAt, score});

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

test('ignores posts younger than minAgeDays', () => {
	const eps = [ep('a', 100, '2026-12-01'), ...[1, 2, 3, 4].map((i) => ep('b', 1000, '2026-12-19', i))];
	assert.equal(decide(eps, [], ['a', 'b'], strategy, now).action, 'keep');
});

test('follow-ups are 2x the median', () => {
	assert.deepEqual(followups([ep('a', 10, ''), ep('a', 10, ''), ep('a', 30, '')], 2).map((e) => e.score), [30]);
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
});
