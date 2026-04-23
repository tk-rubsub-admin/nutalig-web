/* eslint-disable prettier/prettier */
import { Customer, CustomerDropOff } from 'services/Customer/customer-type';
import { Pagination } from 'services/general-type';
import { ProductDto } from 'services/Product/product-type';
import { Staff, StaffKPI } from 'services/Staff/staff-type';
import { Supplier } from 'services/Supplier/supplier-type';

export type ExportFormat = 'PDF' | 'PNG' | 'JPG';
export interface CreateSaleOrderRequest {
    urgentOrder: boolean;
    customerId: string;
    customerName: string;
    contactNumber: string;
    creditTerm: string;
    dropOffId: string;
    dropOffName: string;
    supplierId: string;
    areaType: string;
    provinceId: string;
    amphureId: string;
    orderMakerId: string;
    deliveryDate: string;
    sendingTime: string;
    notes: string;
    itemList: CreateSaleOrderLineRequest[];
};

export interface CreateSaleOrderLineRequest {
    item: ProductDto | null;
    itemName: string | null;
    itemSku: string | null;
    qty: number | null;
    remark: string,
    isClaimed: boolean
}
export interface SearchSaleOrderRequest {
    createdDate: string | null;
    deliveryDate: string | null;
    startDeliveryDate: string | null;
    endDeliveryDate: string | null;
    poStatusIn: string[] | null;
    poStatusEqual: string | null;
    billingStatusIn: string[] | null;
    billingStatusEqual: string | null;
    saleOrderLineStatusEqual: string | null;
    saleOrderLineStatusIn: string[] | [] | null;
    customerNameContain: string | null;
    customerIdEqual: string | null;
    supplierIdEqual: string | null;
    poMakerIdEqual: string | null;
    areaTypeEqual: string | null;
    orderNoEqual: number | null;
}

export interface SearchOrderResponse extends Response {
    data: {
        saleOrders: SaleOrder[];
        pagination: Pagination;
    };
}

export interface GetSaleOrderResponse {
    data: SaleOrder;
}

export interface SaleOrder {
    urgentOrder: boolean;
    isAllowToMakeOrder: boolean;
    id: string;
    orderNo: string;
    poStatus: string;
    billingStatus: string;
    paymentStatus: string;
    customer: Customer;
    poMaker: Staff;
    deliveryDate: string;
    sendingTime: string;
    freight: number;
    additionalItem: string;
    remark: string;
    receiptNo: string;
    receiptDate: string;
    invoiceNo: string;
    invoiceHeader: string;
    createdDate: string;
    createdBy: string;
    updatedDate: string;
    updatedBy: string;
    packagePic: string;
    totalPackage: OrderPackage;
    packedStaffs: StaffKPI[];
    saleOrderLines: SaleOrderLine[]
    packagePics: SaleOrderPicture[];
    dropOff: CustomerDropOff;
    generatedLink: string;
    nextId: string;
    previousId: string;
    invoiceDate: string;
    dueDate: string;
    poAmount: number;
    invoiceAmount: number;
    subtotal: number;
    discount: number;
    grandTotal: number;
    withholdingTax: number;
    whtAmount: number;
    orderStatus: string;
    projectName: string;
}

export interface SaleOrderLine {
    isManual: any;
    itemImageUrl: string | undefined;
    no: number;
    id: string;
    orderId: string;
    itemSku: string;
    itemName: string;
    qty: number;
    haveQty: number;
    orderQty: number;
    oldQty: number[];
    amount: number;
    status: string;
    statusDetail: string;
    salesPrice: number;
    isFirstCheck: boolean;
    isSecondCheck: boolean;
    purchaseFrom: string;
    remark: string;
    isClaimed: boolean;
    supplier: Supplier;
    createdDate: string;
    createdBy: string;
    updatedDate: string;
    updatedBy: string;
}

export interface SaleOrderLineSupplier {
    supplier: Supplier;
    orderQty: number;
}

export interface SaleOrderPicture {
    picId: string;
    picUrl: string;
}

export interface POLineSupplier {
    rowId: string;
    poLineId: string | undefined;
    supplierId: string;
    supplierName: string;
    orderQty: number | null;
    salePrice: number;
    productSku: string | undefined;
    productName: string | undefined;
    remark: string | undefined;
}

export interface OrderPackage {
    bigBox: number | undefined;
    smallBox: number | undefined;
    softBox: number | undefined;
    phalanBox: number | undefined;
    bigFoamBox: number | undefined;
    smallFoamBox: number | undefined;
    wrap: number | undefined;
    oasis: number | undefined;
    bag: number | undefined;
    other: number | undefined;
    packedStaff: Staff[] | [];
}

export interface UpdatePOLineRequest {
    status: string | null;
    detail: string | null;
    haveQty: number | null;
    salePrice: number | null;
    qty: number | null;
}

export interface AssignPORequest {
    poIds: string[];
    staffId: string;
}

export interface UpdateSaleOrderLineSupplierRequest {
    suppliers: SaleOrderLineSupplierRequest[];
}

export interface SaleOrderLineSupplierRequest {
    supplierId: string;
    supplierName: string;
    productSku: string | undefined;
    productName: string | undefined;
    remark: string | undefined;
    orderQty: number;
    salePrice: number;
}

export interface UpdateSaleOrderLineSupplierRequestV2 {
    suppliers: SaleOrderLineSupplierRequestV2[];
}
export interface SaleOrderLineSupplierRequestV2 {
    supplierId: string;
    supplierName: string;
    productSku: string | undefined;
    productName: string | undefined;
    orderQty: number;
    salePrice: number;
    poLineId: string;
    isShared: boolean;
}

export interface SaleOrderMessage {
    supplierId: string;
    supplierLineGroupName: string;
    message: string;
}

export interface UpdateSaleOrderBilling {
    dueDate: string;
    poLines: SaleOrderLine[]
    discount: number;
    withholdingTax: number;
}

export interface UpdateSaleOrderRequest {
    poStatus: string | null;
    billingStatus: string | null;
    sendingTime: string | null;
    freight: number | null;
    additionalItem: string | null;
    remark: string | null;
    invoiceHeader: string | null;
}
export interface CreateSaleOrderLineRequestV2 {
    lines: CreateSaleOrderLineRequest[];
}
export interface CreateSaleOrderLineResponse {
    data: {
        id: string;
    },
    message: string;
    status: string;
}

export const poStatus = ['AWAITING_PAYMENT', 'ORDER_CONFIRMED', 'PROCESSING', 'COMPLETED', 'SHIPPED', 'DELIVERED', 'CANCELLED']
export const poLineStatus = ['OUT_OF_STOCK', 'NEW', 'INCOMPLETE', 'PROCESSING', 'COMPLETE', 'PACKED', 'CANCEL']
export const billingStatus = ['ยังไม่ได้เปิดบิล', 'เปิดบิลแล้ว'];
export const paymentStatus = ['UNPAID', 'PARTIALLY_PAID', 'PAID', 'OVERPAID']