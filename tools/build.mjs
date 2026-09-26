// Bundles the game into one self-contained HTML file (all scripts inlined,
// the voicemail already embedded by embed-voicemail.mjs).
//
//   node tools/build.mjs            -> dist/more.html (open or share this one file)
//   node tools/build.mjs --fragment -> also dist/more.fragment.html, the same page
//                                      without <html>/<head>/<body> wrappers, for
//                                      hosts that supply their own document shell
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const html = readFileSync(join(root, 'index.html'), 'utf8');

let count = 0;
const bundled = html.replace(/<script src="([^"]+)"><\/script>/g, (_, src) => {
  count++;
  const code = readFileSync(join(root, src), 'utf8').replace(/<\/script/gi, '<\\/script');
  return `<script>/* ${src} */\n${code}\n</script>`;
});

// Inline the art manifest's PNGs as data URIs so the file stands alone.
let images = 0;
const withArt = bundled.replace(/"(assets\/art\/[\w.-]+\.png)"/g, (_, file) => {
  images++;
  return JSON.stringify('data:image/png;base64,' + readFileSync(join(root, file)).toString('base64'));
});

mkdirSync(join(root, 'dist'), { recursive: true });
writeFileSync(join(root, 'dist/more.html'), withArt);
console.log(`${images} images inlined`);
console.log(`dist/more.html: ${count} scripts inlined, ${(withArt.length / 1024).toFixed(0)} KB`);

if (process.argv.includes('--fragment')) {
  const head = /<head>([\s\S]*?)<\/head>/.exec(withArt)[1].replace(/<meta[^>]*>\s*/g, '');
  const body = /<body>([\s\S]*?)<\/body>/.exec(withArt)[1];
  writeFileSync(join(root, 'dist/more.fragment.html'), head.trim() + '\n' + body.trim() + '\n');
  console.log('dist/more.fragment.html written');
}
