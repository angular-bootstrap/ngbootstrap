import { NgbDatagridDefaultEditService } from './editing.service';

interface RowModel {
  id: string;
  name: string;
  active?: boolean;
}

describe('NgbDatagridDefaultEditService', () => {
  it('tracks update baselines and restores the original row on cancel', () => {
    const service = new NgbDatagridDefaultEditService<RowModel>();
    const original = [{ id: '1', name: 'Alpha', active: true }];

    const updated = service.update(original, { id: '1', name: 'Beta', active: true }, 0, 'row-1');

    expect(service.hasChanges('row-1', updated[0])).toBe(true);
    expect(service.cancelChanges(updated, 0, 'row-1')).toEqual(original);
  });

  it('removes newly created rows when canceling a draft create', () => {
    const service = new NgbDatagridDefaultEditService<RowModel>();
    const created = service.create([], { id: '2', name: 'Draft' }, 0, 'row-2');

    expect(service.isNew('row-2')).toBe(true);
    expect(service.cancelChanges(created, 0, 'row-2')).toEqual([]);
    expect(service.isNew('row-2')).toBe(false);
  });

  it('clears dirty tracking after save', () => {
    const service = new NgbDatagridDefaultEditService<RowModel>();
    const original = [{ id: '3', name: 'Gamma' }];
    const updated = service.update(original, { id: '3', name: 'Delta' }, 0, 'row-3');

    expect(service.hasChanges('row-3', updated[0])).toBe(true);

    const saved = service.saveChanges(updated, 0, 'row-3', updated[0]);

    expect(saved).toEqual(updated);
    expect(service.hasChanges('row-3', saved[0])).toBe(false);
  });
});
