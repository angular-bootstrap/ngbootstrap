import { APP_ID, Injectable, inject } from '@angular/core';

/** Application-scoped sequence: independent SSR requests do not share a counter. */
@Injectable({ providedIn: 'root' })
export class NgbGridDetailIds {
  private readonly appId = inject(APP_ID);
  private next = 0;
  allocate(): string { return `${this.appId}-ngb-detail-${this.next++}`; }
}
