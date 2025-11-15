import { Injectable, InjectionToken } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class NgbLiveAnnouncer {
  private node: HTMLElement | null = null;
  announce(message: string) {
    if (!this.node) {
      this.node = document.createElement('div');
      this.node.setAttribute('aria-live', 'polite');
      this.node.setAttribute('aria-atomic', 'true');
      this.node.style.position = 'fixed';
      this.node.style.width = '1px'; this.node.style.height = '1px';
      this.node.style.overflow = 'hidden'; this.node.style.clip = 'rect(1px,1px,1px,1px)';
      this.node.style.whiteSpace = 'nowrap';
      document.body.appendChild(this.node);
    }
    this.node.textContent = message;
  }
}

export const DND_LIVE_ANNOUNCE = new InjectionToken<((m: string) => void) | null>(
  'DND_LIVE_ANNOUNCE',
  { providedIn: 'root', factory: () => null }
);