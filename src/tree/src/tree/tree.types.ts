export type NgbTreeType = 'text' | 'json';

export interface NgbTreeNode {
  id: string;
  label: string;
  children?: NgbTreeNode[];
  expanded?: boolean;
  selected?: boolean;
  disabled?: boolean;
}

export interface NgbTreeI18n {
  treeLabel?: string;
  expand?: string;
  collapse?: string;
  expandAll?: string;
  collapseAll?: string;
  select?: string;
}
