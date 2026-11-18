// For the dashboard review: what a weekly review branch adds, as JSON
// {week, switchLine, report, episodes: [{episode, title, titleId, theme, test, youtube, en, id}]}, where en/id are the
// preview file names in the `previews` release. Usage: node scripts/review-board.ts <branch-or-sha> [base=origin/main]
import {execFileSync} from 'node:child_process';
import {videoFile} from './build.ts';
import type {Meta} from '../src/types.ts';

const [head, base = 'origin/main'] = process.argv.slice(2);
if (!head) throw new Error('usage: node scripts/review-board.ts <branch-or-sha> [base]');
const git = (...a: string[]) => execFileSync('git', a, {encoding: 'utf8'});
const show = (ref: string, path: string) => git('show', `${ref}:${path}`);
const added = git('diff', '--name-only', '--diff-filter=A', `${base}...${head}`).split('\n');

const ids = [...new Set(added.map((f) => f.match(/^episodes\/(\d{4}-W\d{2}\/[\w-]+)\/meta\.json$/)?.[1]).filter((x): x is string => !!x))].sort(
	(a, b) => a.split('/')[0].localeCompare(b.split('/')[0]) || parseInt(a.split('/')[1]) - parseInt(b.split('/')[1]),
);
const preview = (id: string, lang: 'en' | 'id') => videoFile(id, lang).replace(/^out\//, '');
const episodes = ids.map((id) => {
	const m: Meta = JSON.parse(show(head, `episodes/${id}/meta.json`));
	return {episode: id, title: m.title.en.replace(/ #shorts$/i, ''), titleId: m.title.id.replace(/ #shorts$/i, ''), theme: m.theme, test: m.test, youtube: m.youtube !== false, en: preview(id, 'en'), id: preview(id, 'id')};
});
const before = JSON.parse(show(base, 'strategy.json'));
const after = JSON.parse(show(head, 'strategy.json'));
const switchLine = after.currentTheme !== before.currentTheme ? `Switch theme to "${after.currentTheme}" from ${after.themeSince}` : '';
const reportFile = added.filter((f) => /^reports\/.+\.md$/.test(f)).sort().at(-1);
console.log(JSON.stringify({week: ids[0]?.split('/')[0] ?? '', switchLine, report: reportFile ? show(head, reportFile) : '', episodes}, null, 1));
