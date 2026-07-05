import { JsPdfAdapter } from './jsdf.adapter';

describe('JsPdfAdapter', () => {
  it('creates a dependency-free PDF document', () => {
    const adapter = new JsPdfAdapter() as unknown as {
      createPdf(payload: {
        fileName: string;
        columns: string[];
        rows: Array<Record<string, unknown>>;
        options?: { landscape?: boolean };
      }): string;
    };

    const pdf = adapter.createPdf({
      fileName: 'users',
      columns: ['name', 'role'],
      rows: [
        { name: 'Ava Patel', role: 'Admin' },
        { name: 'Noah Chen', role: 'Editor' },
      ],
      options: { landscape: true },
    });

    expect(pdf.startsWith('%PDF-1.4')).toBe(true);
    expect(pdf).toContain('/Type /Catalog');
    expect(pdf).toContain('(users) Tj');
    expect(pdf).toContain('(Ava Patel');
    expect(pdf).toContain('xref');
    expect(pdf).toContain('%%EOF');
  });
});
