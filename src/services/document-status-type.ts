export type DocumentLifecycleStatus =
  | 'DRAFT'
  | 'OPEN'
  | 'FINALIZED'
  | 'CANCELLED'
  | 'VOID';

export type CommercialOutcomeStatus =
  | 'NONE'
  | 'PENDING'
  | 'SENT'
  | 'ACCEPTED'
  | 'REJECTED';

export type PaymentLifecycleStatus =
  | 'NONE'
  | 'UNPAID'
  | 'PARTIALLY_PAID'
  | 'PAID';

export type ApprovalLifecycleStatus =
  | 'NONE'
  | 'AWAITING_VALIDATION'
  | 'APPROVED'
  | 'REJECTED';

export interface DocumentStatusProfile {
  documentLifecycle: DocumentLifecycleStatus;
  commercialOutcome: CommercialOutcomeStatus;
  paymentLifecycle: PaymentLifecycleStatus;
  approvalLifecycle: ApprovalLifecycleStatus;
}
