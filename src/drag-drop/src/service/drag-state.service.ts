// drag-state.service.ts
import { Inject, Injectable, Optional, signal } from '@angular/core';
import { DND_LIVE_ANNOUNCE } from '../a11y/live-announcer.service';
import { DndI18n, defaultDndI18n, DND_I18N } from '../i18n/dnd-i18n';

export interface DndSession<T = unknown> {
  item: T;
  group?: string;
  fromList?: T[];
  fromIndex?: number;
   fromIsPalette?: boolean;
}

@Injectable({ providedIn: 'root' })
export class NgbDndState {
  readonly active = signal(false);
  private store = new Map<string, DndSession>();
  private currentId: string | null = null; // ✅ track current session id


  // Public so directives can read strings and announce
  public i18n: DndI18n = defaultDndI18n;
  public announce?: (m: string) => void;

  constructor(
    @Optional() @Inject(DND_LIVE_ANNOUNCE) announceFn: ((m: string) => void) | null,
    @Optional() @Inject(DND_I18N) i18n: DndI18n | null
  ) {
    if (i18n) this.i18n = i18n;
    if (announceFn) this.announce = announceFn;
  }

  
  createSession<T>(session: DndSession<T>): string {
    const id = 'ngb-dnd-' + (crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2));
    this.store.set(id, session as DndSession);
    this.currentId = id;          // ✅ remember current
    this.active.set(true);
    return id;
  }

  get(id: string | null): DndSession | null {
    if (!id) return null;
    return this.store.get(id) ?? null;
  }

  getCurrent(): DndSession | null {        // ✅ fallback accessor
    return this.currentId ? (this.store.get(this.currentId) ?? null) : null;
  }

  clear(id?: string | null) {
    if (id) this.store.delete(id);
    if (this.currentId === id) this.currentId = null;
    if (this.store.size === 0) this.active.set(false);
  }
}
