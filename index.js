// @ts-check
import { exec } from 'node:child_process';
import lava from './package.json' assert { type: 'json' };

exec(`npx ${lava.scripts.build}`, (err) => {
	if (err) return console.error(err);
});