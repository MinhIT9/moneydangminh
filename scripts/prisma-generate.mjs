import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const tempDirectory = resolve('.tmp');
mkdirSync(tempDirectory, { recursive: true });

// Let Prisma update its output in place. Deleting the whole directory first causes an
// avoidable EPERM failure on Windows when the editor or a dev server still references it.
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
