import { InjectionToken } from '@angular/core';

export type DndI18n = {
  listLabel: (name?: string) => string;
  pickedUp: () => string;
  dropped: () => string;
  moveToIndex: (pos: number, total: number) => string;
  dropHere: () => string;
  cannotDropHere: () => string;
};

export const DND_I18N = new InjectionToken<DndI18n>('DND_I18N');

export const defaultDndI18n: DndI18n = {
  listLabel: (n) => n ?? 'List',
  pickedUp: () => 'Picked up. Use Arrow keys to move, Enter to drop, Escape to cancel.',
  dropped: () => 'Dropped.',
  moveToIndex: (i, t) => `Moved to position ${i} of ${t}.`,
  dropHere: () => 'Drop here',
  cannotDropHere: () => 'Cannot drop here'
};
