import { Pagination } from 'services/general-type';

export type ComponentDictionaryStatus = 'ACTIVE' | 'INACTIVE';

export interface ComponentDictionary {
  id?: number;
  componentCode?: string | null;
  nameTh: string;
  nameEn?: string | null;
  nameZh?: string | null;
  status: ComponentDictionaryStatus;
  remark?: string | null;
  createdDate?: string;
  updatedDate?: string;
}

export interface ComponentDictionarySearch {
  keyword?: string;
  status?: ComponentDictionaryStatus | '';
}

export interface ComponentDictionaryListResponse {
  records: ComponentDictionary[];
  pagination: Pagination;
}
