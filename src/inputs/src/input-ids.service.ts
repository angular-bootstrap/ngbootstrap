import { APP_ID, Injectable, inject } from '@angular/core';
@Injectable({ providedIn: 'root' })
export class NgbInputIds {
  private readonly app = inject(APP_ID);
  private next = 0;
  allocate(): string { return `${this.app}-ngb-input-${this.next++}`; }
}
