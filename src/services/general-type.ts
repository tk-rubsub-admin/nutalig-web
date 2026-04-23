export interface Pagination {
  page: number;
  size: number;
  totalPage: number;
  totalRecords: number;
}

export interface DateRange {
  start: string | null;
  end: string | null;
}

export const WITH_HOLDING_OPTIONS = [0.5, 0.75, 1, 1.5, 2, 3, 5, 10, 15];

export interface DownloadDocumentResponse {
  baseFileName: string;
  format: 'PDF' | 'JPG';
  files: {
    fileName: string;
    base64: string;
    contentType: string;
  }[];
}

export interface UploadFileResponse {
  fileName: string;
  url: string;
}
