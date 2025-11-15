import { Injectable, inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';

@Injectable({ providedIn: 'root' })
export class NgbBidi {
  private doc = inject(DOCUMENT);
  get dir(): 'ltr'|'rtl' { return (this.doc?.documentElement.getAttribute('dir') as any) || 'ltr'; }
}
