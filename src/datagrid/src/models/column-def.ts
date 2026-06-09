import { NgbColumnFilterType, NgbFilterOperator } from './filtering';

export type ColumnType = 'text' | 'number' | 'email' | 'boolean' | 'date' | 'select';

export interface ColumnDef<T = any> {
  /** key of the property on your row object */
  field: Extract<keyof T, string>;
  /** human‐readable header text */
  header: string;
  /** Optional tooltip/title for the header cell; defaults to header text. */
  title?: string;
  /** Optional tooltip/title for body cells; defaults to the cell text. */
  cellTitle?: string | ((row: T) => string);
  /** enable clicking to sort */
  sortable?: boolean;
  /** enable filtering on this column */
  filterable?: boolean;
  filterType?: NgbColumnFilterType;
  /** When `''`, the first entry from {@link allowedFilterOperators} or the type list is used. */
  defaultFilterOperator?: NgbFilterOperator | '';
  allowedFilterOperators?: NgbFilterOperator[];
  showFilterMenu?: boolean;
  showFilterRow?: boolean;
  /** When `false`, hides the operator-list trigger in row filter mode. */
  showFilterOperator?: boolean;
  /** Placeholder for the row filter input; defaults to a type-specific label. */
  filterPlaceholder?: string;
  editable?: boolean | ((row: T, isNew: boolean) => boolean);      // (default true)
  type?: ColumnType; // editor type
  options?: Array<{ label: string; value: any }>; // <-- needed for select
  width?: number;         // in pixels
  /** Groups cells in stacked card layout (`tableOptions.stackedLayout = 'cards'`). */
  stackedGroup?: 'start' | 'center' | 'end';
  hidden?: boolean;
  sticky?: boolean | 'start' | 'end';
  locked?: boolean;
  reorderable?: boolean;
  /** When grid `[resizable]` is true, set to `false` to disable resizing for this column. */
  resizable?: boolean;
  /** Minimum width (px) while resizing; defaults to 50 when resizing is enabled. */
  minResizableWidth?: number;
  /** Maximum width (px) while resizing. */
  maxResizableWidth?: number;
  headerClass?: string | string[] | Record<string, boolean>;
  headerStyle?: Record<string, string | number>;
  cellClass?: string | string[] | Record<string, boolean> | ((row: T, rowIndex: number) => string | string[] | Record<string, boolean>);
  cellStyle?: Record<string, string | number> | ((row: T, rowIndex: number) => Record<string, string | number> | null | undefined);
  required?: boolean;            // block save if empty/invalid
}
