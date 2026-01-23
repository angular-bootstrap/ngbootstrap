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
  editable?: boolean;      // (default true)
  type?: ColumnType; // editor type
  options?: Array<{ label: string; value: any }>; // <-- needed for select
  width?: number;         // in pixels
  required?: boolean;            // block save if empty/invalid
}
