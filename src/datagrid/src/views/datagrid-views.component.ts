import { afterNextRender, ChangeDetectionStrategy, Component, ElementRef, inject, Injector, Input, OnDestroy, signal, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { Datagrid } from '../datagrid/datagrid.component';
import { NgbDataGridSavedView, NgbDataGridViewSnapshot, NgbDataGridViewStore, NgbMemoryGridViewStore, ngbCloneGridView, ngbSerializeGridView } from './grid-view';

/** Explicit, application-owned persistence; grid changes are never saved automatically. */
@Component({
  selector: 'ngb-datagrid-views',
  standalone: true,
  imports: [FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="views" role="group" aria-label="Grid views" [attr.aria-busy]="busy()">
      <label>View
        <select #selector [ngModel]="selected()" (ngModelChange)="selectView($event)" [disabled]="busy() || !ready()">
          <option value="">Initial configuration</option>
          @for (view of views(); track view.id) { <option [value]="view.id">{{ view.name }}</option> }
        </select>
      </label>
      <button type="button" (click)="begin('save')" [disabled]="busy() || !ready()">Save as</button>
      <button type="button" (click)="update()" [disabled]="busy() || !selected()">Update</button>
      <button type="button" (click)="begin('rename')" [disabled]="busy() || !selected()">Rename</button>
      <button type="button" (click)="confirmDelete.set(true)" [disabled]="busy() || !selected()">Delete</button>
      <button type="button" (click)="reset()" [disabled]="busy() || !ready()">Reset</button>
      @if (dirty()) { <span class="dirty">Unsaved changes</span> }
      @if (mode()) {
        <form (ngSubmit)="saveName()">
          <label>View name <input #nameInput name="viewName" [(ngModel)]="name" required maxlength="120" [disabled]="busy()" (keydown.escape)="cancel()" /></label>
          <button type="submit" [disabled]="busy()">{{ mode() === 'rename' ? 'Rename view' : 'Save view' }}</button>
          <button type="button" (click)="cancel()" [disabled]="busy()">Cancel</button>
        </form>
      }
      @if (confirmDelete()) {
        <div role="group" aria-label="Confirm view deletion">
          <span>Delete “{{ selectedView()?.name }}”?</span>
          <button type="button" (click)="remove()" [disabled]="busy()">Confirm delete</button>
          <button type="button" (click)="cancel()" [disabled]="busy()">Keep view</button>
        </div>
      }
      <span role="status" aria-live="polite">{{ message() }}</span>
      @if (error()) { <span role="alert">{{ error() }}</span> }
    </div>
  `,
  styles: [`
    :host { display: block; }
    .views, form, [aria-label="Confirm view deletion"] { display:flex; flex-wrap:wrap; align-items:center; gap:.5rem; }
    .views { padding:.75rem; color:var(--ngb-on-surface, #212529); background:var(--ngb-surface, #fff); border:1px solid var(--ngb-border-color, #dee2e6); border-radius:var(--ngb-radius-md, .375rem); font-family:var(--ngb-font-family, inherit); }
    label { display:flex; align-items:center; gap:.5rem; }
    button, select, input { font:inherit; min-height:2.25rem; padding:.25rem .5rem; color:inherit; background:var(--ngb-surface, #fff); border:1px solid var(--ngb-border-color, #dee2e6); border-radius:var(--ngb-radius-sm, .25rem); }
    button { cursor:pointer; }
    button:hover { background:var(--ngb-hover-bg, #f8f9fa); }
    :is(button, select, input):focus-visible { outline:2px solid var(--ngb-primary, #0d6efd); outline-offset:2px; }
    :disabled { opacity:var(--ngb-disabled-opacity, .65); cursor:default; }
    form, [aria-label="Confirm view deletion"], [role="alert"] { flex-basis:100%; }
    .dirty { font-size:var(--ngb-font-size-sm, .875rem); }
    [role="alert"] { color:var(--ngb-danger, #b02a37); }
  `],
})
export class NgbDataGridViewsComponent implements OnDestroy {
  @Input({ required: true }) grid!: Datagrid;
  /** Namespace by grid, user and tenant. Required even for an in-memory collection. */
  @Input({ required: true }) storageKey!: string;
  @Input() store: NgbDataGridViewStore = new NgbMemoryGridViewStore();
  @ViewChild('selector') selector?: ElementRef<HTMLSelectElement>;
  @ViewChild('nameInput') set nameField(value: ElementRef<HTMLInputElement> | undefined) { value?.nativeElement.focus(); }
  readonly views = signal<NgbDataGridSavedView[]>([]);
  readonly selected = signal('');
  readonly ready = signal(false);
  readonly busy = signal(false);
  readonly dirty = signal(false);
  readonly mode = signal<'save' | 'rename' | null>(null);
  readonly confirmDelete = signal(false);
  readonly message = signal('');
  readonly error = signal('');
  name = '';
  private readonly injector = inject(Injector);
  private initial?: NgbDataGridViewSnapshot;
  private baseline = '';
  private subscription?: Subscription;
  private destroyed = false;
  constructor() { afterNextRender(() => { void this.attach(); }); }
  ngOnDestroy(): void { this.destroyed = true; this.subscription?.unsubscribe(); }
  private async attach(): Promise<void> {
    try {
      if (!this.storageKey?.trim()) throw new Error('Provide a storage key for this grid and user.');
      this.initial = this.grid.captureView();
      this.baseline = ngbSerializeGridView(this.initial);
      this.subscription = this.grid.viewChange.subscribe(view => this.dirty.set(ngbSerializeGridView(view) !== this.baseline));
      this.ready.set(true);
      await this.run(async () => {
        const views = await this.store.list(this.storageKey);
        const names = new Set<string>();
        const ids = new Set<string>();
        const valid = views.map(view => {
          if (!view.id || !view.name?.trim() || ids.has(view.id) || names.has(view.name.trim().toLowerCase())) throw new Error('Saved views contain invalid or duplicate names or IDs.');
          ids.add(view.id); names.add(view.name.trim().toLowerCase());
          return { ...view, name: view.name.trim(), snapshot: ngbCloneGridView(view.snapshot) };
        });
        if (!this.destroyed) this.views.set(valid);
      });
    } catch (error) { this.report(error); }
  }
  selectedView(): NgbDataGridSavedView | undefined { return this.views().find(view => view.id === this.selected()); }
  begin(mode: 'save' | 'rename'): void { this.error.set(''); this.confirmDelete.set(false); this.name = mode === 'rename' ? this.selectedView()?.name ?? '' : ''; this.mode.set(mode); }
  cancel(): void { this.mode.set(null); this.confirmDelete.set(false); afterNextRender(() => queueMicrotask(() => this.selector?.nativeElement.focus()), { injector: this.injector }); }
  selectView(id: string): void {
    if (this.busy()) return;
    const view = this.views().find(item => item.id === id);
    const snapshot = id ? view?.snapshot : this.initial;
    if (!snapshot) return;
    const result = this.grid.restoreView(snapshot);
    if (!result.success) { this.error.set(result.message); if (this.selector) this.selector.nativeElement.value = this.selected(); return; }
    this.selected.set(id);
    this.baseline = ngbSerializeGridView(this.grid.captureView());
    this.dirty.set(false); this.error.set(''); this.cancel();
    this.message.set(result.ignoredFields.length ? `View applied. Ignored removed fields: ${result.ignoredFields.join(', ')}.` : 'View applied.');
  }
  reset(): void { this.selectView(''); }
  async saveName(): Promise<void> {
    const name = this.name.trim();
    if (!name) { this.error.set('Enter a view name.'); return; }
    const current = this.selectedView();
    const rename = this.mode() === 'rename';
    if (rename && !current) return;
    if (this.views().some(view => view.name.toLowerCase() === name.toLowerCase() && (!rename || view.id !== current?.id))) { this.error.set('A view with this name already exists.'); return; }
    await this.run(async () => {
      const view: NgbDataGridSavedView = { id: rename ? current!.id : this.newId(), name, snapshot: rename ? current!.snapshot : this.grid.captureView() };
      await this.store.save(this.storageKey, view);
      this.views.update(views => [...views.filter(item => item.id !== view.id), view]);
      this.selected.set(view.id);
      if (!rename) { this.baseline = ngbSerializeGridView(view.snapshot); this.dirty.set(ngbSerializeGridView(this.grid.captureView()) !== this.baseline); }
      this.cancel(); this.message.set(rename ? 'View renamed.' : 'View saved.');
    });
  }
  async update(): Promise<void> {
    const current = this.selectedView(); if (!current) return;
    await this.run(async () => {
      const view = { ...current, snapshot: this.grid.captureView() };
      await this.store.save(this.storageKey, view);
      this.views.update(views => views.map(item => item.id === view.id ? view : item));
      this.baseline = ngbSerializeGridView(view.snapshot); this.dirty.set(ngbSerializeGridView(this.grid.captureView()) !== this.baseline); this.message.set('View updated.');
    });
  }
  async remove(): Promise<void> {
    const current = this.selectedView(); if (!current || !this.confirmDelete()) return;
    await this.run(async () => {
      await this.store.delete(this.storageKey, current.id);
      this.views.update(views => views.filter(view => view.id !== current.id));
      this.selected.set(''); this.baseline = ngbSerializeGridView(this.initial!);
      this.dirty.set(ngbSerializeGridView(this.grid.captureView()) !== this.baseline);
      this.cancel(); this.message.set('View deleted. Current grid configuration retained.');
    });
  }
  private newId(): string { let id: string; do { id = `view-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`; } while (this.views().some(view => view.id === id)); return id; }
  private report(error: unknown): void { this.error.set(error instanceof Error ? error.message : 'Unable to load or save views. Try again.'); }
  private async run(action: () => Promise<void>): Promise<void> {
    if (this.busy() || this.destroyed) return;
    this.busy.set(true); this.error.set(''); this.message.set('');
    try { await action(); } catch (error) { this.report(error); }
    finally { this.busy.set(false); }
  }
}
