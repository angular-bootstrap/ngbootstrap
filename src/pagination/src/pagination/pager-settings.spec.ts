import {
  NGB_PAGER_BREAKPOINTS,
  NGB_PAGER_DEFAULT_SETTINGS,
  ngbFormatPagerRangeLabel,
  ngbPagerButtonCountForDensity,
  ngbResolvePagerDensity,
  ngbResolvePagerPageSizeOptions,
  ngbResolvePagerSettings,
} from './pager-settings';

describe('ngbResolvePagerSettings', () => {
  it('returns null when pagination is disabled', () => {
    expect(ngbResolvePagerSettings(false)).toBeNull();
    expect(ngbResolvePagerSettings(null)).toBeNull();
  });

  it('merges object settings with defaults', () => {
    expect(ngbResolvePagerSettings({ buttonCount: 5, pageSizes: [8, 16] })).toEqual({
      ...NGB_PAGER_DEFAULT_SETTINGS,
      buttonCount: 5,
      pageSizes: [8, 16],
    });
  });

  it('uses defaults when settings is true', () => {
    expect(ngbResolvePagerSettings(true)).toEqual(NGB_PAGER_DEFAULT_SETTINGS);
    expect(ngbResolvePagerSettings(true)!.responsive).toBe(true);
  });
});

describe('ngbResolvePagerDensity', () => {
  it('returns full density at wide widths', () => {
    expect(ngbResolvePagerDensity(NGB_PAGER_BREAKPOINTS.fullMinWidth)).toBe('full');
    expect(ngbResolvePagerDensity(900)).toBe('full');
  });

  it('returns compact density when info should be hidden', () => {
    expect(ngbResolvePagerDensity(NGB_PAGER_BREAKPOINTS.compactMinWidth)).toBe('compact');
    expect(ngbResolvePagerDensity(400)).toBe('compact');
  });

  it('returns minimal density when info and page sizes should be hidden', () => {
    expect(ngbResolvePagerDensity(NGB_PAGER_BREAKPOINTS.compactMinWidth - 1)).toBe('minimal');
    expect(ngbResolvePagerDensity(200)).toBe('minimal');
  });
});

describe('ngbResolvePagerPageSizeOptions', () => {
  it('includes the active pageSize when not in presets', () => {
    expect(ngbResolvePagerPageSizeOptions([5, 10], 7)).toEqual([5, 7, 10]);
  });

  it('does not clamp page size to a minimum preset', () => {
    expect(ngbResolvePagerPageSizeOptions([5, 10, 25], 4)).toEqual([4, 5, 10, 25]);
  });
});

describe('ngbPagerButtonCountForDensity', () => {
  it('reduces button count in compact and minimal densities', () => {
    expect(ngbPagerButtonCountForDensity(10, 'full', true)).toBe(10);
    expect(ngbPagerButtonCountForDensity(10, 'compact', true)).toBe(5);
    expect(ngbPagerButtonCountForDensity(10, 'minimal', true)).toBe(3);
  });

  it('uses full button count when responsive is off', () => {
    expect(ngbPagerButtonCountForDensity(10, 'minimal', false)).toBe(10);
  });
});

describe('ngbFormatPagerRangeLabel', () => {
  it('substitutes range tokens', () => {
    expect(ngbFormatPagerRangeLabel(1, 5, 6)).toBe('1–5 of 6');
    expect(ngbFormatPagerRangeLabel(1, 2, 2, '{start} bis {end} von {total}')).toBe('1 bis 2 von 2');
  });
});
