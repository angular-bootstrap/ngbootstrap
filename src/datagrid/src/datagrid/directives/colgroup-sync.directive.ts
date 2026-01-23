import { AfterViewInit, Directive, ElementRef, HostListener, Input, OnDestroy } from '@angular/core';

const MIN_WIDTH = 40;
const MAX_WIDTH = 320;
const MAX_SAMPLE_ROWS = 50;
const CHAR_WIDTH_FACTOR = 0.6;
const CHROME_TOLERANCE = 12; // small buffer to ignore reapplication of padding/borders

type SyncRole = 'header' | 'body';

interface SyncEntry {
  header?: NgbSyncColgroupDirective;
  bodies: Set<NgbSyncColgroupDirective>;
  widths?: number[];
}

@Directive({
  selector: '[ngbSyncColgroup]',
  standalone: true
})
export class NgbSyncColgroupDirective implements AfterViewInit, OnDestroy {
  @Input('ngbSyncColgroup') syncId!: string;
  @Input() syncRole: SyncRole = 'header';

  private static registry = new Map<string, SyncEntry>();
  private mutationObserver?: MutationObserver;
  private resizeObserver?: ResizeObserver;
  private rafId: number | null = null;

  constructor(private el: ElementRef<HTMLElement>) {}

  ngAfterViewInit(): void {
    if (!this.syncId) return;
    const entry = this.ensureEntry();
    if (this.syncRole === 'header') {
      entry.header = this;
      this.measureAndDistribute();
    } else {
      entry.bodies.add(this);
      if (entry.header) entry.header.measureAndDistribute();
      if (entry.widths?.length) this.apply(entry.widths);
      this.startObservers();
    }
  }

  ngOnDestroy(): void {
    if (!this.syncId) return;
    if (this.rafId != null) cancelAnimationFrame(this.rafId);
    this.mutationObserver?.disconnect();
    this.resizeObserver?.disconnect();
    const entry = NgbSyncColgroupDirective.registry.get(this.syncId);
    if (!entry) return;
    if (entry.header === this) entry.header = undefined;
    entry.bodies.delete(this);
    if (!entry.header && entry.bodies.size === 0) {
      NgbSyncColgroupDirective.registry.delete(this.syncId);
    }
  }

  @HostListener('window:resize')
  onResize(): void {
    if (this.syncRole === 'header') this.measureAndDistribute();
  }

  measureAndDistribute(): void {
    const widths = this.measure();
    if (!widths.length) return;
    const entry = this.ensureEntry();
    if (entry.widths && this.areWidthsEqual(entry.widths, widths)) return;
    entry.widths = widths;
    this.apply(widths);
    entry.bodies.forEach(b => b.apply(widths));
  }

  private ensureEntry(): SyncEntry {
    let entry = NgbSyncColgroupDirective.registry.get(this.syncId);
    if (!entry) {
      entry = { bodies: new Set<NgbSyncColgroupDirective>() };
      NgbSyncColgroupDirective.registry.set(this.syncId, entry);
    }
    return entry;
  }

  private startObservers(): void {
    const bodyTable = this.tableEl();
    const tbody = bodyTable?.querySelector('tbody');
    if (tbody && typeof MutationObserver !== 'undefined') {
      this.mutationObserver = new MutationObserver(() => this.scheduleMeasure());
      this.mutationObserver.observe(tbody, { childList: true, subtree: true, characterData: true });
    }
    if (bodyTable && typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(() => this.scheduleMeasure());
      this.resizeObserver.observe(bodyTable);
    }
  }

  private scheduleMeasure(): void {
    if (this.rafId != null) return;
    this.rafId = requestAnimationFrame(() => {
      this.rafId = null;
      const entry = NgbSyncColgroupDirective.registry.get(this.syncId);
      entry?.header?.measureAndDistribute();
    });
  }

  private colElements(): HTMLTableColElement[] {
    return Array.from(this.el.nativeElement.querySelectorAll('col'));
  }

  private tableEl(): HTMLTableElement | null {
    return this.el.nativeElement.closest('table');
  }

  private firstBodyForSync(): HTMLTableElement | null {
    const entry = NgbSyncColgroupDirective.registry.get(this.syncId);
    const bodyDir = this.syncRole === 'body'
      ? this
      : entry ? Array.from(entry.bodies.values())[0] : undefined;
    return bodyDir?.tableEl() ?? null;
  }

  private measure(): number[] {
    const bodyTable = this.firstBodyForSync();
    const cols = this.colElements();
    const entry = NgbSyncColgroupDirective.registry.get(this.syncId);
    if (!cols.length) return [];

    if (!bodyTable) {
      return entry?.widths ?? [];
    }

    const bodyRows = Array.from(bodyTable.querySelectorAll('tbody tr')).slice(0, MAX_SAMPLE_ROWS);
    const headerTable = this.syncRole === 'header' ? this.tableEl() : null;
    const headerRow = headerTable?.querySelector('thead tr');

    return cols.map((col, colIndex) => {
      const fixedWidth = (col.getAttribute('data-fixed') ?? '').toLowerCase() === 'true';
      if (fixedWidth) {
        const explicit = parseFloat(col.style.width || '') || MIN_WIDTH;
        return Math.min(Math.max(explicit, MIN_WIDTH), MAX_WIDTH);
      }
      
      // Measure header content width if available
      let headerContentWidth = 0;
      if (headerRow) {
        const th = headerRow.querySelectorAll('th')[colIndex] as HTMLElement | undefined;
        if (th) {
          headerContentWidth = this.measureCellContent(th);
        }
      }
      
      // Measure body content width
      let maxContent = 0;
      for (const tr of bodyRows) {
        const td = tr.querySelectorAll('td')[colIndex] as HTMLElement | undefined;
        if (!td) continue;
        maxContent = Math.max(maxContent, this.measureCellContent(td));
        if (maxContent >= MAX_WIDTH) break;
      }
      
      // Use the maximum of header and body content widths
      let finalContent = Math.max(headerContentWidth, maxContent);
      if (finalContent === 0) finalContent = MIN_WIDTH;

      let width = Math.min(Math.max(finalContent, MIN_WIDTH), MAX_WIDTH);
      const prev = entry?.widths?.[colIndex];
      if (prev && width > prev) {
        // If the only change is re-adding cell chrome (common when interactive elements span the cell),
        // keep the previous stable width to avoid incremental growth.
        const delta = width - prev;
        if (delta <= CHROME_TOLERANCE) width = prev;
      }
      return width;
    });
  }

  private apply(widths: number[]) {
    const cols = this.colElements();
    widths.forEach((w, i) => {
      const col = cols[i];
      if (!col) return;
      col.style.width = w ? `${w}px` : '';
    });
  }

  private measureCellContent(cell: HTMLElement): number {
    const style = getComputedStyle(cell);
    const cellClientWidth = cell.clientWidth;
    const cellRect = cell.getBoundingClientRect();
    const chrome =
      (parseFloat(style.paddingLeft) || 0) +
      (parseFloat(style.paddingRight) || 0) +
      (parseFloat(style.borderLeftWidth) || 0) +
      (parseFloat(style.borderRightWidth) || 0);

    const interactiveEls = Array.from(cell.querySelectorAll<HTMLElement>('input, select, textarea, button'));
    let interactiveWidth: number | null = null;
    if (interactiveEls.length) {
      interactiveWidth = interactiveEls.reduce((total, el) => {
        const rect = el.getBoundingClientRect();
        const elStyle = getComputedStyle(el);
        const widthStr = (el.style.width || elStyle.width || '').toString().trim();
        const usesPercentWidth = widthStr.endsWith('%');
        const matchesCellWidth =
          (!!cellClientWidth && rect.width && Math.abs(rect.width - cellClientWidth) <= 1) ||
          (cellRect.width > 0 && rect.width > 0 && Math.abs(rect.width - cellRect.width) <= 1);
        const spansCell = usesPercentWidth || matchesCellWidth;
        const margin = (parseFloat(elStyle.marginLeft) || 0) + (parseFloat(elStyle.marginRight) || 0);
        if (spansCell) {
          const textWidth = this.measureTextWidth((el.textContent ?? '').trim(), elStyle);
          const paddingBorder =
            (parseFloat(elStyle.paddingLeft) || 0) +
            (parseFloat(elStyle.paddingRight) || 0) +
            (parseFloat(elStyle.borderLeftWidth) || 0) +
            (parseFloat(elStyle.borderRightWidth) || 0);
          return total + Math.ceil(textWidth + paddingBorder + margin);
        }
        const rectWidth = rect.width || parseFloat(elStyle.width) || ((el.textContent ?? '').length * ((parseFloat(elStyle.fontSize) || 14) * CHAR_WIDTH_FACTOR));
        return total + rectWidth + margin;
      }, 0);
      interactiveWidth = Math.ceil((interactiveWidth || 0) + chrome);
    }

    const text = (cell.textContent ?? '').trim();
    const textWidth = Math.ceil(this.measureTextWidth(text, style) + chrome);
    if (interactiveWidth != null) {
      return Math.max(textWidth, interactiveWidth);
    }
    return textWidth;
  }

  private areWidthsEqual(prev: number[], next: number[]): boolean {
    if (prev.length !== next.length) return false;
    return prev.every((v, i) => v === next[i]);
  }

  private measureTextWidth(text: string, style: CSSStyleDeclaration): number {
    const fontSize = parseFloat(style.fontSize) || 14;
    const font = style.font || `${style.fontStyle} ${style.fontVariant} ${style.fontWeight} ${style.fontSize} / ${style.lineHeight} ${style.fontFamily}`;

    let contentWidth = 0;
    const isJsdom = typeof navigator !== 'undefined' && /jsdom/i.test(navigator.userAgent);
    const canvas = !isJsdom && typeof document !== 'undefined' ? document.createElement('canvas') : null;
    let ctx: CanvasRenderingContext2D | null = null;
    if (canvas?.getContext) {
      try {
        ctx = canvas.getContext('2d');
      } catch {
        ctx = null;
      }
    }
    if (ctx && font) {
      ctx.font = font;
      const metrics = ctx.measureText(text);
      contentWidth = metrics?.width ?? 0;
    }

    if (!contentWidth) {
      contentWidth = text.length * (fontSize * CHAR_WIDTH_FACTOR);
    }
    return contentWidth;
  }
}
