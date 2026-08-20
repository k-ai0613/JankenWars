// Every translation key the app asks for must exist.
//
// t() returns the key itself when it cannot find a translation, so a missing
// key shows up in the UI as literal text like "online.waitingForOpponent".
// 41 t() keys and 18 message.* keys were missing that way; this test keeps
// them from creeping back.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const CLIENT_SRC = path.join(ROOT, 'client', 'src');
const LANG_FILE = path.join(CLIENT_SRC, 'lib', 'stores', 'useLanguage.tsx');

let pass = 0;
let fail = 0;
const t = (name: string, cond: boolean) => {
  if (cond) { pass++; console.log(`  ✅ ${name}`); }
  else { fail++; console.log(`  ❌ ${name}`); }
};

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else if (/\.tsx?$/.test(entry.name)) out.push(full);
  }
  return out;
}

const sources = walk(CLIENT_SRC);
const langSource = fs.readFileSync(LANG_FILE, 'utf8');

// Keys declared in the translations table: 'some.key': {
const declared = new Set<string>();
for (const match of langSource.matchAll(/^\s*'([^']+)'\s*:\s*\{/gm)) {
  declared.add(match[1]);
}

// Keys the app asks for: t('some.key') and 'message.someKey' string literals
// that get stored in state and rendered through t() later.
const requested = new Map<string, string[]>();
const record = (key: string, file: string) => {
  const rel = path.relative(ROOT, file);
  const list = requested.get(key);
  if (list) { if (!list.includes(rel)) list.push(rel); }
  else requested.set(key, [rel]);
};

for (const file of sources) {
  const src = fs.readFileSync(file, 'utf8');
  for (const m of src.matchAll(/(?<![A-Za-z0-9_$.])t\('([^']+)'\)/g)) record(m[1], file);
  for (const m of src.matchAll(/'(message\.[A-Za-z0-9.]+)'/g)) record(m[1], file);
}

console.log(`\n[i18n] 宣言済み ${declared.size} キー / 参照 ${requested.size} キー`);

const missing = [...requested.keys()].filter((k) => !declared.has(k)).sort();
for (const key of missing) {
  console.log(`     欠落: ${key}  <- ${requested.get(key)!.join(', ')}`);
}
t(`参照されている全キーが定義されている (欠落 ${missing.length} 件)`, missing.length === 0);

// Both languages must be filled in, otherwise one locale silently falls back
// to the raw key.
const incomplete: string[] = [];
for (const key of declared) {
  const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  // Stop at the entry's own closing brace at indent level 2, not at the first
  // "}" — translated copy contains {winLength} / {boardSize} placeholders.
  const entry = langSource.match(new RegExp(`'${escaped}'\\s*:\\s*\\{\\n([\\s\\S]*?)\\n  \\}`));
  if (!entry) continue;
  if (!/^\s*en\s*:/m.test(entry[1]) || !/^\s*ja\s*:/m.test(entry[1])) incomplete.push(key);
}
for (const key of incomplete) console.log(`     未翻訳: ${key}`);
t(`全キーが en と ja の両方を持つ (不足 ${incomplete.length} 件)`, incomplete.length === 0);

// Dynamically built keys must match the casing used in the table.
// `message.${normalizePlayer(p)}Win` produced "message.PLAYER1Win" while the
// table declares "message.player1Win".
const dynamicKeys: string[] = [];
for (const file of sources) {
  const src = fs.readFileSync(file, 'utf8');
  for (const m of src.matchAll(/`(message\.\$\{[^`]*)`/g)) {
    dynamicKeys.push(`${path.relative(ROOT, file)}: ${m[1]}`);
  }
}
const badDynamic = dynamicKeys.filter((k) => /normalizePlayer/.test(k));
for (const k of badDynamic) console.log(`     大文字キーを生成: ${k}`);
t(`動的キーが normalizePlayer を直接埋め込んでいない (${badDynamic.length} 件)`, badDynamic.length === 0);

console.log(`\n===== 合格 ${pass} / 失敗 ${fail} =====`);
process.exit(fail ? 1 : 0);
