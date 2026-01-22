import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
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
      </colgroup>
      <thead>
        <tr>
          <th style="font-size:10px;padding:0;border:0;">H1</th>
          <th style="font-size:10px;padding:0;border:0;">H2</th>
        </tr>
      </thead>
    </table>

    <table>
      <colgroup [ngbSyncColgroup]="syncId" syncRole="body">
        <col />
        <col />
      </colgroup>
      <tbody>
        <tr>
          <td style="font-size:10px;padding:0;border:0;"><span>100</span></td>
          <td style="font-size:10px;padding:0;border:0;">ABCDEFGHIJKLMN</td>
        </tr>
      </tbody>
    </table>
  `
})
class ColgroupSyncHostComponent {
  syncId = 'test-sync';
}

describe('NgbSyncColgroupDirective', () => {
  let fixture: ComponentFixture<ColgroupSyncHostComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ColgroupSyncHostComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(ColgroupSyncHostComponent);
    fixture.detectChanges();
  });

  it('applies body content widths to header and body colgroups', () => {
    const tables = fixture.nativeElement.querySelectorAll('table');
    const headerCols = tables[0].querySelectorAll('col');
    const bodyCols = tables[1].querySelectorAll('col');

    expect(headerCols.length).toBe(2);
    expect(bodyCols.length).toBe(2);

    // "100" -> 3 chars * 10px * 0.6 = 18px, clamped to 40px min.
    expect(headerCols[0].style.width).toBe('40px');
    expect(bodyCols[0].style.width).toBe('40px');

    // 14 chars * 10px * 0.6 = 84px, within min/max bounds.
    expect(headerCols[1].style.width).toBe('84px');
    expect(bodyCols[1].style.width).toBe('84px');
  });
});
