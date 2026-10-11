import { BRAND_COLORS, BRAND_UI } from 'theme/brandTokens';
import { Chip } from '@mui/material';
import { SystemConfig } from 'services/Config/config-type';

export const getCustomerChipSx = (code?: string | null) => {
  const normalizedCode = code?.toUpperCase();
  const green = { bgcolor: BRAND_UI.greenTint, color: BRAND_COLORS.green, borderColor: BRAND_COLORS.green };
  const terracotta = { bgcolor: BRAND_UI.terracottaTint, color: BRAND_COLORS.terracotta, borderColor: BRAND_COLORS.terracotta };
  const neutral = { bgcolor: BRAND_UI.sandTint, color: BRAND_COLORS.charcoal, borderColor: BRAND_COLORS.sand };
  const chipStyleMap: Record<string, { bgcolor: string; color: string; borderColor: string }> = {
    COMPANY: green,
    INDIVIDUAL: neutral,
    VIP: { bgcolor: BRAND_COLORS.green, color: BRAND_COLORS.ivory, borderColor: BRAND_COLORS.green },
    TIER_2: { bgcolor: BRAND_COLORS.terracotta, color: BRAND_COLORS.ivory, borderColor: BRAND_COLORS.terracotta },
    TIER_3: green,
    TIER_4: { bgcolor: BRAND_COLORS.sand, color: BRAND_COLORS.charcoal, borderColor: BRAND_COLORS.sand },
    BRAND_OWNER: terracotta,
    DISTRIBUTOR: green,
    MANUFACTURING: neutral,
    OEM: green,
    RETAIL: neutral,
    TRADER: terracotta
  };
  const style = chipStyleMap[normalizedCode || ''];
  if (!style) {
    return {};
  }
  return {
    bgcolor: style.bgcolor,
    color: style.color,
    borderColor: style.borderColor,
    '& .MuiChip-label': {
      fontWeight: 700
    }
  };
};

interface CustomerTierChipProps {
  tier?: Pick<SystemConfig, 'code' | 'nameEn'> | null;
}

export default function CustomerTierChip({ tier }: CustomerTierChipProps): JSX.Element {
  return (
    <Chip
      size="small"
      variant="outlined"
      label={tier?.nameEn || '-'}
      sx={getCustomerChipSx(tier?.code)}
    />
  );
}
