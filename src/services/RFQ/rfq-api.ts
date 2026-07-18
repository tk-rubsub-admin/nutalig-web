import { api } from 'api/api';
import { Supplier } from 'services/Supplier/supplier-type';
import {
  CreateRFQAdditionalCostRequest,
  CreateRFQDetailRequest,
  CreateRFQRequest,
  CreateRFQResponse,
  ExtractRFQSupplierQuoteRequest,
  GenerateRFQInquiryRequest,
  GenerateRFQInquiryResponse,
  GenerateRFQInquiryTextResponse,
  GetRFQResponse,
  RFQSupplierQuoteListResponse,
  RFQSupplierQuoteResponse,
  SearchRFQResponse,
  LinkRFQSalesOrderRequest,
  RejectUrgentRFQRequest,
  RequestRFQInformationRequest,
  UpdateRFQInquiryRequest,
  UpdateRFQRequest,
  UpdateRFQPicturesResponse,
  UpsertRFQSupplierQuoteRequest,
  UpdateRFQResponse
} from './rfq-type';

export const getRFQList = async (
  page = 1,
  size = 10,
  options?: {
    id?: string;
    customerId?: string;
    salesId?: string;
    procurementId?: string;
    rfqTypeCode?: string;
    orderTypeCode?: string;
    productFamily?: string;
    productSubtype1?: string;
    productMaterial?: string;
    isCreatedPurchaseOrder?: boolean | null;
    status?: string | null;
    keyword?: string;
    requestedDateStart?: string;
    requestedDateEnd?: string;
    sortBy?: string;
    sortDirection?: string;
    statuses?: string[];
    prioritizeApprovedUrgent?: boolean;
  }
) => {
  const params = new URLSearchParams();
  params.append('page', String(page));
  params.append('size', String(size));
  const payload: Record<string, unknown> = {};

  if (options?.sortBy) {
    params.append('sortBy', options.sortBy);
  }

  if (options?.sortDirection) {
    params.append('sortDirection', options.sortDirection);
  }

  if (options?.id) {
    payload.id = options.id;
  }

  if (options?.customerId) {
    payload.customerId = options.customerId;
  }

  if (options?.salesId) {
    payload.salesId = options.salesId;
  }

  if (options?.procurementId) {
    payload.procurementId = options.procurementId;
  }

  if (options?.rfqTypeCode) {
    payload.rfqTypeCode = options.rfqTypeCode;
  }

  if (options?.orderTypeCode) {
    payload.orderTypeCode = options.orderTypeCode;
  }

  if (options?.productFamily) {
    payload.productFamily = options.productFamily;
  }

  if (options?.productSubtype1) {
    payload.productSubtype1 = options.productSubtype1;
  }

  if (options?.productMaterial) {
    payload.productMaterial = options.productMaterial;
  }

  if (options?.status) {
    payload.status = options.status;
  }

  if (options?.keyword) {
    payload.keyword = options.keyword;
  }

  if (options?.requestedDateStart) {
    payload.requestedDateStart = options.requestedDateStart;
  }

  if (options?.requestedDateEnd) {
    payload.requestedDateEnd = options.requestedDateEnd;
  }

  if (options?.statuses?.length) {
    payload.statuses = options.statuses;
  }

  if (options?.prioritizeApprovedUrgent) {
    payload.prioritizeApprovedUrgent = true;
  }

  if (options?.isCreatedPurchaseOrder === true) {
    payload.isCreatedPurchaseOrder = true;
  }

  const response: SearchRFQResponse = await api
    .post('/v1/rfqs/search', payload, { params })
    .then((response) => response.data);

  return response.data;
};

export const getRFQSuggestSuppliers = async (id: string): Promise<Supplier[]> => {
  try {
    const response = await api
      .get(`/v1/rfqs/${id}/suggest-suppliers`)
      .then((res) => res.data);

    return Array.isArray(response?.data) ? response.data : [];
  } catch (error: any) {
    const status = error?.response?.status;

    if (status === 404 || status === 204) {
      return [];
    }

    throw error;
  }
};

export const generateRFQInquiry = async (id: string) => {
  const response: GenerateRFQInquiryResponse = await api
    .post(`/v1/rfqs/${id}/inquiries/generate`)
    .then((res) => res.data);

  return response.data;
};

export const requestRFQInformation = async (payload: RequestRFQInformationRequest) => {
  const response: UpdateRFQResponse = await api
    .patch('/v1/rfqs/request-information', payload)
    .then((res) => res.data);

  return response.data;
};

export const rejectRFQ = async (id: string) => {
  const response = await api.patch(`/v1/rfqs/${id}/reject`).then((res) => res.data);

  return response.data;
};

export const acceptRFQ = async (id: string) => {
  const response = await api.patch(`/v1/rfqs/${id}/accept`).then((res) => res.data);

  return response.data;
};

export const approveUrgentRFQ = async (id: string) => {
  const response = await api.patch(`/v1/rfqs/${id}/urgent/approve`).then((res) => res.data);

  return response.data;
};

export const rejectUrgentRFQ = async (id: string, payload: RejectUrgentRFQRequest) => {
  const response = await api.patch(`/v1/rfqs/${id}/urgent/reject`, payload).then((res) => res.data);

  return response.data;
};

export const closeRFQ = async (rfqId: string, remark: string) => {
  const response = await api
    .patch('/v1/rfqs/close', { rfqId, remark })
    .then((res) => res.data);

  return response.data;
};

export const requestSpecialPriceRFQ = async (id: string) => {
  const response = await api.patch(`/v1/rfqs/${id}/request-special-price`).then((res) => res.data);

  return response.data;
};

export const updateRFQInquiry = async (
  id: string,
  inquiryId: string,
  payload: UpdateRFQInquiryRequest
) => {
  const response: GenerateRFQInquiryResponse = await api
    .patch(`/v1/rfqs/${id}/inquiries/${inquiryId}`, payload)
    .then((res) => res.data);

  return response.data;
};

export const generateFinalRFQInquiry = async (id: string) => {
  const response: GenerateRFQInquiryTextResponse = await api
    .post(`/v1/rfqs/${id}/inquiries/generate-final`)
    .then((res) => res.data);

  return response.data || '';
};

export const getRFQSupplierQuotes = async (id: string) => {
  const response: RFQSupplierQuoteListResponse = await api
    .get(`/v1/rfqs/${id}/supplier-quotes`)
    .then((res) => res.data);

  return Array.isArray(response.data) ? response.data : [];
};

export const createRFQSupplierQuote = async (
  id: string,
  payload: UpsertRFQSupplierQuoteRequest
) => {
  const response: RFQSupplierQuoteResponse = await api
    .post(`/v1/rfqs/${id}/supplier-quotes`, payload)
    .then((res) => res.data);

  return response.data;
};

export const extractRFQSupplierQuote = async (
  id: string,
  payload: ExtractRFQSupplierQuoteRequest
) => {
  const response: RFQSupplierQuoteResponse = await api
    .post(`/v1/rfqs/${id}/supplier-quotes/extract`, payload)
    .then((res) => res.data);

  return response.data as unknown as UpsertRFQSupplierQuoteRequest;
};

export const finalExtractRFQSupplierQuote = async (
  id: string,
  payload: ExtractRFQSupplierQuoteRequest
) => {
  const response: RFQSupplierQuoteResponse = await api
    .post(`/v1/rfqs/${id}/supplier-quotes/final-extract`, payload)
    .then((res) => res.data);

  return response.data as unknown as UpsertRFQSupplierQuoteRequest;
};

export const updateRFQSupplierQuote = async (
  id: string,
  quoteId: string,
  payload: UpsertRFQSupplierQuoteRequest
) => {
  const response: RFQSupplierQuoteResponse = await api
    .patch(`/v1/rfqs/${id}/supplier-quotes/${quoteId}`, payload)
    .then((res) => res.data);

  return response.data;
};

export const getRFQ = async (id: string) => {
  const response: GetRFQResponse = await api
    .get(`/v1/rfqs/${id}`)
    .then((response) => response.data);

  return response.data;
};

export const createRFQ = async (payload: CreateRFQRequest): Promise<CreateRFQResponse> => {
  const formData = new FormData();

  if (payload.customerId) {
    formData.append('customerId', payload.customerId);
  }

  if (payload.referenceRfqId) {
    formData.append('referenceRfqId', payload.referenceRfqId);
  }

  formData.append('contactName', payload.contactName);
  formData.append('contactPhone', payload.contactPhone);
  formData.append('salesId', payload.salesId);

  if (payload.procurementId) {
    formData.append('procurementId', payload.procurementId);
  }

  formData.append('rfqTypeCode', payload.rfqTypeCode);
  formData.append('orderTypeCode', payload.orderTypeCode);
  formData.append('shippingMethod', payload.shippingMethod);
  formData.append('productFamily', payload.productFamily);
  formData.append('productUsage', payload.productUsage);
  formData.append('systemMechanic', payload.systemMechanic);
  formData.append('material', payload.material);
  formData.append('capacity', payload.capacity);
  if (payload.targetPrice !== undefined && payload.targetPrice !== null) {
    formData.append('targetPrice', String(payload.targetPrice));
  }
  payload.requestedMoqs?.forEach((requestedMoq) => {
    formData.append('requestedMoqs', String(requestedMoq));
  });
  if (payload.urgentRequest !== undefined) {
    formData.append('urgentRequest', String(payload.urgentRequest));
  }
  if (payload.urgentRequestReason) {
    formData.append('urgentRequestReason', payload.urgentRequestReason);
  }
  formData.append('description', payload.description);

  payload.pictures.forEach((picture) => {
    formData.append('pictures', picture);
  });

  const response: CreateRFQResponse = await api
    .post('/v1/rfqs', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    .then((response) => response.data);

  return response;
};

export const updateRFQ = async (
  id: string,
  payload: UpdateRFQRequest
): Promise<UpdateRFQResponse> => {
  const response: UpdateRFQResponse = await api
    .patch(`/v1/rfqs/${id}`, payload)
    .then((response) => response.data);

  return response;
};

export const updateRFQCustomer = async (
  id: string,
  customerId: string
): Promise<UpdateRFQResponse> => {
  const response: UpdateRFQResponse = await api
    .post(`/v1/rfqs/${id}/customers`, { customerId })
    .then((res) => res.data);

  return response;
};

export const linkRFQSalesOrder = async (
  id: string,
  payload: LinkRFQSalesOrderRequest
): Promise<UpdateRFQResponse> => {
  const response: UpdateRFQResponse = await api
    .patch(`/v1/rfqs/${id}/sales-order`, payload)
    .then((response) => response.data);

  return response;
};

export const addRFQPictures = async (
  id: string,
  pictures: File[]
): Promise<UpdateRFQPicturesResponse> => {
  const formData = new FormData();

  pictures.forEach((picture) => {
    formData.append('pictures', picture);
  });

  const response: UpdateRFQPicturesResponse = await api
    .post(`/v1/rfqs/${id}/pictures`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    .then((response) => response.data);

  return response;
};

export const addRFQAttachments = async (
  id: string,
  attachments: File[]
): Promise<UpdateRFQPicturesResponse> => {
  const formData = new FormData();

  attachments.forEach((attachment) => {
    formData.append('attachments', attachment);
  });

  const response: UpdateRFQPicturesResponse = await api
    .post(`/v1/rfqs/${id}/attachments`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    .then((response) => response.data);

  return response;
};

export const deleteRFQPicture = async (
  id: string,
  pictureId: number
): Promise<UpdateRFQPicturesResponse> => {
  const response: UpdateRFQPicturesResponse = await api
    .delete(`/v1/rfqs/${id}/pictures/${pictureId}`)
    .then((response) => response.data);

  return response;
};

export const deleteRFQDetail = async (
  id: string,
  detailId: number
): Promise<UpdateRFQPicturesResponse> => {
  const response: UpdateRFQPicturesResponse = await api
    .delete(`/v1/rfqs/${id}/details/${detailId}`)
    .then((response) => response.data);

  return response;
};

export const deleteRFQAdditionalCost = async (
  id: string,
  additionalCostId: number
): Promise<UpdateRFQPicturesResponse> => {
  const response: UpdateRFQPicturesResponse = await api
    .delete(`/v1/rfqs/${id}/additional-costs/${additionalCostId}`)
    .then((response) => response.data);

  return response;
};

export const createRFQDetails = async (
  id: string,
  payload: CreateRFQDetailRequest[]
): Promise<UpdateRFQResponse> => {
  const response: UpdateRFQResponse = await api
    .post(`/v1/rfqs/${id}/details`, payload)
    .then((response) => response.data);

  return response;
};

export const createRFQAdditionalCosts = async (
  id: string,
  payload: CreateRFQAdditionalCostRequest[]
): Promise<UpdateRFQResponse> => {
  const response: UpdateRFQResponse = await api
    .post(`/v1/rfqs/${id}/additional-costs`, payload)
    .then((response) => response.data);

  return response;
};
