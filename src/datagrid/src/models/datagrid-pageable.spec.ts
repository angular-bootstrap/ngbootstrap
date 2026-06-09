import {
  NGB_DATAGRID_DEFAULT_PAGEABLE,
  ngbResolvePageableSettings,
} from './datagrid-pageable';

describe('ngbResolvePageableSettings', () => {
  it('returns null when pagination is disabled', () => {
    expect(ngbResolvePageableSettings(false)).toBeNull();
    expect(ngbResolvePageableSettings(undefined, { enablePagination: false })).toBeNull();
  });

  it('merges object pageable with defaults including position', () => {
    expect(ngbResolvePageableSettings({ buttonCount: 5, pageSizes: [8, 16] })).toEqual({
      ...NGB_DATAGRID_DEFAULT_PAGEABLE,
      buttonCount: 5,
      pageSizes: [8, 16],
    });
  });

  it('maps legacy enablePagination to pageSizes from pageSizeOptions', () => {
    expect(
      ngbResolvePageableSettings(false, { enablePagination: true, pageSizeOptions: [4, 8, 12] })
    ).toEqual({
      ...NGB_DATAGRID_DEFAULT_PAGEABLE,
      pageSizes: [4, 8, 12],
    });
  });
});
