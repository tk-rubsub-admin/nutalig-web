import { SystemConfig } from 'services/Config/config-type';
import { Pagination } from 'services/general-type';
import { Supplier } from 'services/Supplier/supplier-type';

export interface SearchProductRequest {
  nameContain: string;
  skuContain: string;
  categoryEqual: string;
  groupEqual: string;
  subGroupEqual: string;
  parentSkuEqual: string;
  isIncludeParentSku: boolean;
  categoryIn: string[];
  groupIn: string[];
  subGroupIn: string[];
}

export interface Product {
  name: string;
  permalink: string;
  sku: string;
  tags: Data[];
  images: Data[];
}

export interface Data {
  id: string;
  src: string;
  name: string;
}

export interface ProductDto {
  productSku: string;
  parentProductSku: string;
  productId: string;
  productType: string;
  productCategory: string;
  productGroup: string;
  productSubgroup: string;
  productNameTh: string;
  productNameEn: string;
  categories: string;
  shippingType: string;
  aboutThis: string;
  colorCodeDatabase: number;
  colorNameDatabase: string;
  colorFilterDatabase: string;
  productSize: string;
  productPattern: string;
  quantity: string;
  unit: string;
  amount: string;
  weightKg: number;
  widthCm: number;
  lengthCm: number;
  heightCm: number;
  leafSize: string;
  images: string;
  gallery: string;
  shelfLive: string;
  storageInstructions: string;
  keywords: string;
  haveThorn: string;
  shippedQuantity: number;
  retailPrice: number;
  wholesalePrice: number;
  unitCost: number;
  source: string;
  target: string;
}

export interface ProductFamily {
  code: string;
  nameTh: string;
  nameEn: string;
}

export interface ProductFamilyResponse {
  data: ProductFamily[];
}

export interface ProductSupplier {
  productSku: string;
  product: ProductDto;
  frequency: string;
  suppliers: ProductSupplierPrice[];
  createdBy: string;
  createdDate: string;
  updatedBy: string;
  updatedDate: string;
}

export interface ProductSupplierPrice {
  supplier: Supplier;
  price: number;
}

export interface SearchProductSupplierRequest {
  sku: string;
  categoryEqual: string;
  groupEqual: string;
  subGroupEqual: string;
  frequencyEqual: string;
}

export interface SearchProductResponse extends Response {
  data: {
    products: ProductDto[];
    pagination: Pagination;
  };
}

export interface SearchProductSupplierResponse extends Response {
  data: {
    products: ProductSupplier[];
    pagination: Pagination;
  };
}

export interface GetProductBySkuResponse extends Response {
  data: Product;
}

export interface SuggestSupplierResponse {
  data: SuggestSupplier;
}

export interface SuggestSupplier {
  suggestSuppliers: Supplier[];
  suppliers: Supplier[];
}

export interface CreateProductSupplier {
  supplierId: string;
  salePrice: number;
}

export interface UpdateProductSupplierPrice {
  salePrice: number;
}

export interface ProductPrice {
  productSku: string;
  product: ProductDto;
  productStatus: string;
  costOfGoodsSold: number;
  retailPrice: number;
  wholeSalePrice1: number;
  wholeSalePrice2: number;
  wholeSalePrice3: number;
  wholeSalePrice4: number;
  wholeSalePrice5: number;
  wholeSalePrice6: number;
  wholeSalePrice7: number;
  isSelfStock: boolean;
  isMainProduct: boolean;
  priceList: SystemConfig;
  createdDate: string;
  createdBy: string;
  updatedDate: string;
  updatedBy: string;
}

export interface GetProductPriceResponse {
  data: {
    date: string;
    lastUpdatedDate: string;
    bkkPrices: ProductPrice[];
    provincePrices: ProductPrice[];
    bkkPagination: Pagination;
    provincePagination: Pagination;
  };
}

export interface PriceListHeader {
  headerId: string;
  name: string;
  type: string;
  status: string;
  createdDate: string;
  createdBy: string;
  updatedDate: string;
  updatedBy: string;
  details: PriceListDetail[];
}

export interface PriceListDetail {
  detailId: string;
  headerId: string;
  productName: string;
  type: string;
  cost: number;
  profitBkk: number;
  profitProvince: number;
  salePriceBkk: number;
  wholeSalePriceBkk: number;
  salePriceProvince: number;
  wholeSalePriceProvince: number;
  seq: number;
  createdDate: string;
  createdBy: string;
  updatedDate: string;
  updatedBy: string;
}

export interface CreatePriceListRequest {
  name: string;
  type: string;
  status: string;
  details: CreatePriceListDetailRequest[];
}

export interface CreatePriceListDetailRequest {
  id: string;
  productName: string;
  cost: number;
  profitBkk: number;
  profitProvince: number;
  salePrice: number;
  wholeSalePrice: number;
}

export interface CreatePriceListResponse {
  data: {
    id: string;
  };
}

export interface GetAllPriceListResponse {
  data: PriceListHeader[];
}

export interface GeneratePriceListImageResponse {
  data: {
    imageUrls: string[];
  };
}
