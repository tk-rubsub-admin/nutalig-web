import { api } from 'api/api';
import {
  CreateReceiptRequest,
  CreateReceiptResponse,
  ReceiptRecord,
  SearchReceiptRequest,
  SearchReceiptResponse
} from './receipt-type';

export const createReceipt = async (data: CreateReceiptRequest): Promise<CreateReceiptResponse> => {
  const response = await api.post('/v1/receipts', data).then((result) => result.data);
  return response.data;
};

export const getReceipt = async (id: string): Promise<ReceiptRecord> => {
  const response = await api
    .get('/v1/receipts', {
      params: { id }
    })
    .then((result) => result.data);

  return response.data;
};

export const viewReceipt = async (id: string, original: boolean, copy: boolean) => {
  const response = await api
    .get('/v1/receipts/document', {
      params: {
        id,
        format: 'PDF',
        isOriginal: original,
        isCopy: copy
      }
    })
    .then((result) => result);

  return response;
};

export const voidReceipt = async (id: string): Promise<ReceiptRecord> => {
  const response = await api.patch(`/v1/receipts/${id}/void`).then((result) => result.data);
  return response.data;
};

export const searchReceipts = async (
  data: SearchReceiptRequest,
  page: number,
  size: number
): Promise<SearchReceiptResponse> => {
  const response = await api
    .post('/v1/receipts/search', data, {
      params: { page, size }
    })
    .then((result) => result.data);

  return response;
};
