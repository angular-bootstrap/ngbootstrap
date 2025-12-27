export interface NgbTypeaheadItem {
  id: string | number;
  label: string;
  value?: any;
  disabled?: boolean;
}

export interface NgbTypeaheadI18n {
  placeholder?: string;
  noResults?: string;
  clearSelection?: string;
  clear?: string;
  dropdownButtonLabel?: string;
}
