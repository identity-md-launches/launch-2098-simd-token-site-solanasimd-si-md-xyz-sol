import { readdir, stat, readFile, writeFile, mkdir } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { createHash } from 'node:crypto';

const LIMIT = 8388608;
const IGNORE_BUDGET = 512;
const skip = new Set(['.git', '.github', '.imd', '.agents', '.codex', '.aws', 'node_modules', '.cache', '.npm', '.vite', 'playwright-report', 'test-results']);
const files = [];
async function walk(dir = '.') {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (skip.has(entry.name) || entry.name === '.env' || entry.name.startsWith('.env.') || entry.name.endsWith('.tsbuildinfo')) continue;
    const path = join(dir, entry.name), local = relative('.', path).replaceAll('\\', '/');
    if (local === 'test/scratch' || local === 'artifacts/budget.json') continue;
    if (entry.isSymbolicLink()) throw new Error(`Symlinks / submodules are not deliverables: ${local}`);
    if (entry.isDirectory()) await walk(path);
    else files.push({ path: local, bytes: (await stat(path)).size });
  }
}
await walk();
const source = files.filter(file => file.path.startsWith('site/'));
const output = files.filter(file => file.path.startsWith('dist/'));
if (source.length !== output.length) throw new Error('Source and export file counts differ. Rebuild.');
for (const file of source) {
  const a = await readFile(file.path), b = await readFile(file.path.replace(/^site\//, 'dist/'));
  if (!a.equals(b)) throw new Error(`Stale production export: ${file.path}`);
}
if ((await stat('.gitignore')).size > IGNORE_BUDGET) throw new Error('.gitignore exceeded its explicit 512-byte path budget.');
const total = files.reduce((sum, file) => sum + file.bytes, 0);
if (total + 8192 > LIMIT) throw new Error(`Raw submission content is too large: ${total} bytes plus report allowance.`);
await mkdir('artifacts', { recursive: true });
const groups = Object.fromEntries(['site/', 'dist/', 'artifacts/'].map(prefix => [prefix, files.filter(file => file.path.startsWith(prefix)).reduce((sum, file) => sum + file.bytes, 0)]));
const manifest = createHash('sha256').update(JSON.stringify(files)).digest('hex');
const report = { limitBytes: LIMIT, fileContentBytesExcludingThisReport: total, reservedReportBytes: 8192, headroomBytesAfterReserve: LIMIT - total - 8192, ignorePath: '.gitignore', ignoreBudgetBytes: IGNORE_BUDGET, ignoreActualBytes: (await stat('.gitignore')).size, groups, sourceAndExportIdentical: true, files: files.length, manifestSha256: manifest };
await writeFile('artifacts/budget.json', JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report, null, 2));
