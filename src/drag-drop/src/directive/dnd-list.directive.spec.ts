import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { NgbDndListDirective } from './dnd-list.directive';
import { NgbDndItemDirective } from './dnd-item.directive';
import { NgbDndState } from '../service/drag-state.service';

@Component({
  standalone: true,
  imports: [NgbDndListDirective],
  template: `
    <table>
      <tbody [ngbDndList]="items">
        <tr><td>A</td><td>B</td><td>C</td></tr>
      </tbody>
    </table>
  `,
})
class TbodyHostComponent {
  items = ['a', 'b'];
}

@Component({
  standalone: true,
  imports: [NgbDndListDirective],
  template: `
    <div class="root-list" [ngbDndList]="root">
      <div class="child-list" [ngbDndList]="child"></div>
    </div>
  `,
})
class NestedListHostComponent {
  root = ['root'];
  child = ['child'];
}

@Component({
  standalone: true,
  imports: [NgbDndListDirective, NgbDndItemDirective],
  template: `
    <div [ngbDndList]="items">
      <div class="hint">Drop at root</div>
      <div class="item-a" [ngbDndItem]="items[0]" [dndIndex]="0">A</div>
      <div class="item-b" [ngbDndItem]="items[1]" [dndIndex]="1">B</div>
      <div class="hint">Drop at root</div>
    </div>
  `,
})
class HintListHostComponent {
  items = ['a', 'b'];
}

describe('NgbDndListDirective', () => {
  let fixture: ComponentFixture<TbodyHostComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TbodyHostComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TbodyHostComponent);
    fixture.detectChanges();
  });

  it('creates a table-row placeholder inside tbody hosts', () => {
    const debugEl = fixture.debugElement.query(By.directive(NgbDndListDirective));
    const directive = debugEl.injector.get(NgbDndListDirective) as any;
    const tbody = debugEl.nativeElement as HTMLTableSectionElement;

    directive.ensurePlaceholder();

    const placeholder = tbody.querySelector('tr.ngb-dnd-placeholder') as HTMLElement | null;
    expect(placeholder?.tagName).toBe('TR');
    expect(placeholder?.classList.contains('ngb-dnd-placeholder')).toBe(true);
    expect(placeholder?.firstElementChild?.tagName).toBe('TD');
    expect((placeholder?.firstElementChild as HTMLTableCellElement | null)?.colSpan).toBe(3);
  });

  it('treats drops from the same source array as same-list', () => {
    const debugEl = fixture.debugElement.query(By.directive(NgbDndListDirective));
    const directive = debugEl.injector.get(NgbDndListDirective) as any;
    const state = TestBed.inject(NgbDndState);

    const sessionId = state.createSession({
      item: 'a',
      fromList: fixture.componentInstance.items,
      fromIndex: 0,
    });

    directive.lastIndex = 1;
    const emitted: any[] = [];
    directive.dndDropped.subscribe((event: any) => emitted.push(event));

    const event = {
      preventDefault() {},
      stopPropagation() {},
      clientY: 0,
      dataTransfer: {
        getData: (type: string) => type === 'text/ngb-dnd' ? sessionId : '',
      },
    } as unknown as DragEvent;

    directive.performDrop(event);

    expect(emitted).toHaveLength(1);
    expect(emitted[0].sameList).toBe(true);
    expect(directive.lastIndex).toBe(-1);
    expect(directive.placeholder).toBeUndefined();
  });

  it('clears hover state and placeholder when the document drop happens outside the list', () => {
    const debugEl = fixture.debugElement.query(By.directive(NgbDndListDirective));
    const directive = debugEl.injector.get(NgbDndListDirective) as any;
    const tbody = debugEl.nativeElement as HTMLTableSectionElement;

    directive.hover = true;
    directive.canDrop = true;
    directive.lastIndex = 0;
    directive.ensurePlaceholder();

    directive.onDocumentDrop({
      target: document.createElement('div'),
    } as unknown as DragEvent);

    expect(directive.isOver).toBe(false);
    expect(directive.dataDropValid).toBeNull();
    expect(directive.lastIndex).toBe(-1);
    expect(tbody.querySelector('.ngb-dnd-placeholder')).toBeNull();
  });

  it('clears hover state and placeholder when dragging ends', () => {
    const debugEl = fixture.debugElement.query(By.directive(NgbDndListDirective));
    const directive = debugEl.injector.get(NgbDndListDirective) as any;
    const tbody = debugEl.nativeElement as HTMLTableSectionElement;

    directive.hover = true;
    directive.canDrop = true;
    directive.lastIndex = 0;
    directive.ensurePlaceholder();

    directive.onDocumentDragFinished();

    expect(directive.isOver).toBe(false);
    expect(directive.dataDropValid).toBeNull();
    expect(directive.lastIndex).toBe(-1);
    expect(tbody.querySelector('.ngb-dnd-placeholder')).toBeNull();
  });

  it('moves an item from a nested list into the root list', () => {
    const debugEl = fixture.debugElement.query(By.directive(NgbDndListDirective));
    const directive = debugEl.injector.get(NgbDndListDirective) as any;
    const state = TestBed.inject(NgbDndState);
    const source = ['nested'];

    const sessionId = state.createSession({
      item: 'nested',
      fromList: source,
      fromIndex: 0,
      fromListRef: {},
    } as any);

    directive.lastIndex = 2;
    directive.performDrop({
      preventDefault() {},
      stopPropagation() {},
      clientY: 0,
      dataTransfer: {
        getData: (type: string) => type === 'text/ngb-dnd' ? sessionId : '',
      },
    } as unknown as DragEvent);

    expect(source).toEqual([]);
    expect(fixture.componentInstance.items).toEqual(['a', 'b', 'nested']);
  });

  it('passes the active drag session to custom drop guards', () => {
    const debugEl = fixture.debugElement.query(By.directive(NgbDndListDirective));
    const directive = debugEl.injector.get(NgbDndListDirective) as any;
    const state = TestBed.inject(NgbDndState);
    const source = ['nested'];
    let guardPayload: any;

    const sessionId = state.createSession({
      item: 'nested',
      fromList: source,
      fromIndex: 0,
    });
    directive.dndCanDrop = (payload: any) => {
      guardPayload = payload;
      return true;
    };
    directive.lastIndex = 1;

    directive.performDrop({
      preventDefault() {},
      stopPropagation() {},
      clientY: 0,
      dataTransfer: {
        getData: (type: string) => type === 'text/ngb-dnd' ? sessionId : '',
      },
    } as unknown as DragEvent);

    expect(guardPayload.dragItem).toBe('nested');
    expect(guardPayload.srcList).toBe(source);
    expect(guardPayload.srcIndex).toBe(0);
    expect(guardPayload.dstList).toBe(fixture.componentInstance.items);
    expect(guardPayload.isExternal).toBe(true);
  });

  it('lets the nearest nested list handle document drops', () => {
    const nestedFixture = TestBed.createComponent(NestedListHostComponent);
    nestedFixture.detectChanges();
    const directives = nestedFixture.debugElement
      .queryAll(By.directive(NgbDndListDirective))
      .map((debugEl) => debugEl.injector.get(NgbDndListDirective) as any);
    const rootDirective = directives[0];
    const childElement = nestedFixture.nativeElement.querySelector('.child-list') as HTMLElement;

    rootDirective.hover = true;
    rootDirective.canDrop = true;
    rootDirective.lastIndex = 0;
    const performDrop = jest.spyOn(rootDirective, 'performDrop');

    rootDirective.onDocumentDrop({
      target: childElement,
    } as unknown as DragEvent);

    expect(performDrop).not.toHaveBeenCalled();
    expect(rootDirective.isOver).toBe(false);
    expect(rootDirective.lastIndex).toBe(-1);
  });

  it('allows the active root list to accept a nested item dropped back to root', () => {
    const nestedFixture = TestBed.createComponent(NestedListHostComponent);
    nestedFixture.detectChanges();
    const directives = nestedFixture.debugElement
      .queryAll(By.directive(NgbDndListDirective))
      .map((debugEl) => debugEl.injector.get(NgbDndListDirective) as any);
    const rootDirective = directives[0];
    const childElement = nestedFixture.nativeElement.querySelector('.child-list') as HTMLElement;
    const state = TestBed.inject(NgbDndState);
    const childSource = ['nested'];

    state.createSession({
      item: 'nested',
      fromList: childSource,
      fromIndex: 0,
      fromListRef: directives[1],
    } as any);
    state.setActiveDropList(rootDirective);
    rootDirective.lastIndex = 1;

    rootDirective.onDocumentDrop({
      target: childElement,
      preventDefault() {},
      stopPropagation() {},
      clientY: 0,
    } as unknown as DragEvent);

    expect(childSource).toEqual([]);
    expect(nestedFixture.componentInstance.root).toEqual(['root', 'nested']);
    expect(rootDirective.isOver).toBe(false);
    expect(state.getActiveDropList()).toBeNull();
  });

  it('ignores non-draggable hint children when calculating drop index', () => {
    const hintFixture = TestBed.createComponent(HintListHostComponent);
    hintFixture.detectChanges();
    const directive = hintFixture.debugElement.query(By.directive(NgbDndListDirective)).injector.get(NgbDndListDirective) as any;
    const itemB = hintFixture.nativeElement.querySelector('.item-b') as HTMLElement;
    const rect = itemB.getBoundingClientRect();

    const index = directive.indexFromPointer({
      clientY: rect.top + rect.height + 1,
    } as DragEvent);

    expect(index).toBe(2);
  });
});
