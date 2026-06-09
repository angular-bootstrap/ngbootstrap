import {
  NGB_PAGER_BREAKPOINTS,
  NGB_PAGER_DEFAULT_SETTINGS,
  NgbPagerDensity,
  NgbPagerSettings,
  NgbPagerType,
  ngbResolvePagerDensity,
} from '../../../pagination';

export type NgbDatagridPagerType = NgbPagerType;

export type NgbDatagridPagerPosition = 'top' | 'bottom' | 'both';

export type NgbDatagridPagerDensity = NgbPagerDensity;

/** @deprecated Use {@link NGB_PAGER_BREAKPOINTS}. */
export const NGB_DATAGRID_PAGER_BREAKPOINTS = NGB_PAGER_BREAKPOINTS;

/** Pager configuration for {@link Datagrid} via `[pageable]`. */
export interface NgbDatagridPageableSettings extends NgbPagerSettings {
  /** Pager placement relative to the table. Default `bottom`. */
  position?: NgbDatagridPagerPosition;
}

export const NGB_DATAGRID_DEFAULT_PAGEABLE: Required<
  Omit<NgbDatagridPageableSettings, 'pageSizes'>
> & { pageSizes: false | number[] } = {
  ...NGB_PAGER_DEFAULT_SETTINGS,
  position: 'bottom',
};

export { ngbResolvePagerDensity };

export function ngbResolvePageableSettings(
  pageable: boolean | NgbDatagridPageableSettings | null | undefined,
  legacy?: { enablePagination?: boolean; pageSizeOptions?: number[] }
): NgbDatagridPageableSettings | null {
  if (pageable) {
    const overrides = typeof pageable === 'object' ? pageable : {};
    return { ...NGB_DATAGRID_DEFAULT_PAGEABLE, ...overrides };
  }
  if (legacy?.enablePagination) {
    return {
      ...NGB_DATAGRID_DEFAULT_PAGEABLE,
      pageSizes: legacy.pageSizeOptions?.length ? legacy.pageSizeOptions : [5, 10, 25, 50],
    };
  }
  return null;
}

/** Settings for {@link NgbPagerComponent} (excludes grid-only `position`). */
export function ngbDatagridPagerSettings(
  pageable: NgbDatagridPageableSettings
): NgbPagerSettings {
  const { position: _position, ...settings } = pageable;
  return settings;
}

export function ngbResolveDatagridPagerSettings(
  pageable: boolean | NgbDatagridPageableSettings | null | undefined,
  legacy?: { enablePagination?: boolean; pageSizeOptions?: number[] }
): NgbPagerSettings | null {
  const resolved = ngbResolvePageableSettings(pageable, legacy);
  return resolved ? ngbDatagridPagerSettings(resolved) : null;
}
