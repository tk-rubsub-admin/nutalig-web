export interface ActivityHistoryRecord {
  id: number;
  entityType: string;
  referenceId: string;
  actorId: string | null;
  actorType: string | null;
  action: string | null;
  actionAt: string | null;
  source: string | null;
  summary: string | null;
  detailJson: string | null;
  ipAddress: string | null;
  requestId: string | null;
  traceId: string | null;
  createdDate: string | null;
}

export interface GetActivityHistoryResponse {
  data: ActivityHistoryRecord[];
}
