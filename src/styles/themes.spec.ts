/** @jest-environment node */
import { NGB_DATAGRID_THEME_OPTIONS } from '../datagrid/src/datagrid.types';

const path = require('path');
const { createRequire } = require('module');
const sass = createRequire(require.resolve('ng-packagr'))('sass');
const css: string = sass.compile(path.join(__dirname, 'themes.scss')).css;
const gridCss: string = sass.compile(path.join(__dirname, '../datagrid/src/styles/_datagrid-tokens.scss')).css;
const declarations = (body: string): Record<string, string> => Object.fromEntries(
  [...body.matchAll(/(--[\w-]+):\s*([^;]+);/g)].map(m => [m[1], m[2].trim()]),
);
const theme = (value: string) => declarations(
  css.match(new RegExp(`\\[data-ngb-theme=${value}\\] \\{([^}]+)\\}`))?.[1] ?? '',
);

describe('shared theme stylesheet', () => {
  const required = Object.keys(theme('bootstrap'));
  it('compiles a complete public token contract without global root overrides', () => {
    expect(required).toHaveLength(31);
    expect(css).not.toContain(':root');
    expect(css).not.toContain('table button.btn');
    expect(css).toContain('.ngb-dnd-list');
  });
  it.each([...NGB_DATAGRID_THEME_OPTIONS.map(p => p.value), 'material', 'tailwind'])(
    '%s resets every shared token for nested scopes', (value) => {
      expect(Object.keys(theme(value)).sort()).toEqual([...required].sort());
    },
  );
  it.each(NGB_DATAGRID_THEME_OPTIONS.filter(p => p.value !== 'bootstrap'))(
    '$value keeps its DataGrid primary and surface', ({ value }) => {
      const blocks = [...gridCss.matchAll(/([^{}]+)\{([^}]+)\}/g)];
      const grid = declarations(blocks.filter(m => m[1].includes(`.ngb-grid[data-theme=${value}]`)).map(m => m[2]).join('\n'));
      expect(theme(value)['--ngb-primary']).toBe(grid['--dg-primary']);
      expect(theme(value)['--ngb-surface']).toBe(grid['--dg-surface']);
    },
  );
  it('keeps optional framework mappings and safe fallbacks', () => {
    expect(theme('material')['--ngb-primary']).toBe('var(--mat-sys-primary, #6750a4)');
    expect(theme('tailwind')['--ngb-primary']).toBe('var(--color-blue-600, #2563eb)');
    expect(theme('bootstrap')['--ngb-primary']).toBe('var(--bs-primary, #0d6efd)');
  });
});


describe('optional Tailwind preset packaging', () => {
  const fs = require('fs');
  const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, '../../package.json'), 'utf8'));
  const preset = fs.readFileSync(path.join(__dirname, 'integrations/tailwind.css'), 'utf8');
  it('exports the CSS preset and keeps Tailwind optional', () => {
    expect(pkg.exports['./styles/tailwind.css']).toBe('./src/styles/integrations/tailwind.css');
    expect(pkg.peerDependenciesMeta.tailwindcss.optional).toBe(true);
    expect(pkg.dependencies.tailwindcss).toBeUndefined();
    expect(css).not.toContain('@theme');
  });
  it('only aliases existing public tokens without changing Tailwind defaults', () => {
    const aliases = [...preset.matchAll(/--([\w-]+): var\((--ngb-[\w-]+)\);/g)];
    expect(aliases).toHaveLength(29);
    for (const [, name, token] of aliases) {
      expect(name).toMatch(/^(color|radius|font|text|spacing|shadow)-ngb(?:-|$)/);
      expect(theme('bootstrap')).toHaveProperty(token);
    }
  });
});
