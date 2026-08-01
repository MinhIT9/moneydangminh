import { mkdirSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const tempDirectory = resolve('.tmp');
const generatedClientDirectory = resolve('src/generated/prisma');
mkdirSync(tempDirectory, { recursive: true });
rmSync(generatedClientDirectory, { recursive: true, force: true });

const prismaCli = resolve('node_modules/prisma/build/index.js');
const result = spawnSync(process.execPath, [prismaCli, 'generate'], {
  stdio: 'inherit',
  env: {
    ...process.env,
    TEMP: tempDirectory,
    TMP: tempDirectory,
    TMPDIR: tempDirectory,
  },
});

process.exit(result.status ?? 1);
