import { Pagination } from 'services/general-type';

export interface SearchCompanyRequest {
  nameContain: string;
  statusEqual: string;
}

export interface SearchCompanyResponse extends Response {
  data: {
    companies: Company[];
    pagination: Pagination;
  };
}

export interface CompanyListResponse extends Response {
  data: Company[];
}

export interface Company {
  id: string;
  nameTh: string;
  nameEn: string;
  status: string;
  email: string;
  taxId: string;
  address: string;
  branchCode: string;
  branchName: string;
  phoneNumber: string;
  createdDate: string;
  updatedDate: string;
}

export interface CompanyParam {
  id: string;
}

export interface AddNewCompanyDialogProps {
  open: boolean;
  onClose: () => void;
}

export interface CreateCompanyResponse {
  companyId: string;
}
