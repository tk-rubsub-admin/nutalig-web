import { api } from 'api/api';
import { Pagination } from 'services/general-type';
export type ContainerStatus =
  | 'DRAFT'
  | 'LOADING'
  | 'SEALED'
  | 'IN_TRANSIT'
  | 'RECEIVED'
  | 'CANCELLED';
export type ContainerAction = 'START_LOADING' | 'SEAL' | 'DEPART' | 'RECEIVE' | 'CANCEL' | 'REOPEN';
export const CONTAINER_STATUS: Record<ContainerStatus, string> = {
  DRAFT: 'ร่าง',
  LOADING: 'กำลังจัดตู้',
  SEALED: 'ปิดตู้แล้ว',
  IN_TRANSIT: 'อยู่ระหว่างขนส่ง',
  RECEIVED: 'รับเข้าคลังแล้ว',
  CANCELLED: 'ยกเลิก'
};
export const CONTAINER_ACTIONS: Record<ContainerAction, string> = {
  START_LOADING: 'เริ่มจัดตู้',
  SEAL: 'ปิดตู้',
  DEPART: 'ออกเดินทาง',
  RECEIVE: 'รับเข้าคลัง',
  CANCEL: 'ยกเลิกตู้',
  REOPEN: 'เปิดตู้เพื่อแก้ไข'
};
export interface ContainerMetadata {
  version?: number;
  containerNo?: string | null;
  sealNo?: string | null;
  trackingNo: string | null;
  containerSize: '20GP' | '40HQ';
  supplierShippingId?: number | null;
  destinationId?: number | null;
  origin?: string | null;
  plannedDepartureDate?: string | null;
  plannedArrivalDate?: string | null;
  capacityCbm?: number | null;
  maxCargoWeightKg?: number | null;
  remark?: string | null;
}
export interface ContainerLoadRequest {
  deliveryId: number;
  deliveryDetailId?: number | null;
  scrapBoxId?: number | null;
  cartonCount: number;
  confirmUniformPackaging: boolean;
}
export interface CreateContainerRequest extends ContainerMetadata {
  loads?: ContainerLoadRequest[];
}
export type ContainerRoute = Pick<
  ShippingContainer,
  'supplierShippingId' | 'destinationId' | 'shippingMethod'
> & {
  id?: number;
  version?: number;
  containerSize?: '20GP' | '40HQ';
};
export interface DraftContainerLoad {
  source: ContainerSource;
  request: ContainerLoadRequest;
  deliveryNo: string;
  purchaseOrderNo: string;
}
export interface ContainerContent {
  purchaseOrderDetailId: number;
  componentId?: number | null;
  productName?: string | null;
  componentName?: string | null;
  quantity: number;
}
export interface ContainerLoad {
  id: number;
  deliveryId: number;
  deliveryNo: string;
  purchaseOrderNo: string;
  deliveryDetailId?: number | null;
  scrapBoxId?: number | null;
  componentName?: string | null;
  active: boolean;
  uniformPackagingConfirmed?: boolean;
  cartonCount: number;
  quantity: number;
  cbmM3: number | null;
  netWeightKg: number | null;
  grossWeightKg: number | null;
  contents: ContainerContent[];
}
export interface ShippingContainer extends ContainerMetadata {
  id: number;
  version: number;
  containerJobNo: string;
  shippingMethod: string;
  carrierName?: string | null;
  destinationName?: string | null;
  status: ContainerStatus;
  totalCartons: number;
  totalCbm: number | null;
  totalNetWeightKg: number | null;
  totalGrossWeightKg: number | null;
  sealedAt?: string | null;
  departedAt?: string | null;
  receivedAt?: string | null;
  loads: ContainerLoad[];
}
export interface ContainerSource {
  deliveryId: number;
  deliveryDetailId?: number | null;
  scrapBoxId?: number | null;
  name: string;
  totalCartons: number | null;
  availableCartons: number | null;
  quantity?: number | null;
  cbmM3: number | null;
  netWeightKg: number | null;
  grossWeightKg: number | null;
  canSplit: boolean;
  contents?: ContainerContent[];
}
export const searchContainers = async (
  filters: { keyword?: string; status?: ContainerStatus | ''; containerSize?: string },
  page = 1,
  size = 10
): Promise<{ records: ShippingContainer[]; pagination: Pagination }> =>
  (
    await api.get('/v1/shipping-containers', {
      params: {
        ...Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== '')),
        page,
        size
      }
    })
  ).data.data;
export const getContainer = async (id: number): Promise<ShippingContainer> =>
  (await api.get(`/v1/shipping-containers/${id}`)).data.data;
export const createContainer = async (data: CreateContainerRequest): Promise<ShippingContainer> =>
  (await api.post('/v1/shipping-containers', data)).data.data;
export const updateContainer = async (
  id: number,
  data: ContainerMetadata
): Promise<ShippingContainer> => (await api.put(`/v1/shipping-containers/${id}`, data)).data.data;
export const getContainerSources = async (
  id: number,
  deliveryId: number
): Promise<ContainerSource[]> =>
  (await api.get(`/v1/shipping-containers/${id}/sources`, { params: { deliveryId } })).data.data;
export const previewContainerSources = async (
  route: ContainerRoute,
  deliveryId: number
): Promise<ContainerSource[]> =>
  (
    await api.get('/v1/shipping-containers/sources', {
      params: {
        containerSize: route.containerSize,
        supplierShippingId: route.supplierShippingId,
        destinationId: route.destinationId,
        deliveryId
      }
    })
  ).data.data;
export const addContainerLoad = async (
  id: number,
  data: {
    version: number;
    deliveryId: number;
    deliveryDetailId?: number | null;
    scrapBoxId?: number | null;
    cartonCount: number;
    confirmUniformPackaging: boolean;
  }
): Promise<ShippingContainer> =>
  (await api.post(`/v1/shipping-containers/${id}/loads`, data)).data.data;
export const removeContainerLoad = async (
  id: number,
  loadId: number,
  version: number
): Promise<ShippingContainer> =>
  (await api.delete(`/v1/shipping-containers/${id}/loads/${loadId}`, { params: { version } })).data
    .data;
export const actOnContainer = async (
  id: number,
  action: ContainerAction,
  version: number,
  reason?: string
): Promise<ShippingContainer> =>
  (await api.post(`/v1/shipping-containers/${id}/actions/${action}`, { version, reason })).data
    .data;
export const containerError = (error: any) =>
  error?.response?.data?.message || error?.message || 'ไม่สามารถดำเนินการได้';
export const containerNumberLabel = (value?: number | null) =>
  value == null
    ? 'ข้อมูลไม่ครบ'
    : Number(value).toLocaleString('th-TH', { maximumFractionDigits: 6 });
