import { Customer } from 'services/Customer/customer-type';
import { DateRange, Pagination } from 'services/fulfillment-type';

export interface SearchOrderRequest {
  soDate: DateRange | null;
  packDate: DateRange | null;
  soIdEqual: string;
  shippingEqual: string;
  trackingNoContain: string;
  customerNameContain: string;
  itemIdEqual: string;
  salesmanIdEqual: string;
}

export interface SyncOrderRequest {
  syncOrderDate: DateRange;
}

export interface DefaultSearchOrderRequest {
  companyId: string;
  orderDate: DateRange;
}

export interface SearchOrderResponse extends Response {
  data: {
    purchaseOrders: Order[];
    pagination: Pagination;
  };
}

export interface Order {
  soId: string;
  comId: string;
  orderType: string;
  soDate: string;
  soNav: string;
  packingDate: string;
  shipping: string;
  trackingNo: string;
  id: string;
  orderStatus: string;
  poMaker: {
    displayName: string;
  };
  billingStatus: string;
  sendingTime: string;
  remark: string;
  freight: number;
  itemId: string;
  itemName: string;
  qty: number;
  status: string;
  cusId: string;
  cusName: string;
  customer: {
    customerId: string;
    customerName: string;
  };
  cusFirstName: string;
  cusLastName: string;
  cusAddress: string;
  cusTumbon: string;
  cusAmphoe: string;
  cusCity: string;
  cusZipCode: string;
  salemanId: string;
  invoiceNo: string;
  channelName: string;
}

export interface OrderStatusList {
  data: OrderStatuses[];
}

export interface OrderStatuses {
  marketPlace: string;
  statuses: OrderStatus[];
}

export interface OrderStatus {
  statusCode: string;
  marketPlace: string;
  status: string;
  statusNameTh: string;
  statusNameEn: string;
  sequence: number;
}

export interface OrderParam {
  id: string;
  marketPlace: string;
}

export interface OrderDetail {
  orderId: string;
  companyId: string;
  shopId: string;
  marketPlace: string;
  syncedStartDate: string;
  syncedEndDate: string;
  orderCreateDate: string;
  paymentMethod: string;
  shippingProvider: string;
  trackingNumber: string;
  orderAmount: number;
  orderStatus: string;
  buyer: string;
  orderLines: OrderLine[];
  payment: Payment;
  recipientAddress: RecipientAddress;
}

export interface OrderLine {
  orderLineId: string;
  productId: string;
  productName: string;
  salePrice: number;
  sellerDiscount: number;
  sellerSku: string;
  skuImage: string;
  skuName: string;
}

export interface Payment {
  currency: string;
  originalShippingFee: number;
  originalTotalProductPrice: number;
  platformDiscount: number;
  sellerDiscount: number;
  shippingFee: number;
  subTotal: number;
  totalAmount: number;
}

export interface RecipientAddress {
  addressDetail: string;
  addressLine: string;
  fullAddress: string;
  city: string;
  district: string;
  name: string;
  phone: string;
  regionCode: string;
  zipcode: string;
}

export interface BulkPackOrderRequest {
  companyId: string;
  shopId: string;
  orderId: string;
}

export interface OrderCustomerResponse {
  data: Customer;
}
