import { ngbParseGridClipboard, ngbSerializeGridClipboard } from './clipboard';

describe('grid clipboard TSV', () => {
  it('round trips quotes, tabs, empty cells, multiline text and literal formulas', () => {
    const rows = [['a\tb', '"quoted"', ''], ['line\nbreak', '=SUM(A1)', 'last']];
    expect(ngbParseGridClipboard(ngbSerializeGridClipboard(rows))).toEqual(rows);
    expect(ngbParseGridClipboard('a\tb\r\nc\td\r\n')).toEqual([['a', 'b'], ['c', 'd']]);
    expect(ngbParseGridClipboard('')).toEqual([['']]);
  });
  it('rejects ragged, malformed and oversized clipboard text', () => {
    for (const text of ['a\tb\nc', '"open', '"closed"tail', 'bad"quote', 'x'.repeat(1_048_577), 'a\t'.repeat(10000), '🙂'.repeat(262145)]) {
      expect(() => ngbParseGridClipboard(text)).toThrow();
    }
  });
});
