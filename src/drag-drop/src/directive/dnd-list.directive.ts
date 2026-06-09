import {
    Directive, ElementRef, EventEmitter, HostBinding, HostListener, Input, Output, inject
} from '@angular/core';
import { NgbDndState, DndSession } from '../service/drag-state.service';

export interface NgbDndDropEvent<T> {
    item: T;
    fromIndex: number;
    toIndex: number;
    fromList: T[];
    toList: T[];
    sameList: boolean;
}

export interface DndCanDropPayload<T = any> {
  dragItem: T;        // item being dragged (best-effort if unknown)
  srcList: T[];       // source array (best-effort if unknown)
  srcIndex: number;   // index in source (best-effort if unknown)
  dstList: T[];       // destination array (this list’s [ngbDndList])
  dstIndex: number;   // intended insertion index
  isExternal: boolean;// srcList !== dstList
}

/** Guard function; return true to allow, false to block */
export type DndCanDropFn<T = any> = (payload: DndCanDropPayload<T>) => boolean;

@Directive({
    selector: '[ngbDndList]',
    standalone: true
})
export class NgbDndListDirective<T = unknown> {
    private el = inject(ElementRef<HTMLElement>);
    private state = inject(NgbDndState);
    
    @Input() dndChildrenKey: string | null = 'children';

    /** Bind your array here: <div [ngbDndList]="items"> */
    @Input('ngbDndList') list!: T[];
    /** Optional: group barrier across lists */
    @Input() dndGroup?: string;
    /** Disable this list */
    @Input() dndDisabled = false;

    /** NEW: clone if source wasn't a list (e.g. palette) */
    @Input() dndCloneOnDrop = false;
    /** NEW: custom clone function */
    @Input() dndCloneFn?: (item: T) => T;

    @Input() dndIsPalette = false;

    @Input() dndCanDrop: boolean | DndCanDropFn<any> = true;

    // (optional) visual feedback while hovering a denied list
    private _denied = false;
    @HostBinding('class.ngb-dnd-denied') get denied() { return this._denied; }

    @Input() dndAriaLabel?: string;
    @HostBinding('attr.aria-label') get ariaLabel() { return this.dndAriaLabel || null; }
    /** Fires after item is inserted */
    @Output() dndDropped = new EventEmitter<NgbDndDropEvent<T>>();

    @HostBinding('attr.role') role = 'list';

    @HostBinding('class.ngb-dnd-list') hostClass = true;

    // NEW: when the pointer is over this list while dragging
    private hover = false;
    @HostBinding('class.ngb-dnd-over') get isOver() { return this.hover; }

    // NEW: reflect whether the current drag can drop here (for CSS)
    private canDrop: boolean | null = null;
    @HostBinding('attr.data-drop-valid') get dataDropValid() {
        // values: "true" | "false" | null (attribute omitted)
        return this.canDrop === true ? 'true' : this.canDrop === false ? 'false' : null;
    }
    private placeholder?: HTMLElement;
    private lastIndex = -1;

    @HostListener('dragenter', ['$event'])
    onDragEnter(ev: DragEvent) {
        if (this.dndDisabled) return;
        const s = this.getSession(ev);
        // If there is an active drag and groups match, indicate hover
        if (s) {
            ev.preventDefault();
            this.hover = true;
            this.canDrop = true; // group check already done in getSession
        } else {
            // Drag exists but not compatible with this list (group mismatch)
            this.hover = true;
            this.canDrop = false;
        }
    }

    @HostListener('dragover', ['$event'])
    onDragOver(ev: DragEvent) {
        if (this.dndDisabled) return;

        const s = this.getSession(ev);
        if (!s) {
            // Not a compatible session → show invalid
            this.hover = true;
            this.canDrop = false;
            return;
        }

        ev.preventDefault();
        ev.stopPropagation();
        this.state.setActiveDropList(this);
        this.hover = true;
        this.canDrop = true;

        try { if (ev.dataTransfer) ev.dataTransfer.dropEffect = this.dndCloneOnDrop ? 'copy' : 'move'; } catch { }

        this.ensurePlaceholder();
        const idx = this.indexFromPointer(ev);
        if (idx !== this.lastIndex) {
            this.lastIndex = idx;
            this.positionPlaceholderAt(idx);
        }
    }

    @HostListener('dragleave', ['$event'])
    onDragLeave(ev: DragEvent) {
        // Only reset when actually leaving this list (not moving between children)
        if (!this.el.nativeElement.contains(ev.relatedTarget as Node)) {
            this.removePlaceholder();
            this.lastIndex = -1;
            this.hover = false;
            this.canDrop = null;
            this.state.clearActiveDropList(this);
        }
    }

    @HostListener('document:drop', ['$event'])
    onDocumentDrop(ev: DragEvent) {
        const activeDropList = this.state.getActiveDropList();
        const target = ev.target as Element | null;
        const host = this.el.nativeElement;
        const targetList = target?.closest?.('.ngb-dnd-list');
        const dropTargetsThisList = targetList === host;

        if (activeDropList && activeDropList !== this && !dropTargetsThisList) {
            this.resetVisualState();
            return;
        }

        if (!host.contains(ev.target as Node) && activeDropList !== this) {
            this.resetVisualState();
            return;
        }
        if (!activeDropList) {
            if (targetList && targetList !== host) {
                this.resetVisualState();
                return;
            }
        }

        const anyEv = ev as any;
        if (anyEv.__ngbHandled) return;
        anyEv.__ngbHandled = true;

        ev.preventDefault();
        this.performDrop(ev);

        this.resetVisualState();
    }

    @HostListener('drop', ['$event'])
    onDrop(ev: DragEvent) {
        if (this.dndDisabled) return;
        const activeDropList = this.state.getActiveDropList();
        const target = ev.target as Element | null;
        const targetList = target?.closest?.('.ngb-dnd-list');
        const dropTargetsThisList = targetList === this.el.nativeElement;
        if (activeDropList && activeDropList !== this && !dropTargetsThisList) {
            this.resetVisualState();
            return;
        }

        const anyEv = ev as any;
        if (anyEv.__ngbHandled) return;
        anyEv.__ngbHandled = true;

        ev.preventDefault();
        ev.stopPropagation();

        this.performDrop(ev);

        this.resetVisualState();
    }

    @HostListener('document:dragend')
    @HostListener('document:dragcancel')
    onDocumentDragFinished() {
        this.resetVisualState();
    }

    // helpers
    private getSession(ev: DragEvent): DndSession | null {
        // Chrome often returns "" during dragover/enter; try service fallback
        const sid = ev.dataTransfer?.getData('text/ngb-dnd') || null;
        let s = sid ? this.state.get(sid) : null;
        if (!s) s = this.state.getCurrent();         // ✅ fallback
        if (!s) return null;

        if (this.dndGroup && s.group && s.group !== this.dndGroup) return null;
        return s;
    }

    private ensurePlaceholder() {
        if (!this.placeholder) {
            const hostTag = this.el.nativeElement.tagName;
            if (hostTag === 'TBODY') {
                const row = document.createElement('tr');
                row.className = 'ngb-dnd-placeholder';
                row.setAttribute('aria-hidden', 'true');
                const cell = document.createElement('td');
                const sampleRow = this.el.nativeElement.querySelector('tr:not(.ngb-dnd-placeholder)');
                const colspan = sampleRow?.children?.length || 1;
                cell.colSpan = colspan;
                cell.style.padding = '0';
                cell.style.border = '0';
                cell.style.height = '0';
                const bar = document.createElement('div');
                bar.className = 'ngb-dnd-placeholder__bar';
                cell.appendChild(bar);
                row.appendChild(cell);
                this.placeholder = row;
            } else {
                this.placeholder = document.createElement('div');
                this.placeholder.className = 'ngb-dnd-placeholder';
                this.placeholder.setAttribute('aria-hidden', 'true');
            }
            this.el.nativeElement.appendChild(this.placeholder);
        }
    }
    private removePlaceholder() {
        if (this.placeholder?.parentElement) this.placeholder.parentElement.removeChild(this.placeholder);
        this.placeholder = undefined;
    }
    private resetVisualState() {
        this.removePlaceholder();
        this.lastIndex = -1;
        this.hover = false;
        this.canDrop = null;
        this._denied = false;
        this.state.clearActiveDropList(this);
    }
    private positionPlaceholderAt(index: number) {
        const host = this.el.nativeElement;
        const children = this.draggableChildren();
        const before = children[index];
        if (!before) host.appendChild(this.placeholder!);
        else host.insertBefore(this.placeholder!, before);
    }
    private indexFromPointer(ev: DragEvent) {
        const y = ev.clientY;
        const children = this.draggableChildren();
        for (let i = 0; i < children.length; i++) {
            const r = children[i].getBoundingClientRect();
            const mid = r.top + r.height / 2;
            if (y < mid) return i;
        }
        return children.length;
    }

    private draggableChildren(): HTMLElement[] {
        const host = this.el.nativeElement;
        const items = Array.from(host.children)
            .filter(c => c !== this.placeholder && (c as HTMLElement).classList.contains('ngb-dnd-item')) as HTMLElement[];
        if (items.length) return items;
        return Array.from(host.children).filter(c => c !== this.placeholder) as HTMLElement[];
    }

    private cloneItem(i: T): T {
        if (this.dndCloneFn) return this.dndCloneFn(i);
        // fallback shallow clone
        if (Array.isArray(i)) return (i.slice() as unknown) as T;
        if (i && typeof i === 'object') return { ...(i as Record<string, unknown>) } as T;
        return i; // primitive
    }

    private isDroppingIntoOwnDescendant(item: any, targetList: any[]): boolean {
        const key = this.dndChildrenKey;
        if (!key || !item) return false;

        const stack: any[][] = [];
        if (Array.isArray(item[key])) stack.push(item[key]);

        while (stack.length) {
            const arr = stack.pop()!;
            if (arr === targetList) return true;
            for (const child of arr) {
            const kids = child?.[key];
            if (Array.isArray(kids)) stack.push(kids);
            }
        }
        return false;
        }
    /**
     * Build a guard payload using whatever drag context you already store.
     * If some fields don’t exist in your code, the fallbacks keep it working.
     */
    private _buildGuardPayload(session: DndSession, dstIndex: number): DndCanDropPayload<any> {
        const srcList = (session.fromList as any[]) ?? [];
        const srcIndex = typeof session.fromIndex === 'number' ? session.fromIndex : -1;
        const dstList = this.list as any[];

        return {
            dragItem: session.item,
            srcList,
            srcIndex,
            dstList,
            dstIndex,
            isExternal: session.fromIsPalette === true || srcList !== dstList,
        };
    }

    /**
     * Compute destination index from the event position (no placeholder var needed).
     * Uses vertical list heuristics; adjust for horizontal if your list is horizontal.
     */
    private _computeDropIndex(ev: DragEvent): number {
    const host = (this as any)._host?.nativeElement
                ?? (this as any)._el?.nativeElement
                ?? (this as any).el?.nativeElement
                ?? (this as any).elementRef?.nativeElement
                ?? null;

    if (!host) return (this.list as any[])?.length ?? 0;

    const children = this.draggableChildren();
    const y = ev.clientY;

    for (let i = 0; i < children.length; i++) {
        const rect = children[i].getBoundingClientRect();
        const midY = rect.top + rect.height / 2;
        if (y < midY) return i;
    }
    return children.length;
    }
        // Evaluate the guard safely
    private _allowDrop<T>(payload: DndCanDropPayload<T>): boolean {
        const guard = this.dndCanDrop;
        if (typeof guard === 'boolean') return guard;
        try { return guard ? !!guard(payload) : true; } catch { return false; }
    }

    // Extract your existing onDrop logic into a single method:
    private performDrop(ev: DragEvent) {
        const session = this.getSession(ev);
        if (!session) return;

        const dstIndex = this._computeDropIndex(ev);

        // Guard check (block drop if not allowed)
        const payload = this._buildGuardPayload(session, dstIndex);
        if (!this._allowDrop(payload)) {
            ev.preventDefault();
            ev.stopPropagation();
            this._denied = true;   // cosmetic: adds .ngb-dnd-denied for styling
            return;                // ⛔ do not mutate arrays
        }
        this._denied = false;

        // ❗ block cycles: don't allow dropping an item into its own descendants
        if (this.isDroppingIntoOwnDescendant(session.item, this.list)) {
            // optional: visual/aural feedback
            this.state.announce?.(this.state.i18n.cannotDropHere());
            this.removePlaceholder();
            this.lastIndex = -1;
            return;
        }
        const targetIndex = this.lastIndex < 0 ? this.list.length : this.lastIndex;
        const fromList = (session.fromList as T[]) ?? undefined;
        const fromIndex = (session.fromIndex as number) ?? -1;
        const sameList = fromList === this.list;
        const isExternal = session.fromIsPalette === true || !fromList || fromIndex === -1;

        // ✅ External (palette): always transform/clone into canvas, and DO NOT remove from source.
        // ✅ Canvas↔Canvas: move by default; if you want to clone across canvas, set dndCloneOnDrop=true.
        const shouldCloneAcrossCanvas = this.dndCloneOnDrop && !sameList && !isExternal;

        const itemToInsert: T =
            isExternal
                ? this.cloneItem(session.item as T) // transform palette item to Panel
                : (shouldCloneAcrossCanvas ? this.cloneItem(session.item as T) : (session.item as T));

        // Remove from source ONLY for real moves within canvas
        if (!isExternal && !shouldCloneAcrossCanvas && fromIndex > -1) {
            fromList!.splice(fromIndex, 1);
        }

        // adjust index when reordering within same list and moving forward
        const insertAt = sameList && fromIndex > -1 && targetIndex > fromIndex
            ? targetIndex - 1
            : targetIndex;

        this.list.splice(insertAt, 0, itemToInsert);

        this.removePlaceholder();
        this.lastIndex = -1;

        this.dndDropped.emit({
            item: itemToInsert,
            fromIndex,
            toIndex: insertAt,
            fromList: fromList ?? [],
            toList: this.list,
            sameList
        });

        this.state.announce?.(this.state.i18n.dropped());

    }


}
