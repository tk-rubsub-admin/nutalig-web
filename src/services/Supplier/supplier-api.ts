import { api } from 'api/api';
import { Pagination } from 'services/general-type';
import {
  GetSupplierResponse,
  SearchSupplierRequest,
  SearchSupplierResponse,
  Supplier,
  SupplierShipping
} from './supplier-type';

const normalizeSupplierSearchResponse = (
  response: any,
  page: number,
  size: number
): SearchSupplierResponse => {
  const rawSuppliers: Supplier[] =
    response?.data?.suppliers ??
    response?.suppliers ??
    response?.data ??
    response ??
    [];

  const suppliers: Supplier[] = Array.isArray(rawSuppliers)
    ? rawSuppliers.map((supplier) => {
      const defaultContact = supplier.contacts?.find((contact) => contact.isDefault) || supplier.contacts?.[0];

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

  const pagination: Pagination =
    response?.data?.pagination ??
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

export const getSupplierShippings = async (): Promise<SupplierShipping[]> => {
  const response = await api.get('/v1/supplier-shippings').then((res) => res.data);
  return response?.data || [];
};
