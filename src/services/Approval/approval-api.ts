import { api } from 'api/api';
import {
  GetApprovalRejectTokenResolveResponse,
  SubmitApprovalRejectByTokenRequest
} from './approval-type';

export const resolveApprovalRejectToken = async (token: string) => {
  const response: GetApprovalRejectTokenResolveResponse = await api
    .get('/v1/approvals/reject-form', {
      params: { token }
    })
    .then((res) => res.data);

  return response.data;
};

export const submitApprovalRejectByToken = async (
  payload: SubmitApprovalRejectByTokenRequest
) => {
  const response = await api.post('/v1/approvals/reject-form', payload).then((res) => res.data);
  return response.data;
};
