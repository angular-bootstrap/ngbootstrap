/**
 * Ensures bootstrap theme wiring stays aligned with Bootstrap CSS variables.
 * Visual regression is covered by datagrid-lab; this spec guards the public theme contract.
 */

describe('datagrid bootstrap theme tokens', () => {
  const tokensPath = require('path').join(__dirname, '_datagrid-tokens.scss');

  it('defines bootstrap theme mapping in token source', () => {
    const fs = require('fs');
    const source = fs.readFileSync(tokensPath, 'utf8');
    expect(source).toContain('@mixin datagrid-bootstrap-tokens()');
    expect(source).toContain('.ngb-grid[data-theme=\'bootstrap\']');
    expect(source).toContain('.ngb-datagrid-floating-panel[data-theme=\'bootstrap\']');
    expect(source).toContain('--bs-body-bg');
    expect(source).toContain('--bs-primary');
    expect(source).toContain('--bs-border-color');
    expect(source).toContain('--dg-surface: var(--bs-body-bg');
    expect(source).toContain('--dg-dropdown-item-active-bg');
  });

  it('defines named theme variants for grid and floating panels', () => {
    const fs = require('fs');
    const source = fs.readFileSync(tokensPath, 'utf8');
    [
      'bootstrap-main-dark',
      'bootstrap-nordic',
      'bootstrap-urban',
      'bootstrap-vintage',
      'material-main',
      'material-indigo',
      'material-deep-purple',
      'tailwind-main',
      'tailwind-slate',
      'tailwind-emerald',
    ].forEach((theme) => {
      expect(source).toContain(`.ngb-grid[data-theme='${theme}']`);
      expect(source).toContain(`.ngb-datagrid-floating-panel[data-theme='${theme}']`);
    });
  });

  it('keeps standalone fallbacks when Bootstrap variables are absent', () => {
    const fs = require('fs');
    const source = fs.readFileSync(tokensPath, 'utf8');
    expect(source).toContain('@mixin datagrid-fallback-tokens()');
    expect(source).toContain('.ngb-grid,');
    expect(source).toContain('.ngb-datagrid-floating-panel');
    expect(source).toContain('--dg-surface: #ffffff');
    expect(source).toContain('--dg-primary: #315efb');
  });

  it('defines pager tokens for named light theme variants used in the overview picker', () => {
    const fs = require('fs');
    const source = fs.readFileSync(tokensPath, 'utf8');
    [
      'datagrid-theme-nordic',
      'datagrid-theme-urban',
      'datagrid-theme-vintage',
      'datagrid-theme-tailwind-main',
    ].forEach((mixin) => {
      const start = source.indexOf(`@mixin ${mixin}()`);
      expect(start).toBeGreaterThanOrEqual(0);
      const nextMixin = source.indexOf('@mixin ', start + 1);
      const body = source.slice(start, nextMixin === -1 ? source.length : nextMixin);
      expect(body).toContain('--dg-pager-surface');
      expect(body).toContain('--dg-pager-control-bg');
      expect(body).toContain('--dg-pager-active-bg');
      expect(body).toContain('--dg-pager-link-text');
    });
  });
});
