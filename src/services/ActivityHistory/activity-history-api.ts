import { api } from 'api/api';
import { ActivityHistoryRecord, GetActivityHistoryResponse } from './activity-history-type';

export const getActivityHistory = async (
  entityType: string,
  referenceId: string
): Promise<ActivityHistoryRecord[]> => {
  const response: GetActivityHistoryResponse = await api
    .get(`/v1/activity-history?entityType=${entityType}&referenceId=${referenceId}`)
    .then((response) => response.data);

  return response.data;
};
