import { PdfExportAdapter, PdfExportPayload } from '../services/export.services';

const PAGE_SIZES: Record<string, [number, number]> = {
  A4: [595.28, 841.89],
  Letter: [612, 792],
};

export class JsPdfAdapter implements PdfExportAdapter {
  async export(payload: PdfExportPayload) {
    const pdf = this.createPdf(payload);
    const blob = new Blob([pdf], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${payload.fileName}.pdf`;
    link.click();
    URL.revokeObjectURL(url);
  }

  private createPdf({ fileName, columns, rows, options }: PdfExportPayload): string {
    const requestedSize = String(options?.pageSize || 'A4');
    const baseSize = PAGE_SIZES[requestedSize] || PAGE_SIZES.A4;
    const landscape = Boolean(options?.landscape);
    const [pageWidth, pageHeight] = landscape ? [baseSize[1], baseSize[0]] : baseSize;
    const margin = this.resolveMargin(options?.margins);
    const lineHeight = 14;
    const maxLines = Math.max(1, Math.floor((pageHeight - margin.top - margin.bottom - 52) / lineHeight));
    const tableLines = this.toTableLines(columns, rows);
    const pages = this.chunk(tableLines, maxLines);
    const objects: string[] = [];
    const pageIds: number[] = [];

    objects.push('<< /Type /Catalog /Pages 2 0 R >>');
    objects.push('');

    for (const [index, lines] of pages.entries()) {
      const pageObjectId = objects.length + 1;
      const contentObjectId = pageObjectId + 1;
      pageIds.push(pageObjectId);
      objects.push(
        `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /Font << /F1 ${pages.length * 2 + 3} 0 R >> >> /Contents ${contentObjectId} 0 R >>`
      );
      objects.push(this.contentStream(fileName, lines, index + 1, pages.length, pageHeight, margin, lineHeight));
    }

    objects[1] = `<< /Type /Pages /Kids [${pageIds.map(id => `${id} 0 R`).join(' ')}] /Count ${pageIds.length} >>`;
    objects.push('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');

    return this.serializePdf(objects);
  }

  private resolveMargin(margins?: [number, number, number, number]) {
    if (!Array.isArray(margins) || margins.length !== 4) {
      return { top: 40, right: 40, bottom: 40, left: 40 };
    }
    const [top, right, bottom, left] = margins.map(value => Math.max(16, Number(value) || 40));
    return { top, right, bottom, left };
  }

  private toTableLines(columns: string[], rows: any[]): string[] {
    const headers = columns.map(column => this.printable(column));
    const body = rows.map(row => columns.map(column => this.printable(row?.[column])));
    const widths = headers.map((header, index) =>
      Math.min(
        24,
        Math.max(
          header.length,
          ...body.map(values => values[index]?.length || 0)
        )
      )
    );
    const format = (values: string[]) => values.map((value, index) => value.padEnd(widths[index]).slice(0, widths[index])).join('  ');
    return [
      format(headers),
      widths.map(width => '-'.repeat(width)).join('  '),
      ...body.map(format),
    ];
  }

  private contentStream(
    fileName: string,
    lines: string[],
    page: number,
    totalPages: number,
    pageHeight: number,
    margin: { top: number; left: number },
    lineHeight: number
  ): string {
    const commands = [
      'BT',
      `/F1 16 Tf ${margin.left} ${pageHeight - margin.top} Td (${this.pdfText(fileName)}) Tj`,
      `/F1 9 Tf 0 -24 Td (${this.pdfText(`Page ${page} of ${totalPages}`)}) Tj`,
      ...lines.map(line => `0 -${lineHeight} Td (${this.pdfText(line)}) Tj`),
      'ET',
    ].join('\n');
    return `<< /Length ${commands.length} >>\nstream\n${commands}\nendstream`;
  }

  private chunk<T>(items: T[], size: number): T[][] {
    const pages: T[][] = [];
    for (let index = 0; index < items.length; index += size) {
      pages.push(items.slice(index, index + size));
    }
    return pages.length ? pages : [[]];
  }

  private printable(value: unknown): string {
    if (value === null || value === undefined) {
      return '';
    }
    return String(value).replace(/[^\x20-\x7E]/g, '?').replace(/\s+/g, ' ').trim();
  }

  private pdfText(value: string): string {
    return value.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
  }

  private serializePdf(objects: string[]): string {
    let pdf = '%PDF-1.4\n';
    const offsets = [0];
    for (const [index, object] of objects.entries()) {
      offsets[index + 1] = pdf.length;
      pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
    }
    const xrefOffset = pdf.length;
    pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
    for (let index = 1; index <= objects.length; index++) {
      pdf += `${String(offsets[index]).padStart(10, '0')} 00000 n \n`;
    }
    pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
    return pdf;
  }
}
