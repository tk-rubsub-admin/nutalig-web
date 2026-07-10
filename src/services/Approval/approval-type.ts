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
  approverDisplayName?: string | null;
  rejectReason?: string | null;
  payload?: Record<string, any> | null;
  requestedDate?: string | null;
  actedAt?: string | null;
}

export interface GetApprovalRejectTokenResolveResponse {
  data: ApprovalRejectTokenResolve;
}

export interface SubmitApprovalRejectByTokenRequest {
  token: string;
  reason: string;
}
