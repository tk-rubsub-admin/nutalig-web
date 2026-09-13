export interface ApprovalRejectTokenResolve {
  requestId: number;
  stepId: number;
  requestNo: string;
  title: string;
  entityType: string;
  referenceId: string;
  requestType: string;
  status: string;
  currentStepNo?: number | null;
  approverRoleCode?: string | null;
  approverRoleCodes?: string[] | null;
  approverDisplayName?: string | null;
  rejectReason?: string | null;
  payload?: Record<string, any> | null;
  requestedDate?: string | null;
  actedAt?: string | null;
}

export interface ApprovalRequest {
  id: number;
  requestNo: string;
  entityType: string;
  referenceId: string;
  requestType: string;
  status: string;
  requestedBy?: string | null;
  requestedDate?: string | null;
  requestReason?: string | null;
  approvedDate?: string | null;
  rejectedDate?: string | null;
  rejectReason?: string | null;
  payload?: Record<string, any> | null;
}

export interface GetApprovalRejectTokenResolveResponse {
  data: ApprovalRejectTokenResolve;
}

export interface SubmitApprovalRejectByTokenRequest {
  token: string;
  reason: string;
}
