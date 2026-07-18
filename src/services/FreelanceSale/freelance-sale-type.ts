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

export interface CreateFreelanceSaleRequest {
  name: string;
  contactNumber?: string | null;
  saleCoverage?: string | null;
  additional?: string | null;
}
