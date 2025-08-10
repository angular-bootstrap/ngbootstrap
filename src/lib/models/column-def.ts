export type ColumnType = 'text' | 'number' | 'email' | 'boolean' | 'date';

export interface ColumnDef<T = any> {
  /** key of the property on your row object */
  field: Extract<keyof T, string>;
  /** human‐readable header text */
  header: string;
  /** enable clicking to sort */
  sortable?: boolean;
  /** enable filtering on this column */
  filterable?: boolean;
  editable?: boolean;      // (default true)
  type?: ColumnType; // editor type
  required?: boolean;            // block save if empty/invalid
}