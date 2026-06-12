export type SearchFieldInputType = 'TEXT' | 'SELECT' | 'DATE' | 'DATE_RANGE' | 'NUMBER' | 'BOOLEAN';

export interface SearchField {
  screenCode: string;
  fieldCode: string;
  labelTh?: string;
  labelEn?: string;
  inputType: SearchFieldInputType;
  sortOrder?: number;
  visible: boolean;
}

export interface SearchFieldResponse {
  status: string;
  data: SearchField[];
}
