/* eslint-disable prettier/prettier */
import { Pagination } from 'services/general-type';
import { ProductDto } from 'services/Product/product-type';
import { SaleOrderLine } from 'services/SaleOrder/sale-order-type';
import { Staff } from 'services/Staff/staff-type';
import { Supplier } from 'services/Supplier/supplier-type';

export interface PurchaseOrder {
    id: string;
    purchaseDate: string;
    supplier: Supplier;
    purchaseOrderNo: number;
    status: string;
    lines: PurchaseOrderLine[];
    createdDate: string;
    createdBy: string;
    updatedDate: string;
    updatedBy: string;
}

export interface PurchaseOrderLine {
    id: string;
    poId: string;
    saleOrderLine: SaleOrderLine;
    product: ProductDto;
    status: string;
    orderQty: number;
    receiveQty: number;
    isFirstCheck: boolean;
    isSecondCheck: boolean;
    receivePerson: Staff;
}

export interface ReceiveProductResponse {
    data: ReceiveProductData;
}

export interface ReceiveProductData {
    receiveDate: string;
    suppliers: ReceiveSupplierData[];
}

export interface ReceiveSupplierData {
    supplier: Supplier;
    receiveProducts: ReceiveProductDto[];
}

export interface ReceiveProductDto {
    buyingNo: string;
    product: ProductDto;
    orderQty: number;
    isFirstCheck: boolean;
    isSecondCheck: boolean;
    receiveQty: number;
    receivePerson: Staff;
    status: string;
    poId: string;
    polId: string;
    saleOrderLineId: string;
}

export interface UpdateReceiveProductRequest {
    receiveDate: string;
    supplierId: string;
    productSku: string;
    receiveQty: number;
    isFirstCheck: boolean;
    isSecondCheck: boolean;
    receivePerson: string;
    status: string;
}

export interface PurchaseOrderMessage {
    receiveDate: string;
    supplierId: string;
    supplierLineGroupName: string;
    message: string;
}

export interface UpdatePOLineRequest {
    status: string | null;
    detail: string | null;
    haveQty: number | null;
    salePrice: number | null;
    qty: number | null;
    receivePerson: string | null;
}

export interface SearchPurchaseOrderRequest {

}

export interface SearchPurchaseOrderResponse extends Response {
    data: {
        purchaseOrders: PurchaseOrder[];
        pagination: Pagination;
    };
}

export interface GetPurchaseOrderResponse {
    data: PurchaseOrder;
}

export interface CreatePurchaseOrderRequest {
    purchaseDate: string;
    supplierId: string;
    lines: CreatePurchaseOrderLineRequest[];
}

export interface CreatePurchaseOrderLineRequest {
    productSku: string;
    orderQty: number;
    saleOrderLineId?: string;
}

export interface CreatePurchaseOrderLineListRequest {
    lines: CreatePurchaseOrderLineRequest[];
}

export interface ReCreatePurchaseOrderRequest {
    supplierId: string;
    lines: ReCreatePurchaseOrderLineRequest[];
}

export interface ReCreatePurchaseOrderLineRequest {
    orderQty: number;
    salePrice: number;
    polId: string;
}