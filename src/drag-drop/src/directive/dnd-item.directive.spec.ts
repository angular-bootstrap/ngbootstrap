import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { NgbDndItemDirective } from './dnd-item.directive';
import { NgbDndListDirective } from './dnd-list.directive';
import { NgbDndHandleDirective } from './dnd-handle.directive';
import { NgbDndState } from '../service/drag-state.service';

@Component({
  standalone: true,
  imports: [CommonModule, NgbDndListDirective, NgbDndItemDirective],
  template: `
    <div [ngbDndList]="items">
      <div *ngFor="let item of items; let i = index" [ngbDndItem]="item" [dndIndex]="i">{{ item }}</div>
    </div>
  `,
})
class DndItemHostComponent {
  items = ['a', 'b'];
  explicitSource = ['x', 'y'];
}

@Component({
  standalone: true,
  imports: [CommonModule, NgbDndListDirective, NgbDndItemDirective, NgbDndHandleDirective],
  template: `
    <div [ngbDndList]="items">
      <div [ngbDndItem]="items[0]" [dndSourceList]="explicitSource" [dndIndex]="1">
        <button type="button">
          <span ngbDndHandle>Drag</span>
        </button>
      </div>
    </div>
  `,
})
class DndHandleHostComponent {
  items = ['a'];
  explicitSource = ['x', 'a'];
}

describe('NgbDndItemDirective', () => {
  let fixture: ComponentFixture<DndItemHostComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DndItemHostComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(DndItemHostComponent);
    fixture.detectChanges();
  });

  it('clears the active drag session on dragend', () => {
    const debugEl = fixture.debugElement.query(By.directive(NgbDndItemDirective));
    const directive = debugEl.injector.get(NgbDndItemDirective) as any;
    const state = TestBed.inject(NgbDndState);

    const dataTransfer = {
      setData() {},
      effectAllowed: 'move',
      setDragImage() {},
    } as unknown as DataTransfer;

    directive.onDragStart({ preventDefault() {}, dataTransfer } as unknown as DragEvent);

    expect(state.active()).toBe(true);
    expect(state.getCurrent()).not.toBeNull();
    expect(directive.dragging).toBe(true);

    directive.onDragEnd();

    expect(state.active()).toBe(false);
    expect(state.getCurrent()).toBeNull();
    expect(directive.dragging).toBe(false);
  });

  it('uses dndSourceList as the drag source when provided', () => {
    const debugEl = fixture.debugElement.query(By.directive(NgbDndItemDirective));
    const directive = debugEl.injector.get(NgbDndItemDirective) as any;
    const state = TestBed.inject(NgbDndState);
    const explicitSource = fixture.componentInstance.explicitSource;

    directive.dndSourceList = explicitSource;
    directive.dndIndex = 1;
    directive.onDragStart({
      preventDefault() {},
      dataTransfer: {
        setData() {},
        effectAllowed: 'move',
        setDragImage() {},
      },
    } as unknown as DragEvent);

    expect(state.getCurrent()?.fromList).toBe(explicitSource);
    expect(state.getCurrent()?.fromIndex).toBe(1);

    directive.onDragEnd();
  });

  it('starts the parent item session from a nested drag handle', () => {
    const handleFixture = TestBed.createComponent(DndHandleHostComponent);
    handleFixture.detectChanges();
    const handle = handleFixture.debugElement.query(By.directive(NgbDndHandleDirective))
      .injector.get(NgbDndHandleDirective);
    const state = TestBed.inject(NgbDndState);

    handle.onDragStart({
      preventDefault() {},
      dataTransfer: {
        setData() {},
        effectAllowed: 'move',
        setDragImage() {},
      },
    } as unknown as DragEvent);

    expect(state.getCurrent()?.item).toBe('a');
    expect(state.getCurrent()?.fromList).toBe(handleFixture.componentInstance.explicitSource);
    expect(state.getCurrent()?.fromIndex).toBe(1);

    handle.onDragEnd();
    expect(state.getCurrent()).toBeNull();
  });
});
