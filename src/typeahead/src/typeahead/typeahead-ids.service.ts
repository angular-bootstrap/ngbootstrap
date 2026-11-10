import { APP_ID, Injectable, inject } from '@angular/core';

/** Application-scoped IDs remain deterministic for equivalent server/client trees. */
@Injectable({ providedIn: 'root' })
export class NgbTypeaheadIds {
  private readonly appId = inject(APP_ID);
  private next = 0;
  allocate(): string { return `${this.appId}-ngb-typeahead-${this.next++}`; }
}
