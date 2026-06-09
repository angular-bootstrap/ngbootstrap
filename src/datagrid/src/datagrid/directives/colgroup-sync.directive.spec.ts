import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { NgbSyncColgroupDirective } from './colgroup-sync.directive';

@Component({
  selector: 'ngb-colgroup-sync-host',
  standalone: true,
  imports: [NgbSyncColgroupDirective],
  template: `
    <table>
      <colgroup [ngbSyncColgroup]="syncId" syncRole="header">
        <col />
        <col />
        <col />
      </colgroup>
      <thead>
        <tr>
          <th style="font-size:10px;padding:0;border:0;">H1</th>
          <th style="font-size:10px;padding:0;border:0;">H2</th>
          <th style="font-size:10px;padding:0;border:0;">H3</th>
        </tr>
      </thead>
    </table>

    <table>
      <colgroup [ngbSyncColgroup]="syncId" syncRole="body">
        <col />
        <col />
        <col />
      </colgroup>
      <tbody>
        <tr>
          <td style="font-size:10px;padding:0;border:0;"><span>100</span></td>
          <td style="font-size:10px;padding:0;border:0;">ABCDEFGHIJKLMN</td>
          <td style="font-size:10px;padding:0;border:0;">
            <button style="width:20px;padding:0;border:0;margin-right:4px;"></button>
            <button style="width:20px;padding:0;border:0;margin:0;"></button>
          </td>
        </tr>
      </tbody>
    </table>
  `
})
class ColgroupSyncHostComponent {
  syncId = 'test-sync';
}

@Component({
  selector: 'ngb-colgroup-sync-sortable-host',
  standalone: true,
  imports: [NgbSyncColgroupDirective],
  template: `
    <table>
      <colgroup [ngbSyncColgroup]="syncId" syncRole="header">
        <col />
      </colgroup>
      <thead>
        <tr>
          <th style="padding: 2px; border: 1px solid black;">
            <button style="width: 100%; padding: 0; margin: 0;">Sortable</button>
          </th>
        </tr>
      </thead>
    </table>

    <table>
      <colgroup [ngbSyncColgroup]="syncId" syncRole="body">
        <col />
      </colgroup>
      <tbody>
        <tr>
          <td style="padding: 2px; border: 1px solid black;">Row</td>
        </tr>
      </tbody>
    </table>
  `
})
class ColgroupSyncSortableHostComponent {
  syncId = 'sortable-sync';
}

@Component({
  selector: 'ngb-colgroup-sync-filter-host',
  standalone: true,
  imports: [NgbSyncColgroupDirective],
  template: `
    <table>
      <colgroup [ngbSyncColgroup]="syncId" syncRole="header">
        <col />
      </colgroup>
      <thead>
        <tr>
          <th style="padding: 4px; border: 1px solid black;">
            <input type="text" class="form-control form-control-sm" style="width: 100%;" value="Filter" />
          </th>
        </tr>
      </thead>
    </table>

    <table>
      <colgroup [ngbSyncColgroup]="syncId" syncRole="body">
        <col />
      </colgroup>
      <tbody>
        <tr>
          <td style="padding: 4px; border: 1px solid black;">Cell</td>
        </tr>
      </tbody>
    </table>
  `
})
class ColgroupSyncFilterHostComponent {
  syncId = 'filter-sync';
}

@Component({
  selector: 'ngb-colgroup-sync-detail-host',
  standalone: true,
  imports: [NgbSyncColgroupDirective],
  template: `
    <table>
      <colgroup [ngbSyncColgroup]="syncId" syncRole="header">
        <col data-fixed="true" style="width: 48px;" />
        <col />
        <col />
      </colgroup>
      <thead>
        <tr>
          <th style="padding: 0; border: 0;">D</th>
          <th style="padding: 0; border: 0;">Customer</th>
          <th style="padding: 0; border: 0;">Owner</th>
        </tr>
        <tr>
          <th></th>
          <th style="padding: 0; border: 0;"><input style="width: 100%;" value="Filter customer" /></th>
          <th style="padding: 0; border: 0;"><input style="width: 100%;" value="Filter owner" /></th>
        </tr>
      </thead>
    </table>

    <table>
      <colgroup [ngbSyncColgroup]="syncId" syncRole="body">
        <col data-fixed="true" style="width: 48px;" />
        <col />
        <col />
      </colgroup>
      <tbody>
        <tr>
          <td style="padding: 0; border: 0;"><button style="width: 32px;">></button></td>
          <td style="padding: 0; border: 0;">Northwind Labs</td>
          <td style="padding: 0; border: 0;">Avery Cole</td>
        </tr>
        <tr>
          <td colspan="3" style="padding: 0; border: 0;">
            <div style="width: 600px;">Expanded detail content should not resize the utility column.</div>
          </td>
        </tr>
      </tbody>
    </table>
  `
})
class ColgroupSyncDetailHostComponent {
  syncId = 'detail-sync';
}

describe('NgbSyncColgroupDirective', () => {
  let fixture: ComponentFixture<ColgroupSyncHostComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ColgroupSyncHostComponent, ColgroupSyncSortableHostComponent, ColgroupSyncFilterHostComponent, ColgroupSyncDetailHostComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(ColgroupSyncHostComponent);
    fixture.detectChanges();
  });

  it('applies body content widths to header and body colgroups', () => {
    const tables = fixture.nativeElement.querySelectorAll('table');
    const headerCols = tables[0].querySelectorAll('col');
    const bodyCols = tables[1].querySelectorAll('col');

    expect(headerCols.length).toBe(3);
    expect(bodyCols.length).toBe(3);

    // "100" -> 3 chars * 10px * 0.6 = 18px, clamped to 40px min.
    expect(headerCols[0].style.width).toBe('40px');
    expect(bodyCols[0].style.width).toBe('40px');

    // 14 chars * 10px * 0.6 = 84px, within min/max bounds.
    expect(headerCols[1].style.width).toBe('84px');
    expect(bodyCols[1].style.width).toBe('84px');

    // Two 20px buttons + 4px margin + chrome(0) = 44px.
    expect(headerCols[2].style.width).toBe('44px');
    expect(bodyCols[2].style.width).toBe('44px');
  });

  it('does not inflate sortable header widths when measured repeatedly', () => {
    const sortableFixture = TestBed.createComponent(ColgroupSyncSortableHostComponent);
    sortableFixture.detectChanges();

    const dirInstances = sortableFixture.debugElement
      .queryAll(By.directive(NgbSyncColgroupDirective))
      .map(de => de.injector.get(NgbSyncColgroupDirective));
    const headerDir = dirInstances.find(d => d.syncRole === 'header')!;

    const headerCol = sortableFixture.nativeElement.querySelector('table:first-of-type col') as HTMLTableColElement;
    const headerButton = sortableFixture.nativeElement.querySelector('thead button') as HTMLButtonElement;

    headerCol.style.width = '60px';
    jest.spyOn(headerButton, 'getBoundingClientRect').mockImplementation(() => {
      const width = parseFloat(headerCol.style.width || '60') || 60;
      return {
        width,
        height: 0,
        top: 0,
        left: 0,
        right: width,
        bottom: 0,
        x: 0,
        y: 0,
        toJSON: () => ({})
      } as DOMRect;
    });

    headerDir.measureAndDistribute();
    const widthAfterFirst = headerCol.style.width;

    headerDir.measureAndDistribute();
    const widthAfterSecond = headerCol.style.width;

    expect(widthAfterFirst).not.toBe('320px');
    expect(widthAfterSecond).toBe(widthAfterFirst);
  });

  it('keeps filter header inputs from inflating widths', () => {
    const filterFixture = TestBed.createComponent(ColgroupSyncFilterHostComponent);
    filterFixture.detectChanges();

    const headerCol = filterFixture.nativeElement.querySelector('table:first-of-type col') as HTMLTableColElement;
    const headerInput = filterFixture.nativeElement.querySelector('thead input') as HTMLInputElement;

    headerCol.style.width = '80px';
    jest.spyOn(headerInput, 'getBoundingClientRect').mockImplementation(() => {
      const width = parseFloat(headerCol.style.width || '80') || 80;
      return {
        width,
        height: 0,
        top: 0,
        left: 0,
        right: width,
        bottom: 0,
        x: 0,
        y: 0,
        toJSON: () => ({})
      } as DOMRect;
    });

    const headerDir = filterFixture.debugElement
      .queryAll(By.directive(NgbSyncColgroupDirective))
      .map(de => de.injector.get(NgbSyncColgroupDirective))
      .find(d => d.syncRole === 'header')!;

    headerDir.measureAndDistribute();
    const widthAfterFirst = headerCol.style.width;

    headerDir.measureAndDistribute();
    const widthAfterSecond = headerCol.style.width;

    expect(widthAfterFirst).not.toBe('320px');
    expect(widthAfterSecond).toBe(widthAfterFirst);
  });

  it('ignores detail rows with colspan when syncing column widths', () => {
    const detailFixture = TestBed.createComponent(ColgroupSyncDetailHostComponent);
    detailFixture.detectChanges();

    const tables = detailFixture.nativeElement.querySelectorAll('table');
    const headerCols = tables[0].querySelectorAll('col');
    const bodyCols = tables[1].querySelectorAll('col');

    expect(headerCols[0].style.width).toBe('48px');
    expect(bodyCols[0].style.width).toBe('48px');
    expect(parseFloat(headerCols[1].style.width)).toBeGreaterThanOrEqual(80);
    expect(parseFloat(headerCols[2].style.width)).toBeGreaterThanOrEqual(70);
  });
});
