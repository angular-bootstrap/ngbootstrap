import { Component, ViewChild } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { NgbTreeComponent } from './tree.component';
import { NgbTreeNode } from './tree.types';

@Component({
  standalone: true,
  imports: [NgbTreeComponent],
  template: `
    <ngb-tree
      [nodes]="nodes"
      [type]="type"
      [showCheckbox]="showCheckbox"
      (expand)="expanded.push($event.id)"
      (collapse)="collapsed.push($event.id)"
      (selectionChange)="selection = $event"
    ></ngb-tree>
  `,
})
class HostComponent {
  @ViewChild(NgbTreeComponent) tree!: NgbTreeComponent;
  type: 'text' | 'json' = 'text';
  showCheckbox = true;
  nodes: NgbTreeNode[] = [
    {
      id: 'a',
      label: 'Parent',
      expanded: true,
      children: [
        {
          id: 'a1',
          label: 'Child 1',
          children: [
            { id: 'a1-1', label: 'Grandchild 1' },
            { id: 'a1-2', label: 'Grandchild 2' },
          ],
        },
        { id: 'a2', label: 'Child 2' },
      ],
    },
  ];

  expanded: string[] = [];
  collapsed: string[] = [];
  selection: NgbTreeNode[] = [];
}

describe('NgbTreeComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('renders nodes and handles expand/collapse', () => {
    const buttons = fixture.debugElement.queryAll(By.css('li[role="treeitem"] > button'));
    expect(buttons.length).toBeGreaterThan(0);

    // shows caret-down icon when expanded
    expect(buttons[0].query(By.css('.bi-caret-down-fill'))).toBeTruthy();

    buttons[0].nativeElement.click(); // collapse
    fixture.detectChanges();
    expect(host.collapsed).toContain('a');
    expect(buttons[0].query(By.css('.bi-caret-right-fill'))).toBeTruthy();

    buttons[0].nativeElement.click(); // expand
    fixture.detectChanges();
    expect(host.expanded).toContain('a');
    expect(buttons[0].query(By.css('.bi-caret-down-fill'))).toBeTruthy();
  });

  it('emits selectionChange when checkbox toggled', () => {
    const checkbox = fixture.debugElement.query(By.css('input[type="checkbox"]')).nativeElement as HTMLInputElement;
    checkbox.click();
    fixture.detectChanges();
    expect(host.selection.map((n) => n.id)).toContain('a');
  });

  it('expands all nested levels', () => {
    host.tree.collapseAllNodes();
    fixture.detectChanges();
    expect(host.nodes[0].expanded).toBe(false);
    host.tree.expandAllNodes();
    fixture.detectChanges();
    expect(host.nodes[0].expanded).toBe(true);
    expect(host.nodes[0].children?.[0].expanded).toBe(true);
  });

  it('uses plus/minus file icons when type is json', () => {
    host.type = 'json';
    host.nodes[0].expanded = false;
    fixture.detectChanges();

    const firstNodeButton = fixture.debugElement.queryAll(By.css('li[role="treeitem"] > button'))[0];
    expect(firstNodeButton.query(By.css('.bi-file-plus-fill'))).toBeTruthy();

    firstNodeButton.nativeElement.click();
    fixture.detectChanges();
    expect(firstNodeButton.query(By.css('.bi-file-minus-fill'))).toBeTruthy();
  });
});
