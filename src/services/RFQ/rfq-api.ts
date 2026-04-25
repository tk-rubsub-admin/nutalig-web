import { api } from 'api/api';
import {
  CreateRFQAdditionalCostRequest,
  CreateRFQDetailRequest,
  CreateRFQRequest,
  CreateRFQResponse,
  GetRFQResponse,
  SearchRFQResponse,
  UpdateRFQRequest,
  UpdateRFQPicturesResponse,
  UpdateRFQResponse
} from './rfq-type';

export const getRFQList = async (
  page = 1,
  size = 10,
  options?: {
    sortBy?: string;
    sortDirection?: string;
  }
) => {
  const params: Record<string, string | number> = {
    page,
    size
  };

  if (options?.sortBy) {
    params.sortBy = options.sortBy;
  }

  if (options?.sortDirection) {
    params.sortDirection = options.sortDirection;
  }

  const response: SearchRFQResponse = await api
    .get('/v1/rfqs', { params })
    .then((response) => response.data);

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

  formData.append('contactName', payload.contactName);
  formData.append('contactPhone', payload.contactPhone);
  formData.append('salesId', payload.salesId);

  if (payload.procurementId) {
    formData.append('procurementId', payload.procurementId);
  }

  formData.append('orderTypeCode', payload.orderTypeCode);
  formData.append('productFamily', payload.productFamily);
  formData.append('productUsage', payload.productUsage);
  formData.append('systemMechanic', payload.systemMechanic);
  formData.append('material', payload.material);
  formData.append('capacity', payload.capacity);
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
