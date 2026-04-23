export interface GetShopList {
  shops: Shop[];
}

export interface Shop {
  shopId: string;
  shopName: string;
  shopLabel: string;
  shopStatus: string;
  marketPlace: string;
  createdDate: string;
  updatedDate: string;
  isSyncStock: boolean;
  isSyncOrder: boolean;
  syncTime: number;
  isAutoCutoff: boolean;
  cutoffTime: number;
}

export interface CreateShop {
  shopName: string;
  companyId: string;
  marketPlace: string;
  isSyncStock: boolean;
  isSyncOrder: boolean;
  syncTime: number;
  isAutoCutoff: boolean;
  cutoffTime: number;
  isAutoPack: boolean;
  packTime: number;
}

export interface AddNewShopDialogProps {
  open: boolean;
  companyId: string;
  onClose: () => void;
}

export interface ShopDialogProps {
  open: boolean;
  shop: Shop;
  onClose: () => void;
}

export interface GetTikTokAuthorizeShop {
  data: TikTokAuthorizeShop[];
}

export interface TikTokAuthorizeShop {
  region: string;
  shopCipher: string;
  shopCode: string;
  shopId: string;
  shopName: string;
  type: number;
}

export interface CreateNewTikTokShopRequest extends CreateShop {
  info: TikTokAuthorizeShop;
}

export interface CreateNewTikTokShopInfo extends TikTokAuthorizeShop {
  authorizationUrl: string;
  appKey: string;
  appSecret: string;
  authCode: string;
}

export interface CreateNewShopeeShopRequest extends CreateShop {
  info: ShopeeShop;
}

export interface ShopeeShop {
  redirectUrl: string;
  partnerId: number;
  partnerSecret: string;
  authCode: string;
  shopId: number;
  shopCode: string;
  shopName: string;
}

export interface CreateNewLineShopRequest extends CreateShop {
  info: LineShop;
}

export interface LineShop {
  apiKey: string;
  lineShopId: string;
  shopName: string;
}

export interface CreateNewLazadaShopRequest extends CreateShop {
  info: LazadaShop;
}

export interface LazadaShop {
  redirectUrl: string;
  appKey: string;
  appSecret: string;
  authCode: string;
  shopId: string;
  shopName: string;
}

export interface UpdateShopRequest {
  shopName: string;
  shopStatus: string;
  isSyncStock: boolean;
  isSyncOrder: boolean;
  syncTime: number;
  isAutoCutoff: boolean;
  cutoffTime: Date | string;
  isAutoPack: boolean;
  packTime: number;
}
