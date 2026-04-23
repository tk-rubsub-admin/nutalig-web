import { MARKETPLACE } from 'services/fulfillment-type';

export const validateUserNoData = (userData: any): boolean => {
  return userData.length > 0;
};

export const validateOrder = (orderStatus: string, marketplace: string, action: string) => {
  if (action === 'pack') {
    if (marketplace === MARKETPLACE.LAZADA && orderStatus === 'PENDING') {
      return false;
    } else if (marketplace === MARKETPLACE.SHOPEE && orderStatus === 'READY_TO_SHIP(S)') {
      return false;
    } else if (marketplace === MARKETPLACE.TIKTOK && orderStatus === 'AWAITING_SHIPMENT') {
      return false;
    } else {
      return true;
    }
  } else if (action === 'print') {
    if (
      marketplace === MARKETPLACE.LAZADA &&
      (orderStatus === 'PACKED' || orderStatus === 'READY_TO_SHIP')
    ) {
      return false;
    } else if (marketplace === MARKETPLACE.SHOPEE && orderStatus === 'PROCESSED') {
      return false;
    } else if (marketplace === MARKETPLACE.TIKTOK && orderStatus === 'AWAITING_COLLECTION') {
      return false;
    } else {
      return true;
    }
  } else if (action === 'ship') {
    if (
      marketplace === MARKETPLACE.LAZADA &&
      (orderStatus === 'PACKED' || orderStatus === 'READY_TO_SHIP')
    ) {
      return false;
    } else {
      return true;
    }
  }
  return true;
};
