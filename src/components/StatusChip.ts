/* eslint-disable prettier/prettier */
import { BRAND_COLORS, BRAND_UI, SEMANTIC_COLORS } from 'theme/brandTokens';
export const getStatusChipSx = (status: string) => {
    switch (status) {
        case 'CREATED':
            return {
                backgroundColor: BRAND_UI.greenTint,
                color: BRAND_COLORS.green,
                fontWeight: 'bold'
            };

        case 'DRAFT':
            return {
                backgroundColor: BRAND_UI.sandTint,
                color: BRAND_COLORS.charcoal,
                fontWeight: 'bold'
            };

        case 'COMPLETED':
            return {
                backgroundColor: BRAND_UI.greenTint,
                color: BRAND_COLORS.green,
                fontWeight: 'bold'
            };

        case 'CONFIRMED':
            return {
                backgroundColor: BRAND_UI.greenSelected,
                color: BRAND_COLORS.green,
                fontWeight: 'bold'
            };

        case 'PAID':
            return {
                backgroundColor: BRAND_COLORS.green,
                color: BRAND_COLORS.ivory,
                fontWeight: 'bold'
            };

        case 'CANCELLED':
            return {
                backgroundColor: SEMANTIC_COLORS.error,
                color: BRAND_COLORS.ivory,
                fontWeight: 'bold'
            };

        default:
            return {
                backgroundColor: BRAND_COLORS.sand,
                color: BRAND_COLORS.charcoal,
                fontWeight: 'bold'
            };
    }
};