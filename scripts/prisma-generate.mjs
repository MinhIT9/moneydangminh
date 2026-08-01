import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  renameSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { relative, resolve } from 'node:path';

const tempDirectory = resolve('.tmp');
const sourceSchemaPath = resolve('prisma/schema.prisma');
const temporarySchemaPath = resolve(tempDirectory, 'prisma-generate.schema.prisma');
const candidateOutputPath = resolve(tempDirectory, 'prisma-client-candidate');
const clientOutputPath = resolve('src/generated/prisma');
const clientOutputParentPath = resolve('src/generated');
const prismaCli = resolve('node_modules/prisma/build/index.js');

mkdirSync(tempDirectory, { recursive: true });
mkdirSync(clientOutputParentPath, { recursive: true });

function fingerprintDirectory(directory) {
  const files = [];

  function visit(currentDirectory) {
    for (const entry of readdirSync(currentDirectory)) {
      const entryPath = resolve(currentDirectory, entry);
      const stats = statSync(entryPath);

      if (stats.isDirectory()) {
        visit(entryPath);
      } else if (stats.isFile()) {
        files.push(entryPath);
      }
    }
  }

  visit(directory);

  const hash = createHash('sha256');
  for (const filePath of files.sort()) {
    hash.update(relative(directory, filePath));
    hash.update('\0');
    hash.update(readFileSync(filePath));
    hash.update('\0');
  }

  return hash.digest('hex');
}

function removeCandidateFiles() {
  rmSync(candidateOutputPath, {
    recursive: true,
    force: true,
    maxRetries: 3,
    retryDelay: 100,
  });
  rmSync(temporarySchemaPath, { force: true });
}

function replaceGeneratedClient() {
  const backupOutputPath = resolve(tempDirectory, `prisma-client-backup-${process.pid}`);

  rmSync(backupOutputPath, {
    recursive: true,
    force: true,
    maxRetries: 3,
    retryDelay: 100,
  });

  try {
    if (existsSync(clientOutputPath)) {
      renameSync(clientOutputPath, backupOutputPath);
    }

    renameSync(candidateOutputPath, clientOutputPath);
    rmSync(backupOutputPath, {
      recursive: true,
      force: true,
      maxRetries: 3,
      retryDelay: 100,
    });
  } catch (error) {
    if (!existsSync(clientOutputPath) && existsSync(backupOutputPath)) {
      renameSync(backupOutputPath, clientOutputPath);
    }

    throw error;
  }
}

try {
  const sourceSchema = readFileSync(sourceSchemaPath, 'utf8');
  const candidateSchema = sourceSchema.replace(
    /(generator\s+client\s*\{[\s\S]*?\boutput\s*=\s*)"[^"]*"/,
    '$1"./prisma-client-candidate"',
  );

  if (candidateSchema === sourceSchema) {
    throw new Error(
      'Could not locate the Prisma Client output declaration in prisma/schema.prisma.',
    );
  }

  removeCandidateFiles();
  writeFileSync(temporarySchemaPath, candidateSchema);

  const result = spawnSync(
    process.execPath,
    [prismaCli, 'generate', '--schema', temporarySchemaPath],
    {
      stdio: 'inherit',
      env: {
        ...process.env,
        TEMP: tempDirectory,
        TMP: tempDirectory,
        TMPDIR: tempDirectory,
      },
    },
  );

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }

  const clientIsCurrent =
    existsSync(clientOutputPath) &&
    fingerprintDirectory(candidateOutputPath) === fingerprintDirectory(clientOutputPath);

  if (clientIsCurrent) {
    removeCandidateFiles();
    console.log('Prisma Client is already current; avoided overwriting files that may be in use.');
  } else {
    replaceGeneratedClient();
    rmSync(temporarySchemaPath, { force: true });
    console.log('Prisma Client updated.');
  }
} catch (error) {
  removeCandidateFiles();

  const code =
    typeof error === 'object' && error !== null && 'code' in error ? error.code : undefined;
  if (code === 'EPERM' || code === 'EBUSY') {
    console.error(
      '\nPrisma Client has changed, but src/generated/prisma is locked by another process. Stop npm run dev, run npm run db:generate, then start the dev server again.',
    );
  }

  throw error;
}
