import {
  ChangeDetectionStrategy,
  Component,
  Input,
  Output,
  EventEmitter,
  QueryList,
  ViewChildren,
  ElementRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgbTreeNode, NgbTreeType, NgbTreeI18n } from './tree.types';

@Component({
  selector: 'ngb-tree',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="d-flex gap-2 mb-2">
      <button type="button" class="btn btn-sm btn-outline-secondary" (click)="expandAllNodes()" [attr.aria-label]="i18n?.expandAll || 'Expand all'">
        {{ i18n?.expandAll || 'Expand all' }}
      </button>
      <button type="button" class="btn btn-sm btn-outline-secondary" (click)="collapseAllNodes()" [attr.aria-label]="i18n?.collapseAll || 'Collapse all'">
        {{ i18n?.collapseAll || 'Collapse all' }}
      </button>
    </div>

    <ul class="list-unstyled mb-0" role="tree" [attr.aria-label]="i18n?.treeLabel || 'Tree'">
      <ng-container *ngFor="let node of nodes; let i = index; trackBy: trackById">
        <ng-container *ngTemplateOutlet="renderNode; context: { $implicit: node, level: 1, index: i }"></ng-container>
      </ng-container>
    </ul>

    <ng-template #renderNode let-node let-level="level" let-index="index">
      <li
        class="d-flex align-items-start"
        role="treeitem"
        [attr.aria-expanded]="hasChildren(node) ? !!node.expanded : null"
        [attr.aria-level]="level"
      >
        <ng-container *ngIf="hasChildren(node); else leafSpacer">
          <button
            #nodeBtn
            type="button"
            class="btn btn-sm px-1"
            (click)="toggleNode(node)"
            (keydown)="onNodeKeydown($event, node)"
            [attr.aria-label]="(node.expanded ? i18n?.collapse || 'Collapse' : i18n?.expand || 'Expand') + ' ' + node.label"
          >
            <span *ngIf="type === 'json'" class="bi" [ngClass]="node.expanded ? minusIcon : plusIcon" aria-hidden="true"></span>
            <span *ngIf="type !== 'json'" class="bi" [ngClass]="node.expanded ? collapseIcon : expandIcon" aria-hidden="true"></span>
          </button>
        </ng-container>
        <ng-template #leafSpacer>
          <span class="d-inline-block px-1" style="width: 1.5rem;"></span>
        </ng-template>

        <label class="form-check d-inline-flex align-items-center gap-2 flex-grow-1 mb-0">
          <input
            *ngIf="showCheckbox"
            type="checkbox"
            class="form-check-input"
            [checked]="!!node.selected"
            [disabled]="node.disabled"
            (change)="toggleSelection(node, $event.target.checked)"
            [attr.aria-label]="(i18n?.select || 'Select') + ' ' + node.label"
          />
          <span class="form-check-label">{{ node.label }}</span>
        </label>
      </li>

      <ul
        *ngIf="node.expanded && hasChildren(node)"
        class="list-unstyled ms-4"
        role="group"
      >
        <ng-container *ngFor="let child of node.children; let ci = index; trackBy: trackById">
          <ng-container *ngTemplateOutlet="renderNode; context: { $implicit: child, level: level + 1, index: ci }"></ng-container>
        </ng-container>
      </ul>
    </ng-template>
  `,
})
export class NgbTreeComponent {
  @Input() nodes: NgbTreeNode[] = [];
  @Input() type: NgbTreeType = 'text';
  @Input() showCheckbox = false;
  @Input() i18n?: NgbTreeI18n;
  @Input() expandIcon = 'bi-caret-right-fill';
  @Input() collapseIcon = 'bi-caret-down-fill';
  @Input() plusIcon = 'bi-file-plus-fill';
  @Input() minusIcon = 'bi-file-minus-fill';

  @Output() expand = new EventEmitter<NgbTreeNode>();
  @Output() collapse = new EventEmitter<NgbTreeNode>();
  @Output() expandAll = new EventEmitter<void>();
  @Output() collapseAll = new EventEmitter<void>();
  @Output() selectionChange = new EventEmitter<NgbTreeNode[]>();

  @ViewChildren('nodeBtn', { read: ElementRef }) nodeButtons!: QueryList<ElementRef<HTMLButtonElement>>;

  trackById = (_: number, node: NgbTreeNode) => node.id;

  hasChildren(node: NgbTreeNode) {
    return Array.isArray(node.children) && node.children.length > 0;
  }

  toggleNode(node: NgbTreeNode) {
    if (!this.hasChildren(node)) return;
    node.expanded = !node.expanded;
    node.expanded ? this.expand.emit(node) : this.collapse.emit(node);
  }

  toggleSelection(node: NgbTreeNode, value: boolean) {
    node.selected = value;
    this.selectionChange.emit(this.collectSelection(this.nodes));
  }

  expandAllNodes() {
    this.setExpanded(this.nodes, true);
    this.expandAll.emit();
  }

  collapseAllNodes() {
    this.setExpanded(this.nodes, false);
    this.collapseAll.emit();
  }

  onNodeKeydown(event: KeyboardEvent, node: NgbTreeNode) {
    const key = event.key;
    const target = event.target as HTMLElement;
    if (key === 'Enter' || key === ' ') {
      event.preventDefault();
      this.toggleNode(node);
    } else if (key === 'ArrowRight') {
      if (this.hasChildren(node) && !node.expanded) {
        event.preventDefault();
        node.expanded = true;
        this.expand.emit(node);
      }
    } else if (key === 'ArrowLeft') {
      if (this.hasChildren(node) && node.expanded) {
        event.preventDefault();
        node.expanded = false;
        this.collapse.emit(node);
      }
    } else if (key === 'ArrowDown' || key === 'ArrowUp') {
      event.preventDefault();
      this.focusSibling(target, key === 'ArrowDown' ? 1 : -1);
    }
  }

  private focusSibling(current: HTMLElement, direction: 1 | -1) {
    const buttons = this.nodeButtons?.toArray().map((b) => b.nativeElement) || [];
    const idx = buttons.indexOf(current as HTMLButtonElement);
    if (idx === -1) return;
    const next = buttons[idx + direction];
    next?.focus();
  }

  private setExpanded(nodes: NgbTreeNode[], expanded: boolean) {
    for (const n of nodes) {
      if (this.hasChildren(n)) {
        n.expanded = expanded;
        this.setExpanded(n.children || [], expanded);
      }
    }
  }

  private collectSelection(nodes: NgbTreeNode[], acc: NgbTreeNode[] = []): NgbTreeNode[] {
    for (const n of nodes) {
      if (n.selected) acc.push(n);
      if (this.hasChildren(n)) this.collectSelection(n.children!, acc);
    }
    return acc;
  }
}
