export const NGB_GRID_PASTE_CELL_LIMIT = 10_000;
export const NGB_GRID_PASTE_BYTE_LIMIT = 1_048_576;

export function ngbGridClipboardByteLength(text: string): number {
  let bytes = 0;
  for (const char of text) {
    const code = char.codePointAt(0)!;
    bytes += code < 0x80 ? 1 : code < 0x800 ? 2 : code < 0x10000 ? 3 : 4;
  }
  return bytes;
}

/** TSV with CSV-style quoting; rejects ragged or malformed matrices. */
export function ngbParseGridClipboard(text: string): string[][] {
  if (ngbGridClipboardByteLength(text) > NGB_GRID_PASTE_BYTE_LIMIT) throw new Error('Clipboard text exceeds 1 MiB.');
  const rows: string[][] = []; let row: string[] = []; let value = ''; let quoted = false; let closed = false; let cells = 0;
  const cell = () => {
    if (++cells > NGB_GRID_PASTE_CELL_LIMIT) throw new Error('Clipboard text exceeds 10000 cells.');
    row.push(value); value = ''; closed = false;
  };
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (quoted) {
      if (char === '"') {
        if (text[i + 1] === '"') { value += '"'; i++; } else { quoted = false; closed = true; }
      } else value += char;
    } else if (char === '\t') cell();
    else if (char === '\n' || char === '\r') {
      cell(); rows.push(row); row = [];
      if (char === '\r' && text[i + 1] === '\n') i++;
    } else if (char === '"' && value === '' && !closed) quoted = true;
    else {
      if (closed || char === '"') throw new Error('Malformed quoted clipboard value.');
      value += char;
    }
  }
  if (quoted) throw new Error('Unclosed quoted clipboard value.');
  if (row.length || value || closed || rows.length === 0 || !/[\r\n]$/.test(text)) { cell(); rows.push(row); }
  if (rows.some(r => r.length !== rows[0].length)) throw new Error('Clipboard rows must have the same number of cells.');
  return rows;
}

export function ngbSerializeGridClipboard(rows: readonly (readonly string[])[]): string {
  const text = rows.map(row => row.map(value => /[\t\r\n"]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value).join('\t')).join('\n');
  if (rows.reduce((n, row) => n + row.length, 0) > NGB_GRID_PASTE_CELL_LIMIT || ngbGridClipboardByteLength(text) > NGB_GRID_PASTE_BYTE_LIMIT) throw new Error('Selection exceeds clipboard limits.');
  return text;
}
