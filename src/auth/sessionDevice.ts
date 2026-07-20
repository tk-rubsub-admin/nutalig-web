import { isMobile } from 'utils';

export type AppSessionDeviceType = 'DESKTOP' | 'MOBILE';

export const getAppSessionDeviceType = (): AppSessionDeviceType => {
  if (typeof navigator === 'undefined') {
    return 'DESKTOP';
  }

  return isMobile(String(navigator.userAgent || '').toLowerCase()) ? 'MOBILE' : 'DESKTOP';
};
