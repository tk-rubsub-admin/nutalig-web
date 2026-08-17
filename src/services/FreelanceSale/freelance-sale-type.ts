export interface FreelanceSaleRecord {
  id: string;
  name: string;
  contactNumber?: string | null;
  saleCoverage?: string | null;
  additional?: string | null;
}

export interface GetFreelanceSalesResponse {
  status: string;
  data: FreelanceSaleRecord[];
}

export interface Pagination {
  page: number;
  size: number;
  totalPage: number;
  totalRecords: number;
}

export interface SearchFreelanceSalesResponse {
  status: string;
  data: {
    records: FreelanceSaleRecord[];
    pagination: Pagination;
  };
}

export interface CreateFreelanceSaleRequest {
  name: string;
  contactNumber?: string | null;
  saleCoverage?: string | null;
  additional?: string | null;
}

export interface SearchFreelanceSaleRequest {
  keyword?: string | null;
  page?: number | null;
  size?: number | null;
  sortBy?: string | null;
  sortDirection?: string | null;
}
