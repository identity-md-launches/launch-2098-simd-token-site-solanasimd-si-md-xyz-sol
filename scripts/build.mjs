import { cp, mkdir, rm, readFile } from 'node:fs/promises';

const source = new URL('../site/', import.meta.url);
const output = new URL('../dist/', import.meta.url);
await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
await cp(source, output, { recursive: true });
const html = await readFile(new URL('index.html', output), 'utf8');
if (!html.includes('./app.js') || !html.includes('./styles.css')) {
  throw new Error('The export must use relative local asset URLs.');
}
console.log('Built: site/ copied to dist/ with relative assets. No runtime dependencies.');
