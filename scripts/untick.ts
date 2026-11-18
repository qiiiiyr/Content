// For the dashboard review: prints the pull request body (stdin) with the rejected items unticked.
// Usage: node scripts/untick.ts '{"rejected": ["2026-W49/3-abs"], "switchRejected": false}' < body.md > new-body.md
import {readFileSync} from 'node:fs';
import {untick} from './review.ts';

const {rejected = [], switchRejected = false} = JSON.parse(process.argv[2] ?? '{}');
if (!Array.isArray(rejected) || !rejected.every((x) => typeof x === 'string')) throw new Error('rejected must be a list of episode ids');
process.stdout.write(untick(readFileSync(0, 'utf8'), rejected, switchRejected === true));
