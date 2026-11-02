import { api } from 'api/api';
import { Pagination } from 'services/general-type';
import {
  CreateSupplierRequest,
  CreateSupplierResponse,
  GetSupplierResponse,
  LeadTimeConfig,
  SearchSupplierRequest,
  SearchSupplierResponse,
  Supplier,
  SupplierShipping,
  SupplierShippingRoute,
  ShippingLocation,
  ShippingRoute
} from './supplier-type';

const normalizeSupplierSearchResponse = (
  response: any,
  page: number,
  size: number
): SearchSupplierResponse => {
  const rawSuppliers: Supplier[] =
    response?.data?.suppliers ?? response?.suppliers ?? response?.data ?? response ?? [];

  const suppliers: Supplier[] = Array.isArray(rawSuppliers)
    ? rawSuppliers.map((supplier) => {
        const defaultContact =
          supplier.contacts?.find((contact) => contact.isDefault) || supplier.contacts?.[0];

        return {
          ...supplier,
          supplierId: supplier.supplierId || supplier.id,
          supplierShortName: supplier.supplierShortName || supplier.supplierCode,
          contactName: supplier.contactName || defaultContact?.contactName || '',
          contactNumber: supplier.contactNumber || defaultContact?.contactNumber || '',
          phoneContactName:
            supplier.phoneContactName || defaultContact?.contactName || supplier.supplierName,
          lineContactName: supplier.lineContactName ?? defaultContact?.contactName ?? null,
          lineId: supplier.lineId ?? defaultContact?.wechat ?? null
        };
      })
    : [];

  const pagination: Pagination = response?.data?.pagination ??
    response?.pagination ?? {
      page,
      size,
      totalPage: 1,
      totalRecords: Array.isArray(suppliers) ? suppliers.length : 0
    };

  return {
    status: response?.status,
    data: {
      suppliers: Array.isArray(suppliers) ? suppliers : [],
      pagination
    }
  };
};

export const getSupplierList = async (
  data: Partial<SearchSupplierRequest>,
  page: number,
  size: number
) => {
  const response = await api
    .post(`/v1/suppliers/search`, data, {
      params: {
        page,
        size
      }
    })
    .then((res) => res.data);

  return normalizeSupplierSearchResponse(response, page, size);
};

export const searchSupplier = async (data: SearchSupplierRequest, page: number, size: number) =>
  getSupplierList(data, page, size);

export const createNewSupplier = async (
  data: CreateSupplierRequest
): Promise<CreateSupplierResponse> => {
  const response = await api.post('/v1/suppliers', data).then((res) => res.data);
  return response;
};

export const getSupplierById = async (supplierId: string): Promise<Supplier> => {
  const response: GetSupplierResponse = await api
    .get(`/v1/suppliers/${supplierId}`)
    .then((res) => res.data);

  const normalized = normalizeSupplierSearchResponse(
    {
      status: response?.status,
      data: {
        suppliers: response?.data ? [response.data] : [],
        pagination: {
          page: 1,
          size: 1,
          totalPage: 1,
          totalRecords: response?.data ? 1 : 0
        }
      }
    },
    1,
    1
  );

  return normalized.data.suppliers[0];
};

export const updateSupplier = async (supplierId: string, payload: {
  fullAddress?: string | null;
  contacts?: Array<{
    contactName?: string | null;
    contactNumber?: string | null;
    wechat?: string | null;
    isDefault?: boolean;
  }>;
}): Promise<Supplier> => {
  const response = await api.patch(`/v1/suppliers/${supplierId}`, payload).then((res) => res.data);
  return response.data;
};

export const uploadSupplierAttachments = async (
  supplierId: string,
  files: File[]
): Promise<Supplier> => {
  const formData = new FormData();
  files.forEach((file) => formData.append('attachments', file));

  const response = await api
    .post(`/v1/suppliers/${supplierId}/attachments`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    .then((result) => result.data);

  return response.data;
};

export const getSupplierShippings = async (): Promise<SupplierShipping[]> => {
  const response = await api.get('/v1/supplier-shippings').then((res) => res.data);
  return response?.data || [];
};

export const getSupplierShippingList = async (): Promise<SupplierShipping[]> => {
  const response = await api.get('/v1/supplier-shippings').then((res) => res.data);
  return response?.data || [];
};

export const getSupplierShippingRoutes = async (
  supplierShippingId?: number
): Promise<SupplierShippingRoute[]> => {
  const response = await api
    .get('/v1/supplier-shipping-routes', {
      params: supplierShippingId ? { supplierShippingId } : undefined
    })
    .then((res) => res.data);
  return response?.data || [];
};

export const searchSupplierShippingsV2 = async (params?: {
  keyword?: string;
  shippingMethod?: string;
  shippingMode?: string;
  supplierShippingId?: number;
}): Promise<SupplierShippingRoute[]> => {
  const response = await api.get('/v2/supplier-shippings', { params }).then((res) => res.data);
  return response?.data || [];
};

export const createSupplierShippingV2 = async (payload: {
  shippingMethod: 'LAND' | 'SEA';
  shippingMode?: 'STANDARD' | 'FCL';
  shippingName?: string;
  carCode?: string;
  remark?: string;
  shippingRouteIds: number[];
}): Promise<SupplierShippingRoute[]> => {
  const response = await api.post('/v2/supplier-shippings', payload).then((res) => res.data);
  return response?.data || [];
};

export const searchShippingLocations = async (params?: {
  keyword?: string;
  locationType?: string;
  countryCode?: string;
}): Promise<ShippingLocation[]> => {
  const response = await api.get('/v2/shipping-locations', { params }).then((res) => res.data);
  return response?.data || [];
};

export const createShippingLocation = async (payload: {
  code?: string;
  name: string;
  locationType?: string;
  countryCode?: string;
  province?: string;
  district?: string;
  address?: string;
}): Promise<ShippingLocation[]> => {
  const response = await api.post('/v1/shipping-locations', payload).then((res) => res.data);
  return response?.data || [];
};

export const searchShippingRoutes = async (params?: {
  keyword?: string;
  originLocationId?: number;
  destinationLocationId?: number;
}): Promise<ShippingRoute[]> => {
  const response = await api.get('/v2/shipping-routes', { params }).then((res) => res.data);
  return response?.data || [];
};

export const createShippingRoute = async (payload: {
  routeCode?: string;
  originLocationId: number;
  destinationLocationId: number;
}): Promise<ShippingRoute[]> => {
  const response = await api.post('/v1/shipping-routes', payload).then((res) => res.data);
  return response?.data || [];
};

export const checkShippingRouteExists = async (
  originLocationId: number,
  destinationLocationId: number
): Promise<boolean> => {
  const response = await api
    .get('/v2/shipping-routes/check', { params: { originLocationId, destinationLocationId } })
    .then((res) => res.data);
  return Boolean(response?.data);
};

export const getLeadTimeConfigs = async (): Promise<LeadTimeConfig[]> => {
  const response = await api.get('/v1/lead-time-configs').then((res) => res.data);
  return response?.data || [];
};
