import { api } from 'api/api';
import {
  CreatePriceListRequest,
  CreatePriceListResponse,
  CreateProductSupplier,
  GeneratePriceListImageResponse,
  GetAllPriceListResponse,
  GetProductBySkuResponse,
  GetProductPriceResponse,
  ProductFamily,
  ProductFamilyResponse,
  PriceListHeader,
  SearchProductRequest,
  SearchProductResponse,
  SearchProductSupplierRequest,
  SearchProductSupplierResponse,
  SuggestSupplierResponse,
  UpdateProductSupplierPrice
} from './product-type';

export const searchProduct = async (data: SearchProductRequest, page: number, size: number) => {
  const response: SearchProductResponse = await api
    .post(`/v1/products/search`, data, {
      params: {
        page,
        size
      }
    })
    .then((response) => response.data);

  return response;
};

export const getProductSupplier = async (
  data: SearchProductSupplierRequest,
  page: number,
  size: number
) => {
  const response: SearchProductSupplierResponse = await api
    .post(`/v1/products/supplier/search`, data, {
      params: {
        page,
        size
      }
    })
    .then((response) => response.data);

  return response;
};

export const getProductBySku = async (sku: string) => {
  const response: GetProductBySkuResponse = await api
    .get(`/v1/products/skus/${sku}`)
    .then((response) => response.data);

  return response;
};

export const getSuggestSupplierByProduct = async (sku: string) => {
  const response: SuggestSupplierResponse = await api
    .get(`/v1/products/${sku}/supplier`)
    .then((response) => response.data);

  return response;
};

export const createProductSupplier = async (sku: string, data: CreateProductSupplier) => {
  const response = await api
    .post(`/v1/products/${sku}/suppliers`, data)
    .then((response) => response.data);

  return response;
};

export const updateProductSupplierPrice = async (
  sku: string,
  supplierId: string,
  data: UpdateProductSupplierPrice
) => {
  const response = await api
    .patch(`/v1/products/${sku}/suppliers/${supplierId}`, data)
    .then((response) => response.data);

  return response;
};

export const deleteProductSupplier = async (sku: string, supplierId: string) => {
  const response = await api
    .delete(`/v1/products/${sku}/suppliers/${supplierId}`)
    .then((response) => response.data);

  return response;
};

export const uploadProductSupplier = async (data: FormData) => {
  const config = {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  };

  const response = await api
    .post(`/v1/products/suppliers/upload`, data, config)
    .then((response) => response.data);
  return response.data;
};

export const uploadProduct = async (data: FormData) => {
  const config = {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  };

  const response = await api
    .post(`/v1/products/upload`, data, config)
    .then((response) => response.data);
  return response.data;
};

export const downloadTemplate = async (id: string) => {
  const response = await api.get(`/v1/download/template/${id}`, {
    responseType: 'blob'
  });
  return response;
};

export const updateProductKeyword = async (sku: string, keywords: string[]) => {
  const response = await api
    .patch(`/v1/products/${sku}/keywords`, { keywords })
    .then((response) => response);
  return response;
};

export const getProductConfig = async (code: string) => {
  const response = await api.get(`/v1/products/configs/${code}`).then((response) => response.data);
  return response.data;
};

export const exportProduct = async (data: SearchProductRequest) => {
  const response = await api.post(`/v1/products/export`, data, {
    responseType: 'blob'
  });
  return response;
};

export const exportProductSupplier = async (data: SearchProductSupplierRequest) => {
  const response = await api
    .post(`/v1/products/supplier/export`, data, {
      responseType: 'blob'
    });
  return response;
};

export const getProductPriceByDate = async (date: string, page: number, size: number) => {
  const response: GetProductPriceResponse = await api
    .get(`/v1/products/prices?date=${date}&page=${page}&size=${size}`)
    .then((response) => response.data);

  return response.data;
};

export const uploadProductPrice = async (data: FormData) => {
  const config = {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  };

  const response = await api
    .post(`/v1/products/prices/upload`, data, config)
    .then((response) => response.data);
  return response.data;
};

export const exportProductPrice = async () => {
  const response = await api.post(`/v1/products/prices/export`, null, {
    responseType: 'blob'
  });
  return response;
};

export const isSkuCheck = async (sku: string) => {
  const response = await api.get(`/v1/products/sku/${sku}/check`).then((response) => response.data);
  return response.data;
};

export const createProduct = async (data: FormData) => {
  const config = {
    headers: { 'Content-Type': 'multipart/form-data' }
  };

  const response = await api.post('/v1/products', data, config).then((response) => response.data);
  return response;
};

export const getProductFamilies = async (): Promise<ProductFamily[]> => {
  const response: ProductFamilyResponse = await api
    .get('/v1/products/product-families')
    .then((response) => response.data);

  return response.data || [];
};

export const createPriceList = async (data: CreatePriceListRequest) => {
  const response: CreatePriceListResponse = await api
    .post('/v1/price-lists', data)
    .then((response) => response.data);
  return response;
};

export const updatePriceList = async (id: string, data: CreatePriceListRequest) => {
  const response = await api
    .patch(`/v1/price-list/${id}/edit`, data)
    .then((response) => response.data);
  return response;
};

export const getAllPriceList = async () => {
  const response: GetAllPriceListResponse = await api
    .get('/v1/price-lists/all')
    .then((response) => response.data);
  return response;
};

export const getPriceListById = async (id: string) => {
  const response: PriceListHeader = await api
    .get(`/v1/price-list/${id}`)
    .then((response) => response.data);
  return response;
};

export const generatePriceListImage = async (id: string) => {
  const response: GeneratePriceListImageResponse = await api
    .get(`/v1/price-list/${id}/generate`)
    .then((response) => response.data);
  return response;
};
