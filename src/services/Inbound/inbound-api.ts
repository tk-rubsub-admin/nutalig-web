import { crmAPI } from 'api/api';
import { GetTrackingDetail } from 'services/Tracking/tracking-type';
import {
  CreateCustomerComplainRequest,
  CreateCustomerComplainResponse,
  CreateCustomerOutboundRequest,
  CreateCustomerOutboundResponse,
  CreateOrderTrackingRequest,
  CreateOrderTrackingResponse,
  SearchCustomerComplainRequest,
  SearchCustomerComplainResponse,
  SearchCustomerOutboundRequest,
  SearchCustomerOutboundResponse,
  SearchOrderTrackingRequest,
  SearchOrderTrackingResponse
} from './inbound-type';
export const getTrackingEvent = async (soId: string, shipping: string, trackingNo: string) => {
  const response: GetTrackingDetail = await crmAPI
    .get(`/v1/tracking/orders/${soId}/shipping/${shipping}/tracking-no/${trackingNo}`)
    .then((response) => response.data);
  return response;
};

export const createOrderTracking = async (data: CreateOrderTrackingRequest) => {
  const response: CreateOrderTrackingResponse = await crmAPI
    .post(`/v1/inbound/order-tracking`, data)
    .then((response) => response.data);
  return response;
};

export const searchOrderTracking = async (
  data: SearchOrderTrackingRequest,
  page: number,
  size: number
) => {
  const response: SearchOrderTrackingResponse = await crmAPI
    .post(`/v1/inbound/order-tracking/search`, data, {
      params: {
        page,
        size
      }
    })
    .then((response) => response.data);
  return response;
};

export const createCustomerComplain = async (data: CreateCustomerComplainRequest) => {
  const response: CreateCustomerComplainResponse = await crmAPI
    .post(`/v1/inbound/complains`, data)
    .then((response) => response.data);
  return response;
};

export const searchCustomerComplain = async (
  data: SearchCustomerComplainRequest,
  page: number,
  size: number
) => {
  const response: SearchCustomerComplainResponse = await crmAPI
    .post(`/v1/inbound/complains/search`, data, {
      params: {
        page,
        size
      }
    })
    .then((response) => response.data);
  return response;
};

export const createCustomerOutbound = async (data: CreateCustomerOutboundRequest) => {
  const response: CreateCustomerOutboundResponse = await crmAPI
    .post(`/v1/inbound/outbounds`, data)
    .then((response) => response.data);
  return response;
};

export const searchCustomerOutbound = async (
  data: SearchCustomerOutboundRequest,
  page: number,
  size: number
) => {
  const response: SearchCustomerOutboundResponse = await crmAPI
    .post(`/v1/inbound/outbounds/search`, data, {
      params: {
        page,
        size
      }
    })
    .then((response) => response.data);
  return response;
};
