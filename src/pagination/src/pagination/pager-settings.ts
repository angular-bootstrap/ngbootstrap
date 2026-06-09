export type NgbPagerType = 'numeric' | 'input';

/**
 * Responsive pager density based on container width.
 * - `full`: info, pagination, and page-size controls
 * - `compact`: hides range info
 * - `minimal`: hides range info and page-size controls (pagination remains)
 */
export type NgbPagerDensity = 'full' | 'compact' | 'minimal';

/** Width breakpoints (px) for {@link ngbResolvePagerDensity}. */
export const NGB_PAGER_BREAKPOINTS = {
  fullMinWidth: 520,
  compactMinWidth: 360,
} as const;

/** Configuration for {@link NgbPagerComponent}. */
export interface NgbPagerSettings {
  /** Maximum numeric page buttons before ellipsis collapse. Default `10`. */
  buttonCount?: number;
  /** Shows the current range and total record count. Default `true`. */
  info?: boolean;
  /**
   * Page-size presets. `false` hides the control (set `pageSize` yourself).
   * The active `pageSize` is included when it is not already in the list.
   */
  pageSizes?: false | number[];
  /** Shows previous/next pager buttons. Default `true`. */
  previousNext?: boolean;
  /** `numeric` (page buttons) or `input` (type a page number). Default `numeric`. */
  type?: NgbPagerType;
  /**
   * When `true` (default), hides info and page-size controls as the container narrows.
   * When `false`, all controls stay visible and wrap onto new rows.
   */
  responsive?: boolean;
}

export const NGB_PAGER_DEFAULT_SETTINGS: Required<
  Omit<NgbPagerSettings, 'pageSizes'>
> & { pageSizes: false | number[] } = {
  buttonCount: 10,
  info: true,
  pageSizes: false,
  previousNext: true,
  type: 'numeric',
  responsive: true,
};

export function ngbResolvePagerSettings(
  settings: boolean | NgbPagerSettings | null | undefined
): NgbPagerSettings | null {
  if (!settings) return null;
  const overrides = typeof settings === 'object' ? settings : {};
  return { ...NGB_PAGER_DEFAULT_SETTINGS, ...overrides };
}

export function ngbResolvePagerDensity(width: number): NgbPagerDensity {
  if (width >= NGB_PAGER_BREAKPOINTS.fullMinWidth) return 'full';
  if (width >= NGB_PAGER_BREAKPOINTS.compactMinWidth) return 'compact';
  return 'minimal';
}

export function ngbResolvePagerPageSizeOptions(
  pageSizes: false | number[] | undefined,
  pageSize: number
): number[] {
  const presets = Array.isArray(pageSizes) && pageSizes.length ? pageSizes : [];
  const options = presets
    .map((value) => Number(value))
    .filter((value) => Number.isFinite(value) && value > 0);
  const size = Number(pageSize);
  if (Number.isFinite(size) && size > 0 && !options.includes(size)) {
    options.push(size);
  }
  return options.sort((a, b) => a - b);
}

export function ngbPagerButtonCountForDensity(
  base: number,
  density: NgbPagerDensity,
  responsive: boolean
): number {
  if (!responsive) return base;
  if (density === 'minimal') return Math.min(base, 3);
  if (density === 'compact') return Math.min(base, 5);
  return base;
}

export function ngbFormatPagerRangeLabel(
  start: number,
  end: number,
  total: number,
  template = '{start}–{end} of {total}'
): string {
  return template
    .replace(/\{start\}/g, String(start))
    .replace(/\{end\}/g, String(end))
    .replace(/\{total\}/g, String(total));
}
