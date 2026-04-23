/* eslint-disable prettier/prettier */
import { Province } from 'services/Address/address-type';
import { Pagination } from 'services/general-type';

export interface FreightPrice {
    id: string
    freightName: string;
    packages: string;
    packageName: string;
    province: Province;
    packagePrice: number;
    packageProductSku: string;
    freightPrice: number;
    freightProductSku: string;
    createdDate: string;
    createdBy: string;
    updatedDate: string;
    updatedBy: string;
}

export interface GetFreightPriceResponse {
    data: FreightPrice[];
}

export interface SearchFreightResponse {
    freights: FreightPrice[];
    pagination: Pagination;
}

export interface SearchFreightRequest {
    packagesIn: string[]
    provinceIdIn: string[]
}

export interface GetFreightPriceRequest {
    provinceId: string;
    amphureId: string;
    supplierId: string;
}

export const packageList = ['bigBox',
    'smallBox',
    'softBox',
    'bigFoamBox',
    'smallFoamBox',
    'oasis',
    'wrap',
    'bag']