import {
  ChangeDetectionStrategy,
  Component,
  OnChanges,
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
  styleUrls: ['../../../styles/_controls.scss'],
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
      @for (node of nodes; track trackById($index, node); let i = $index) {
        <ng-container *ngTemplateOutlet="renderNode; context: { $implicit: node, level: 1, index: i }"></ng-container>
      }
    </ul>

    <ng-template #renderNode let-node let-level="level" let-index="index">
      <li
        class="d-flex align-items-start flex-wrap"
        #nodeItem
        [attr.tabindex]="activeNodeId === node.id || (activeNodeId === null && level === 1 && index === 0) ? 0 : -1"
        [attr.aria-label]="node.label"
        [attr.aria-checked]="showCheckbox ? !!node.selected : null"
        [attr.aria-disabled]="node.disabled || null"
        (focus)="activeNodeId = node.id"
        (keydown)="onNodeKeydown($event, node)"
        role="treeitem"
        [attr.aria-expanded]="hasChildren(node) ? !!node.expanded : null"
        [attr.aria-level]="level"
      >
        @if (hasChildren(node)) {
          <button
            #nodeBtn
            type="button"
            class="btn btn-sm px-1"
            (click)="toggleNode(node)"
            tabindex="-1"
            [attr.aria-label]="(node.expanded ? i18n?.collapse || 'Collapse' : i18n?.expand || 'Expand') + ' ' + node.label"
          >
            @if (type === 'json') {
              <span class="bi" [ngClass]="node.expanded ? minusIcon : plusIcon" aria-hidden="true"></span>
            } @else {
              <span class="bi" [ngClass]="node.expanded ? collapseIcon : expandIcon" aria-hidden="true"></span>
            }
          </button>
        } @else {
          <span class="d-inline-block px-1" style="width: 1.5rem;"></span>
        }

        <label class="form-check d-inline-flex align-items-center gap-2 flex-grow-1 mb-0">
          @if (showCheckbox) {
          <input
            type="checkbox"
            tabindex="-1"
            class="form-check-input"
            [checked]="!!node.selected"
            [disabled]="node.disabled"
            (change)="toggleSelection(node, $event.target.checked)"
            [attr.aria-label]="(i18n?.select || 'Select') + ' ' + node.label"
          />
          }
          <span class="form-check-label">{{ node.label }}</span>
        </label>
      @if (node.expanded && hasChildren(node)) {
      <ul
        class="list-unstyled ms-4 w-100"
        role="group"
      >
        @for (child of node.children; track trackById($index, child); let ci = $index) {
          <ng-container *ngTemplateOutlet="renderNode; context: { $implicit: child, level: level + 1, index: ci }"></ng-container>
        }
      </ul>
      }
      </li>
    </ng-template>
  `,
})
export class NgbTreeComponent implements OnChanges {
  protected activeNodeId: NgbTreeNode['id'] | null = null;
  private searchText = '';
  private searchTime = 0;

  ngOnChanges(): void {
    if (!this.visibleNodes().some(node => node.id === this.activeNodeId)) this.activeNodeId = null;
  }
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
    if (node.expanded && this.containsNode(node.children ?? [], this.activeNodeId)) this.activeNodeId = node.id;
    node.expanded = !node.expanded;
    node.expanded ? this.expand.emit(node) : this.collapse.emit(node);
  }

  toggleSelection(node: NgbTreeNode, value: boolean) {
    if (node.disabled) return;
    node.selected = value;
    this.selectionChange.emit(this.collectSelection(this.nodes));
  }

  expandAllNodes() {
    this.setExpanded(this.nodes, true);
    this.expandAll.emit();
  }

  collapseAllNodes() {
    this.activeNodeId = null;
    this.setExpanded(this.nodes, false);
    this.collapseAll.emit();
  }

  private visibleNodes(nodes = this.nodes): NgbTreeNode[] {
    const visible: NgbTreeNode[] = [];
    for (const node of nodes) {
      visible.push(node);
      if (node.expanded) visible.push(...this.visibleNodes(node.children ?? []));
    }
    return visible;
  }

  private containsNode(nodes: NgbTreeNode[], id: NgbTreeNode['id'] | null): boolean {
    return nodes.some(node => node.id === id || this.containsNode(node.children ?? [], id));
  }

  onNodeKeydown(event: KeyboardEvent, node: NgbTreeNode): void {
    // Nested tree items bubble; only the owning item handles its event.
    const target = event.target as HTMLElement;
    const owner = target.closest('[role="treeitem"]');
    if (owner !== event.currentTarget || target.matches('input')) return;
    const key = event.key;
    const nodes = this.visibleNodes();
    const index = nodes.indexOf(node);
    let next = index;
    if (key === 'Enter' || key === ' ') {
      if (target.matches('button')) return;
      event.preventDefault();
      if (key === ' ' && this.showCheckbox) this.toggleSelection(node, !node.selected);
      else this.toggleNode(node);
      return;
    }
    if (key === 'ArrowRight') {
      if (this.hasChildren(node) && !node.expanded) this.toggleNode(node);
      else if (this.hasChildren(node)) next = index + 1;
    } else if (key === 'ArrowLeft') {
      if (this.hasChildren(node) && node.expanded) this.toggleNode(node);
      else {
        const parent = nodes.find(item => item.children?.includes(node));
        if (parent) next = nodes.indexOf(parent);
      }
    } else if (key === 'ArrowDown') next = Math.min(index + 1, nodes.length - 1);
    else if (key === 'ArrowUp') next = Math.max(index - 1, 0);
    else if (key === 'Home') next = 0;
    else if (key === 'End') next = nodes.length - 1;
    else if (key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey && !event.isComposing) {
      const now = Date.now();
      this.searchText = (now - this.searchTime < 700 ? this.searchText : '') + key.toLocaleLowerCase();
      this.searchTime = now;
      const query = [...this.searchText].every(char => char === this.searchText[0]) ? this.searchText[0] : this.searchText;
      for (let offset = 1; offset <= nodes.length; offset++) {
        const candidate = (index + offset) % nodes.length;
        if (nodes[candidate].label.toLocaleLowerCase().startsWith(query)) { next = candidate; break; }
      }
    } else return;
    event.preventDefault();
    event.stopPropagation();
    this.activeNodeId = nodes[next]?.id ?? null;
    const tree = owner?.closest('[role="tree"]');
    const items = [...(tree?.querySelectorAll<HTMLElement>('[role="treeitem"]') ?? [])]
      .filter(item => item.closest('[role="tree"]') === tree);
    items[next]?.focus();
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
