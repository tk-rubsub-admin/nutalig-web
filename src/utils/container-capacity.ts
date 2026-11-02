export type ContainerSize = '20GP' | '40HQ';

// Nominal internal volume in cubic metres. Keep these values in one place so
// the UI can be updated when the business-approved capacity changes.
export const CONTAINER_CAPACITY_CBM: Record<ContainerSize, number> = {
  '20GP': 35,
  '40HQ': 60
};

export const CONTAINER_CBM_WARNING_RATIO = 0.8;

export function getContainerCapacityCbm(size?: ContainerSize | null): number {
  return size ? CONTAINER_CAPACITY_CBM[size] : 0;
}

export function getContainerCbmUsageRatio(
  size: ContainerSize | null | undefined,
  totalCbm: number
) {
  const capacity = getContainerCapacityCbm(size);
  return capacity > 0 ? totalCbm / capacity : 0;
}

export function getContainerCbmWarning(
  size: ContainerSize | null | undefined,
  totalCbm: number
): 'NONE' | 'WARNING' | 'OVER_CAPACITY' {
  const ratio = getContainerCbmUsageRatio(size, totalCbm);
  if (ratio > 1) return 'OVER_CAPACITY';
  if (ratio >= CONTAINER_CBM_WARNING_RATIO) return 'WARNING';
  return 'NONE';
}

export type ContainerCbmProgressBand = 'NORMAL' | 'WARNING' | 'NEAR_FULL' | 'OVER_CAPACITY';

export function getContainerCbmProgressBand(
  size: ContainerSize | null | undefined,
  totalCbm: number
): ContainerCbmProgressBand {
  const percent = getContainerCbmUsageRatio(size, totalCbm) * 100;
  if (percent > 100) return 'OVER_CAPACITY';
  if (percent >= 95) return 'NEAR_FULL';
  if (percent >= 80) return 'WARNING';
  return 'NORMAL';
}
