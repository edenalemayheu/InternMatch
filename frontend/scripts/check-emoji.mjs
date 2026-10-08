// Scans all .jsx/.js files for emoji
import { readdirSync, readFileSync, statSync } from 'fs';
import { join } from 'path';

const EMOJI_RE = /[\u{1F000}-\u{1FFFF}]|[\u{2600}-\u{27BF}]|[\u{FE00}-\u{FEFF}]|\u{1F004}|\u{1F0CF}/gu;

function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const st   = statSync(full);
    if (st.isDirectory() && !entry.startsWith('.') && entry !== 'node_modules') out.push(...walk(full));
    else if (st.isFile() && (entry.endsWith('.jsx') || entry.endsWith('.js'))) out.push(full);
  }
  return out;
}

const files = walk(new URL('../src', import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1'));
let found = 0;
for (const f of files) {
  const lines = readFileSync(f, 'utf8').split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // Skip pure comment lines
    if (/^\s*(\/\/|\*|\/\*)/.test(line)) continue;
    if (EMOJI_RE.test(line)) {
      console.log(`${f.split('src')[1]}:${i+1}: ${line.trim().slice(0,100)}`);
      found++;
      EMOJI_RE.lastIndex = 0;
    }
  }
}
console.log(`\nTotal: ${found} lines with emoji`);
