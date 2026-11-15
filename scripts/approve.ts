// Runs after the weekly pull request is merged: removes the episodes you unticked and,
// if you unticked the theme switch, puts the theme back (other strategy edits are kept).
import {execFileSync} from 'node:child_process';
import {readFileSync, rmSync, writeFileSync} from 'node:fs';
import {parseChecklist} from './review.ts';

const {rejected, switchRejected} = parseChecklist(process.env.PR_BODY ?? '');
for (const id of rejected) {
	rmSync(`episodes/${id}`, {recursive: true, force: true});
	console.log(`removed rejected episode ${id}`);
}
if (switchRejected) {
	const before = JSON.parse(execFileSync('git', ['show', `${process.env.BASE_SHA}:strategy.json`]).toString());
	const now = JSON.parse(readFileSync('strategy.json', 'utf8'));
	writeFileSync('strategy.json', JSON.stringify({...now, currentTheme: before.currentTheme, themeSince: before.themeSince}, null, 2) + '\n');
	console.log(`theme switch rejected: staying on "${before.currentTheme}"`);
}
