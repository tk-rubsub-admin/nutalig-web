import { DateRange, Pagination } from 'services/fulfillment-type';

export interface CreateOrderTrackingRequest {
  soId: string;
  customerPhoneNo: string;
  customerName: string;
  customerId: string | null;
  trackingNo: string;
  detail: string;
  rating: number;
  adminId: string;
}

export interface CreateOrderTrackingResponse {
  requestId: string;
}

export interface CustomerOrderTracking {
  id: string;
  soId: string;
  customerName: string;
  rating: number;
  createdBy: string;
  createdDate: string;
}

export interface SearchOrderTrackingRequest {
  createdDate: DateRange | null;
  orderTrackingIdEqual: string;
  soIdEqual: string;
  customerIdEqual: string;
  customerNameContain: string;
  adminIdEqual: string;
}

export interface SearchOrderTrackingResponse extends Response {
  data: {
    pagination: Pagination;
    orderTrackings: CustomerOrderTracking[];
  };
}

export interface CreateCustomerComplainRequest {
  contactPhoneNo: string;
  contactName: string;
  customerId: string | null;
  topic: string;
  detail: string;
  rating: number;
  adminId: string;
}

export interface CreateCustomerComplainResponse {
  requestId: string;
}

export interface Complain {
  id: string;
  contactName: string;
  topic: string;
  rating: number;
  createdBy: string;
  createdDate: string;
}

export interface SearchCustomerComplainRequest {
  createdDate: DateRange | null;
  complainIdEqual: string;
  customerIdEqual: string;
  contactNameContain: string;
  adminIdEqual: string;
}

export interface SearchCustomerComplainResponse extends Response {
  data: {
    pagination: Pagination;
    customerComplains: Complain[];
  };
}

export interface CreateCustomerOutboundRequest {
  customerId: string;
  topic: string;
  detail: string;
  rating: number;
  adminId: string;
}

export interface CreateCustomerOutboundResponse {
  outboundId: string;
}

export interface Outbound {
  id: string;
  customerName: string;
  topic: string;
  rating: number;
  createdBy: string;
  createdDate: string;
}

export interface SearchCustomerOutboundRequest {
  createdDate: DateRange | null;
  outboundIdEqual: string;
  customerIdEqual: string;
  contactNameContain: string;
  adminIdEqual: string;
}

export interface SearchCustomerOutboundResponse extends Response {
  data: {
    pagination: Pagination;
    customerOutbounds: Outbound[];
  };
}
