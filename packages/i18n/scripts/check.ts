// i18n gate (SPEC 7, run in CI):
//   - every namespace file exists for every locale, with exactly the same keys
//   - every message parses as ICU
//   - every plural covers all of its locale's CLDR categories (Arabic: zero one two few many other)
//   - no message is empty

import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse, TYPE, type MessageFormatElement } from '@formatjs/icu-messageformat-parser';
import { locales } from '../src/locales';

type Json = { [key: string]: string | Json };

const root = join(dirname(fileURLToPath(import.meta.url)), '..', 'messages');
const errors: string[] = [];

function flatten(obj: Json, prefix = ''): Map<string, string> {
  const out = new Map<string, string>();
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (typeof v === 'string') out.set(key, v);
    else for (const [ck, cv] of flatten(v, key)) out.set(ck, cv);
  }
  return out;
}

function checkPlurals(elements: MessageFormatElement[], locale: string, where: string) {
  const required = new Intl.PluralRules(locale).resolvedOptions().pluralCategories;
  for (const el of elements) {
    if (el.type === TYPE.plural) {
      const given = Object.keys(el.options);
      const missing = required.filter((c) => !given.includes(c));
      if (missing.length)
        errors.push(`${where}: plural "${el.value}" is missing ${missing.join(', ')}`);
    }
    if (el.type === TYPE.plural || el.type === TYPE.select) {
      for (const opt of Object.values(el.options)) checkPlurals(opt.value, locale, where);
    }
    if (el.type === TYPE.tag) checkPlurals(el.children, locale, where);
  }
}

const namespaceSets = locales.map(
  (l) => new Set(readdirSync(join(root, l)).filter((f) => f.endsWith('.json'))),
);
const allNamespaces = [...new Set(namespaceSets.flatMap((s) => [...s]))].sort();

for (const ns of allNamespaces) {
  const catalogs = new Map<string, Map<string, string>>();
  for (const locale of locales) {
    try {
      catalogs.set(
        locale,
        flatten(JSON.parse(readFileSync(join(root, locale, ns), 'utf8')) as Json),
      );
    } catch (e) {
      errors.push(`${locale}/${ns}: ${e instanceof Error ? e.message : 'unreadable'}`);
    }
  }
  const allKeys = new Set([...catalogs.values()].flatMap((c) => [...c.keys()]));
  for (const [locale, catalog] of catalogs) {
    for (const key of allKeys) {
      const where = `${locale}/${ns} ${key}`;
      const message = catalog.get(key);
      if (message === undefined) {
        errors.push(`${where}: missing`);
        continue;
      }
      if (!message.trim()) errors.push(`${where}: empty`);
      try {
        checkPlurals(parse(message), locale, where);
      } catch (e) {
        errors.push(`${where}: invalid ICU (${e instanceof Error ? e.message : String(e)})`);
      }
    }
  }
}

if (errors.length) {
  console.error(`✗ i18n check failed with ${errors.length} problem(s):`);
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}
console.log(`✓ i18n: ${allNamespaces.length} namespaces complete in ${locales.join(', ')}`);
