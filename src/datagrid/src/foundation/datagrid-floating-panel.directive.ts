import {
  AfterViewInit,
  ChangeDetectorRef,
  Directive,
  ElementRef,
  HostBinding,
  Input,
  OnChanges,
  OnDestroy,
  Renderer2,
  SimpleChanges,
  inject,
} from '@angular/core';
import { DOCUMENT } from '@angular/common';

export type NgbDatagridFloatingPanelPlacement = 'menu' | 'operator';

/**
 * Popup-style overlay: anchors to a trigger, portals to document.body,
 * and uses viewport-fixed coordinates.
 */
@Directive({
  selector: '[ngbDatagridFloatingPanel]',
  standalone: true,
})
export class NgbDatagridFloatingPanelDirective implements OnChanges, AfterViewInit, OnDestroy {
  private readonly el = inject(ElementRef<HTMLElement>);
  private readonly renderer = inject(Renderer2);
  private readonly document = inject(DOCUMENT);
  private readonly cdr = inject(ChangeDetectorRef);

  @Input() ngbDatagridFloatingPanelAnchor?: HTMLElement | null;
  @Input() ngbDatagridFloatingPanelPlacement: NgbDatagridFloatingPanelPlacement = 'menu';

  @HostBinding('style.position') readonly hostPosition = 'fixed';
  @HostBinding('style.z-index') readonly hostZIndex = 1200;
  @HostBinding('style.margin') readonly hostMargin = '0';
  @HostBinding('style.transform') readonly hostTransform = 'none';
  @HostBinding('style.top.px') panelTop = 0;
  @HostBinding('style.left.px') panelLeft = 0;

  private active = false;
  private portaled = false;
  private originalParent: HTMLElement | null = null;
  private originalNextSibling: Node | null = null;

  private scrollListeners: Array<{ target: EventTarget; handler: () => void }> = [];
  private resizeObserver: ResizeObserver | null = null;
  private rafId: number | null = null;

  private readonly scheduleUpdate = () => {
    if (this.rafId != null) return;
    this.rafId = requestAnimationFrame(() => {
      this.rafId = null;
      if (this.active) this.updatePosition();
    });
  };

  ngOnChanges(changes: SimpleChanges): void {
    if ('ngbDatagridFloatingPanelAnchor' in changes) {
      this.tryActivate();
    }
  }

  ngAfterViewInit(): void {
    this.tryActivate();
  }

  private tryActivate(): void {
    if (!(this.ngbDatagridFloatingPanelAnchor instanceof HTMLElement)) {
      return;
    }
    if (this.active) {
      this.scheduleUpdate();
      return;
    }
    this.activate();
  }

  ngOnDestroy(): void {
    this.deactivate();
  }

  /** Called when anchor/layout may have changed after the panel opens. */
  reposition(): void {
    if (this.active) this.scheduleUpdate();
  }

  private activate(): void {
    if (this.active) return;
    this.active = true;
    const node = this.el.nativeElement;
    this.renderer.addClass(node, 'ngb-datagrid-floating-panel');
    this.renderer.addClass(node, 'show');
    this.syncThemeFromGrid(node);
    this.portalToBody();
    this.attachObservers();
    this.schedulePositionPasses();
  }

  private deactivate(): void {
    this.active = false;
    if (this.rafId != null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    this.detachObservers();
    const node = this.el.nativeElement;
    this.renderer.removeClass(node, 'ngb-datagrid-floating-panel');
    this.renderer.removeClass(node, 'show');
    this.renderer.removeAttribute(node, 'data-theme');
    this.panelTop = 0;
    this.panelLeft = 0;
    this.clearPositionStyles(node);
    this.restoreFromBody();
    this.cdr.markForCheck();
  }

  private portalToBody(): void {
    if (this.portaled) return;
    const node = this.el.nativeElement;
    const body = this.document.body;
    if (!body || node.parentElement === body) {
      this.portaled = true;
      return;
    }
    this.originalParent = node.parentElement;
    this.originalNextSibling = node.nextSibling;
    this.renderer.appendChild(body, node);
    this.portaled = true;
  }

  private restoreFromBody(): void {
    if (!this.portaled) return;
    const node = this.el.nativeElement;
    if (this.originalParent?.isConnected) {
      if (this.originalNextSibling && this.originalNextSibling.parentNode === this.originalParent) {
        this.renderer.insertBefore(this.originalParent, node, this.originalNextSibling);
      } else {
        this.renderer.appendChild(this.originalParent, node);
      }
    } else if (node.parentElement === this.document.body) {
      this.renderer.removeChild(this.document.body, node);
    }
    this.portaled = false;
    this.originalParent = null;
    this.originalNextSibling = null;
  }

  private schedulePositionPasses(): void {
    this.updatePosition();
    requestAnimationFrame(() => this.updatePosition());
    requestAnimationFrame(() => {
      requestAnimationFrame(() => this.updatePosition());
    });
  }

  private attachObservers(): void {
    this.detachObservers();

    const addScroll = (target: EventTarget) => {
      target.addEventListener('scroll', this.scheduleUpdate, { passive: true, capture: true });
      this.scrollListeners.push({ target, handler: this.scheduleUpdate });
    };

    addScroll(window);
    addScroll(this.document);

    const anchor = this.resolveAnchor();
    let parent: HTMLElement | null = anchor?.parentElement ?? null;
    const seen = new Set<EventTarget>();
    while (parent) {
      const { overflow, overflowY, overflowX } = getComputedStyle(parent);
      if (/(auto|scroll|overlay)/.test(`${overflow} ${overflowY} ${overflowX}`)) {
        if (!seen.has(parent)) {
          seen.add(parent);
          addScroll(parent);
        }
      }
      parent = parent.parentElement;
    }

    window.addEventListener('resize', this.scheduleUpdate, { passive: true });
    window.visualViewport?.addEventListener('scroll', this.scheduleUpdate, { passive: true });
    window.visualViewport?.addEventListener('resize', this.scheduleUpdate, { passive: true });

    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(() => this.scheduleUpdate());
      const anchorEl = this.resolveAnchor();
      if (anchorEl) this.resizeObserver.observe(anchorEl);
      this.resizeObserver.observe(this.el.nativeElement);
    }
  }

  private detachObservers(): void {
    for (const { target, handler } of this.scrollListeners) {
      target.removeEventListener('scroll', handler, true);
    }
    this.scrollListeners = [];
    window.removeEventListener('resize', this.scheduleUpdate);
    window.visualViewport?.removeEventListener('scroll', this.scheduleUpdate);
    window.visualViewport?.removeEventListener('resize', this.scheduleUpdate);
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;
  }

  private resolveAnchor(): HTMLElement | null {
    if (this.ngbDatagridFloatingPanelAnchor instanceof HTMLElement) {
      return this.ngbDatagridFloatingPanelAnchor;
    }
    return null;
  }

  /** Portaled panels must carry the grid theme so token SCSS applies on document.body. */
  private syncThemeFromGrid(panel: HTMLElement): void {
    const anchor = this.resolveAnchor();
    const grid =
      anchor?.closest('.ngb-grid') ??
      anchor?.closest('ngb-datagrid')?.querySelector('.ngb-grid') ??
      this.document.querySelector('.ngb-grid');
    const theme = grid?.getAttribute('data-theme');
    if (theme) {
      this.renderer.setAttribute(panel, 'data-theme', theme);
    } else {
      this.renderer.removeAttribute(panel, 'data-theme');
    }
  }

  private anchorRect(anchor: HTMLElement): DOMRect {
    const rect = anchor.getBoundingClientRect();
    if (rect.width > 0 || rect.height > 0) return rect;
    const host = anchor.closest('.grid-filter-menu-host, th') as HTMLElement | null;
    return host?.getBoundingClientRect() ?? rect;
  }

  private updatePosition(): void {
    const node = this.el.nativeElement;
    const anchor = this.resolveAnchor();
    if (!anchor) return;

    const rect = this.anchorRect(anchor);
    if (!rect.width && !rect.height) return;

    const margin = 4;
    const viewportPadding = 8;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    const panelWidth = Math.max(node.offsetWidth || 0, node.scrollWidth || 0, this.placementWidth());
    const panelHeight = Math.max(node.offsetHeight || 0, node.scrollHeight || 0);

    let top = rect.bottom + margin;
    let left = rect.right - panelWidth;

    if (left < viewportPadding) left = viewportPadding;
    if (left + panelWidth > viewportWidth - viewportPadding) {
      left = Math.max(viewportPadding, viewportWidth - panelWidth - viewportPadding);
    }

    if (panelHeight && top + panelHeight > viewportHeight - viewportPadding) {
      const above = rect.top - margin - panelHeight;
      if (above >= viewportPadding) top = above;
    }

    if (top < viewportPadding) top = viewportPadding;
    const maxTop = viewportHeight - panelHeight - viewportPadding;
    if (top > maxTop) top = Math.max(viewportPadding, maxTop);

    if (!Number.isFinite(top) || !Number.isFinite(left)) return;

    this.applyPosition(node, top, left);
  }

  private applyPosition(node: HTMLElement, top: number, left: number): void {
    const topPx = Math.round(top);
    const leftPx = Math.round(left);
    this.panelTop = topPx;
    this.panelLeft = leftPx;
    node.style.removeProperty('inset');
    node.style.setProperty('top', `${topPx}px`, 'important');
    node.style.setProperty('left', `${leftPx}px`, 'important');
    this.cdr.markForCheck();
  }

  private placementWidth(): number {
    return this.ngbDatagridFloatingPanelPlacement === 'operator' ? 220 : 288;
  }

  private clearPositionStyles(node: HTMLElement): void {
    for (const prop of [
      'position',
      'top',
      'left',
      'right',
      'bottom',
      'inset',
      'transform',
      'margin',
      'z-index',
    ] as const) {
      node.style.removeProperty(prop);
    }
  }
}
