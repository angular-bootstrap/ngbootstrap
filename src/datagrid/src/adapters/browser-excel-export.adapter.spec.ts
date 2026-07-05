import { BrowserExcelExportAdapter } from './browser-excel-export.adapter';

describe('BrowserExcelExportAdapter', () => {
  const originalCreateObjectUrl = URL.createObjectURL;
  const originalRevokeObjectUrl = URL.revokeObjectURL;
  let createObjectUrl: jest.Mock;
  let revokeObjectUrl: jest.Mock;

  beforeEach(() => {
    createObjectUrl = jest.fn(() => 'blob:excel-export');
    revokeObjectUrl = jest.fn();
    URL.createObjectURL = createObjectUrl;
    URL.revokeObjectURL = revokeObjectUrl;
  });

  afterEach(() => {
    URL.createObjectURL = originalCreateObjectUrl;
    URL.revokeObjectURL = originalRevokeObjectUrl;
    jest.restoreAllMocks();
  });

  it('downloads an Excel-compatible workbook without third-party spreadsheet dependencies', async () => {
    const click = jest.fn();
    const appendChild = jest.spyOn(document.body, 'appendChild');
    const originalCreateElement = document.createElement.bind(document);

    jest.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
      const element = originalCreateElement(tagName);
      if (tagName.toLowerCase() === 'a') {
        element.click = click;
      }
      return element;
    });

    await new BrowserExcelExportAdapter().export({
      fileName: 'orders',
      sheetName: 'Orders/Export',
      columns: [
        { key: 'id', title: 'ID' },
        { key: 'name', title: 'Name' }
      ],
      rows: [{ id: 1, name: 'First & second' }]
    });

    const anchor = appendChild.mock.calls[0]?.[0] as HTMLAnchorElement;

    expect(createObjectUrl).toHaveBeenCalledWith(expect.any(Blob));
    expect(anchor.download).toBe('orders.xls');
    expect(anchor.href).toBe('blob:excel-export');
    expect(click).toHaveBeenCalledTimes(1);
    expect(revokeObjectUrl).toHaveBeenCalledWith('blob:excel-export');
  });
});
