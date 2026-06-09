import { Injectable } from '@angular/core';

export type NgbDatagridLayoutToolbarPanelId = 'filter' | 'sort' | 'columns';

/** Ensures only one layout-toolbar panel is open at a time. */
@Injectable()
export class NgbDatagridLayoutToolbarCoordinator {
  private readonly closers = new Map<NgbDatagridLayoutToolbarPanelId, () => void>();

  register(id: NgbDatagridLayoutToolbarPanelId, close: () => void): void {
    this.closers.set(id, close);
  }

  unregister(id: NgbDatagridLayoutToolbarPanelId): void {
    this.closers.delete(id);
  }

  openExclusive(id: NgbDatagridLayoutToolbarPanelId): void {
    for (const [panelId, close] of this.closers) {
      if (panelId !== id) close();
    }
  }
}
