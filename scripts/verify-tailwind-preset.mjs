// Optional integration check. Install Tailwind v4 in a separate directory, then:
// node scripts/verify-tailwind-preset.mjs /path/to/tailwind-project [output-directory]
// This does not add Tailwind to the library's runtime or default test suite.
import assert from 'node:assert/strict';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const consumer = path.resolve(process.argv[2] ?? root);
const consumerRequire = createRequire(path.join(consumer, 'package.json'));
const { compile } = consumerRequire('tailwindcss');
const presetPath = path.join(root, 'src/styles/integrations/tailwind.css');
const preset = await readFile(presetPath, 'utf8');
const mappings = [...preset.matchAll(/--([\w-]+): var\((--ngb-[\w-]+)\);/g)];
assert.equal(mappings.length, 29);
assert(mappings.every(([, name]) => /^(color|radius|font|text|spacing|shadow)-ngb(?:-|$)/.test(name)));
const candidates = ['bg-ngb-surface', 'text-ngb-on-surface', 'border-ngb-border',
  'rounded-ngb-md', 'font-ngb', 'text-ngb-sm', 'p-ngb-4', 'gap-ngb-2',
  'min-h-ngb-row', 'shadow-ngb-1', 'hover:bg-ngb-hover', 'focus:outline-ngb-focus',
  'bg-blue-600', 'rounded-md'];

for (const prefix of ['', 'tw']) {
  const suffix = prefix ? ` prefix(${prefix})` : '';
  const compiler = await compile(`
    @layer theme, base, components, utilities;
    @import 'tailwindcss/theme.css' layer(theme)${suffix};
    @import 'tailwindcss/utilities.css' layer(utilities)${suffix};
    @import './ngb-preset.css';
  `, {
    base: root,
    loadStylesheet: async id => {
      const resolved = id === './ngb-preset.css' ? presetPath : consumerRequire.resolve(id);
      return { path: resolved, base: path.dirname(resolved), content: await readFile(resolved, 'utf8') };
    },
  });
  const css = compiler.build(candidates.map(c => prefix ? `${prefix}:${c}` : c));
  for (const declaration of ['background-color: var(--ngb-surface)', 'color: var(--ngb-on-surface)',
    'border-color: var(--ngb-border-color)', 'border-radius: var(--ngb-radius-md)',
    'font-family: var(--ngb-font-family)', 'font-size: var(--ngb-font-size-sm)',
    'padding: var(--ngb-space-4)', 'gap: var(--ngb-space-2)',
    'min-height: var(--ngb-density-row-height)', 'var(--ngb-elevation-1)',
    'background-color: var(--ngb-hover-bg)', 'outline-color: var(--ngb-focus-ring)']) {
    assert(css.includes(declaration), `${prefix || 'unprefixed'}: missing ${declaration}`);
  }
  assert(css.includes(prefix ? '.tw\\:bg-ngb-surface' : '.bg-ngb-surface'));
  assert(css.includes(`background-color: var(--${prefix ? 'tw-' : ''}color-blue-600)`));
  assert(css.includes(`border-radius: var(--${prefix ? 'tw-' : ''}radius-md)`));
  assert(!css.includes('@theme'));
  if (process.argv[3]) {
    await mkdir(process.argv[3], { recursive: true });
    await writeFile(path.join(process.argv[3], `${prefix || 'unprefixed'}.css`), css);
  }
  console.log(`PASS: ${prefix || 'unprefixed'} utilities, variants, inline token references, unchanged Tailwind defaults`);
}
