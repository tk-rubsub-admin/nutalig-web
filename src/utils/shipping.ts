export const SHIPPING_METHOD_LABELS: Record<string, string> = {
  ALL: 'ขนส่งทางรถ / ขนส่งทางเรือ',
  LAND: 'ขนส่งทางรถ',
  SEA: 'ขนส่งทางเรือ',
  AIR: 'ขนส่งทางเครื่องบิน',
  SEA_FCL_20GP: 'ขนส่งทางเรือ ปิดตู้ 20GP',
  SEA_FCL_40HQ: 'ขนส่งทางเรือ ปิดตู้ 40HQ',
  SEA_SHARE_FCL_20GP: 'ขนส่งทางเรือ ปิดตู้ 20GP แบบแชร์',
  SEA_SHARE_FCL_40HQ: 'ขนส่งทางเรือ ปิดตู้ 40HQ แบบแชร์'
};

/** Returns the Thai label for a persisted shipping-method code. */
export function getShippingMethodLabel(
  shippingMethod?: string | null,
  fallback = '-'
): string {
  const normalized = shippingMethod?.trim().toUpperCase();
  if (!normalized) {
    return fallback;
  }

  return SHIPPING_METHOD_LABELS[normalized] || shippingMethod;
}

/** Extracts a container size from an FCL shipping-method code. */
export function getContainerSizeFromShippingMethod(shippingMethod?: string | null): string | null {
  const normalized = shippingMethod?.trim().toUpperCase();
  const match = normalized?.match(/^SEA_(?:SHARE_)?FCL_(.+)$/);
  return match?.[1] || null;
}

/** Maps a detailed shipping-method code to the supplier-shipping category. */
export function getShippingMethodCategory(shippingMethod?: string | null): string | null {
  const normalized = shippingMethod?.trim().toUpperCase();
  if (!normalized) {
    return null;
  }
  return normalized.startsWith('SEA') ? 'SEA' : normalized;
}
