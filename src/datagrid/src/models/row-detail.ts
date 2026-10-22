/** Notification after a current-page detail row changes its expansion state. */
export interface NgbDataGridDetailChange<T = unknown> {
  row: T;
  /** Index in the processed current page, not a server record index. */
  index: number;
  expanded: boolean;
}

/** Pure predicate deciding whether a row offers a detail disclosure. */
export type NgbDataGridDetailPredicate<T = unknown> = (row: T, index: number) => boolean;

/** Stable, unique record identity for optional key-based detail expansion. */
export type NgbDataGridDetailKey = string | number;
export type NgbDataGridDetailKeySelector<T = unknown> = (row: T) => NgbDataGridDetailKey;
