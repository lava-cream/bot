// @ts-check
import { exec } from 'node:child_process';
import lava from './package.json' assert { type: 'json' };

exec(`npx rimraf ./dist`, (err) => {
	if (err) return console.error(err);
	exec(`npm install typescript && npx tsc --project ./src/tsconfig.json && ${lava.scripts.start}`, console.log);
});