import { api } from 'api/api';
import {
  InvoiceAwaitingValidationResponse,
  CreateInvoiceRequest,
  CreateInvoiceResponse,
  InvoiceRecord,
  SearchInvoiceRequest,
  SearchInvoiceResponse
} from './invoice-type';

export const createInvoice = async (data: CreateInvoiceRequest): Promise<CreateInvoiceResponse> => {
  const response = await api.post('/v1/invoices', data).then((result) => result.data);
  return response.data;
};

export const getInvoice = async (id: string): Promise<InvoiceRecord> => {
  const response = await api
    .get('/v1/invoices', {
      params: { id }
    })
    .then((result) => result.data);

  return response.data;
};

export const resolveAwaitingValidationInvoice = async (token: string): Promise<InvoiceAwaitingValidationResponse> => {
  const response = await api
    .get('/v1/invoices/awaiting-validation', {
      params: { token }
    })
    .then((result) => result.data);

  return response.data;
};

export const approveAwaitingValidationInvoice = async (
  token: string
): Promise<InvoiceAwaitingValidationResponse> => {
  const response = await api
    .post('/v1/invoices/awaiting-validation/approve', { token })
    .then((result) => result.data);

  return response.data;
};

export const rejectAwaitingValidationInvoice = async (
  token: string
): Promise<InvoiceAwaitingValidationResponse> => {
  const response = await api
    .post('/v1/invoices/awaiting-validation/reject', { token })
    .then((result) => result.data);

  return response.data;
};

export const getInvoicesBySalesOrderId = async (salesOrderId: string): Promise<InvoiceRecord[]> => {
  const response = await api
    .get(`/v1/invoices/sales-orders/${salesOrderId}`)
    .then((result) => result.data);

  return response.data;
};

export const viewInvoice = async (id: string, original: boolean, copy: boolean) => {
  const response = await api
    .get('/v1/invoices/document', {
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

export const receiveInvoicePayment = async (id: string, data: FormData): Promise<InvoiceRecord> => {
  const response = await api
    .post(`/v1/invoices/${id}/payments`, data, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    .then((result) => result.data);

  return response.data;
};

export const sendAwaitingValidationNotification = async (
  id: string,
  paymentId: number
): Promise<InvoiceRecord> => {
  const response = await api
    .post(`/v1/invoices/${id}/payments/${paymentId}/send-awaiting-validation-notification`)
    .then((result) => result.data);

  return response.data;
};

export const searchInvoices = async (
  data: SearchInvoiceRequest,
  page: number,
  size: number
): Promise<SearchInvoiceResponse> => {
  const response = await api
    .post('/v1/invoices/search', data, {
      params: {
        page,
        size
      }
    })
    .then((result) => result.data);

  return response;
};
