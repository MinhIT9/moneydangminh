import { readdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { native as rimrafNative } from 'rimraf';

const nextDirectory = resolve('.next');

let entries;

try {
  entries = await readdir(nextDirectory);
} catch (error) {
  if (error?.code === 'ENOENT') {
    console.log('No previous .next build output found.');
    process.exit(0);
  }

  throw error;
}

const targets = entries
  .filter((entry) => entry !== 'cache')
  .map((entry) => resolve(nextDirectory, entry));

if (targets.length === 0) {
  console.log('No stale .next build output found; preserved .next/cache.');
  process.exit(0);
}

try {
  await rimrafNative(targets, {
    maxRetries: 50,
    retryDelay: 100,
  });

  console.log(`Removed ${targets.length} stale .next item(s); preserved .next/cache.`);
} catch (error) {
  if (error?.code === 'EPERM' || error?.code === 'EBUSY') {
    console.error(
      'Windows is still locking a .next build file. Stop every npm run dev/start process, wait a moment, then run npm run build again.',
    );
  }

  throw error;
}
