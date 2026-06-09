import { CommonModule } from '@angular/common';
import { Component, ElementRef, EventEmitter, HostListener, Input, Output, inject } from '@angular/core';
import { NgbDataGridTheme, NgbDataGridThemeOption, NGB_DATAGRID_THEME_OPTIONS } from '../datagrid.types';

@Component({
  selector: 'ngb-datagrid-theme-picker',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="ngb-datagrid-theme-picker">
      @if (label) {
        <span class="ngb-datagrid-theme-picker__label">{{ label }}</span>
      }
      <div class="ngb-datagrid-theme-picker__control">
        <button
          type="button"
          class="ngb-datagrid-theme-picker__trigger"
          [class.ngb-datagrid-theme-picker__trigger--open]="open"
          [attr.aria-expanded]="open"
          aria-haspopup="listbox"
          (click)="toggle()"
        >
          <span class="ngb-datagrid-theme-picker__swatches" aria-hidden="true">
            @for (color of selectedTheme.swatches; track color) {
            <span
              class="ngb-datagrid-theme-picker__swatch"
              [style.background]="color"
            ></span>
            }
          </span>
          <span class="ngb-datagrid-theme-picker__selected">{{ selectedTheme.label }}</span>
          <span class="ngb-datagrid-theme-picker__chevron" aria-hidden="true"></span>
        </button>

        @if (open) {
        <div class="ngb-datagrid-theme-picker__menu" role="listbox">
          @for (group of groupedThemes; track group.label) {
            <div class="ngb-datagrid-theme-picker__group">{{ group.label }}</div>
            @for (theme of group.items; track theme.value) {
            <button
              type="button"
              class="ngb-datagrid-theme-picker__option"
              role="option"
              [attr.aria-selected]="theme.value === value"
              [class.ngb-datagrid-theme-picker__option--active]="theme.value === value"
              (click)="select(theme)"
            >
              <span class="ngb-datagrid-theme-picker__swatches" aria-hidden="true">
                @for (color of theme.swatches; track color) {
                <span
                  class="ngb-datagrid-theme-picker__swatch"
                  [style.background]="color"
                ></span>
                }
              </span>
              <span class="ngb-datagrid-theme-picker__option-label">{{ theme.label }}</span>
              @if (theme.dark) {
                <span class="ngb-datagrid-theme-picker__moon" aria-hidden="true"></span>
              }
            </button>
            }
          }
        </div>
        }
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: inline-block;
      color: #344054;
      font: inherit;
    }

    .ngb-datagrid-theme-picker {
      display: inline-flex;
      align-items: center;
      gap: 0.6rem;
      position: relative;
    }

    .ngb-datagrid-theme-picker__label {
      color: #667085;
      font-size: 0.86rem;
      line-height: 1.4;
    }

    .ngb-datagrid-theme-picker__control {
      position: relative;
      min-width: 12.5rem;
    }

    .ngb-datagrid-theme-picker__trigger,
    .ngb-datagrid-theme-picker__option {
      display: flex;
      align-items: center;
      width: 100%;
      border: 1px solid #d0d5dd;
      background: #fff;
      color: #101828;
      font: inherit;
      text-align: left;
      cursor: pointer;
    }

    .ngb-datagrid-theme-picker__trigger {
      min-height: 2.25rem;
      gap: 0.55rem;
      padding: 0.35rem 0.65rem;
      border-radius: 0.5rem;
      box-shadow: 0 1px 2px rgba(16, 24, 40, 0.05);
    }

    .ngb-datagrid-theme-picker__trigger:focus-visible,
    .ngb-datagrid-theme-picker__trigger--open {
      outline: none;
      border-color: #315efb;
      box-shadow: 0 0 0 0.2rem rgba(49, 94, 251, 0.14);
    }

    .ngb-datagrid-theme-picker__selected {
      flex: 1 1 auto;
      min-width: 0;
      font-weight: 600;
    }

    .ngb-datagrid-theme-picker__chevron {
      width: 0.75rem;
      height: 0.75rem;
      border-right: 2px solid #315efb;
      border-bottom: 2px solid #315efb;
      transform: rotate(45deg);
      transition: transform 150ms ease;
      margin-top: -0.25rem;
    }

    .ngb-datagrid-theme-picker__trigger--open .ngb-datagrid-theme-picker__chevron {
      transform: rotate(225deg);
      margin-top: 0.25rem;
    }

    .ngb-datagrid-theme-picker__menu {
      position: absolute;
      z-index: 1100;
      top: calc(100% + 0.25rem);
      right: 0;
      width: min(19rem, 90vw);
      max-height: 24rem;
      overflow: auto;
      padding: 0.65rem;
      border: 1px solid #d7deea;
      border-radius: 0.5rem;
      background: #fff;
      box-shadow: 0 1rem 2.25rem rgba(16, 24, 40, 0.18);
    }

    .ngb-datagrid-theme-picker__group {
      padding: 0.55rem 0.65rem 0.45rem;
      color: #344054;
      font-size: 0.72rem;
      font-weight: 700;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      border-top: 1px solid #e4e7ec;
    }

    .ngb-datagrid-theme-picker__group:first-child {
      border-top: 0;
      padding-top: 0.35rem;
    }

    .ngb-datagrid-theme-picker__option {
      gap: 0.65rem;
      min-height: 2.55rem;
      padding: 0.45rem 0.65rem;
      border: 0;
      border-radius: 0.45rem;
    }

    .ngb-datagrid-theme-picker__option:hover,
    .ngb-datagrid-theme-picker__option--active {
      background: #f2f4f7;
    }

    .ngb-datagrid-theme-picker__option-label {
      flex: 1 1 auto;
      font-weight: 600;
      color: #344054;
    }

    .ngb-datagrid-theme-picker__swatches {
      display: inline-flex;
      align-items: center;
      min-width: 3.2rem;
    }

    .ngb-datagrid-theme-picker__swatch {
      width: 1.25rem;
      height: 1.25rem;
      border: 2px solid #fff;
      border-radius: 50%;
      box-shadow: 0 0 0 1px rgba(16, 24, 40, 0.08);
    }

    .ngb-datagrid-theme-picker__swatch + .ngb-datagrid-theme-picker__swatch {
      margin-left: -0.42rem;
    }

    .ngb-datagrid-theme-picker__moon {
      width: 0.95rem;
      height: 0.95rem;
      border-radius: 50%;
      box-shadow: -0.28rem 0 0 #344054;
      transform: translateX(0.28rem);
    }

    @media (max-width: 640px) {
      .ngb-datagrid-theme-picker {
        align-items: stretch;
        flex-direction: column;
        gap: 0.45rem;
        width: 100%;
      }

      .ngb-datagrid-theme-picker__control {
        min-width: 0;
        width: 100%;
      }

      .ngb-datagrid-theme-picker__menu {
        left: 0;
        right: auto;
        width: 100%;
      }
    }
  `],
})
export class NgbDatagridThemePickerComponent {
  private readonly host = inject(ElementRef<HTMLElement>);
  private _value: NgbDataGridTheme = 'bootstrap';
  private _themes: NgbDataGridThemeOption[] = NGB_DATAGRID_THEME_OPTIONS;

  @Input() label = 'Change Theme';
  @Input()
  get value(): NgbDataGridTheme {
    return this._value;
  }
  set value(value: NgbDataGridTheme) {
    this._value = value;
    this.updateSelectedTheme();
  }

  @Input()
  get themes(): NgbDataGridThemeOption[] {
    return this._themes;
  }
  set themes(themes: NgbDataGridThemeOption[] | null | undefined) {
    this._themes = themes?.length ? themes : NGB_DATAGRID_THEME_OPTIONS;
    this.groupedThemes = this.buildGroupedThemes(this._themes);
    this.updateSelectedTheme();
  }

  @Output() valueChange = new EventEmitter<NgbDataGridTheme>();

  open = false;
  selectedTheme: NgbDataGridThemeOption = NGB_DATAGRID_THEME_OPTIONS[0];
  groupedThemes: Array<{ label: NgbDataGridThemeOption['group']; items: NgbDataGridThemeOption[] }> =
    this.buildGroupedThemes(NGB_DATAGRID_THEME_OPTIONS);

  toggle(): void {
    this.open = !this.open;
  }

  select(theme: NgbDataGridThemeOption): void {
    this._value = theme.value;
    this.selectedTheme = theme;
    this.valueChange.emit(theme.value);
    this.open = false;
  }

  @HostListener('document:click', ['$event'])
  closeOnOutsideClick(event: MouseEvent): void {
    if (!this.host.nativeElement.contains(event.target as Node)) {
      this.open = false;
    }
  }

  @HostListener('keydown.escape')
  closeOnEscape(): void {
    this.open = false;
  }

  private updateSelectedTheme(): void {
    this.selectedTheme =
      this._themes.find((theme) => theme.value === this._value) ?? this._themes[0] ?? NGB_DATAGRID_THEME_OPTIONS[0];
  }

  private buildGroupedThemes(
    themes: NgbDataGridThemeOption[],
  ): Array<{ label: NgbDataGridThemeOption['group']; items: NgbDataGridThemeOption[] }> {
    const groups: Array<NgbDataGridThemeOption['group']> = ['Bootstrap', 'Material', 'Tailwind'];
    return groups
      .map((label) => ({ label, items: themes.filter((theme) => theme.group === label) }))
      .filter((group) => group.items.length > 0);
  }
}
