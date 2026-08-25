import { Add, ArrowDropDown, AutoAwesome, ContentCopy, DeleteOutline, EmojiTransportation, Visibility } from '@mui/icons-material';
import {
  Box,
  Button,
  Checkbox,
  Collapse,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Grid,
  IconButton,
  InputAdornment,
  MenuItem,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography
} from '@mui/material';
import { ReactElement, useEffect, useState } from 'react';
import { SystemConfig } from 'services/Config/config-type';
import {
  RFQDetailOption,
  RFQDetailTierSplit,
  RFQSupplierQuote,
  RFQSupplierQuoteAdditionalCost
} from 'services/RFQ/rfq-type';
import { outlinedActionButtonSx } from './supplierQuoteDialogStyles';
import { GridTextField } from 'components/Styled';

const CONTAINER_SIZE_OPTIONS = ['20GP', '40HQ'] as const;

interface FinalPriceDraftTier {
  id: number;
  quantity: number;
  productPrice: string;
  commission: string;
  currency: string;
  containerSize: string;
  landFreightQty: string;
  seaFreightQty: string;
  landTotalPrice: string;
  seaTotalPrice: string;
  isFcl: boolean;
  isShareFCL: boolean;
}

interface FinalPriceDraftDetail {
  id: number;
  optionName: string;
  plan?: string | null;
  spec: string;
  tiers: FinalPriceDraftTier[];
}

interface FinalPriceDraftPackage {
  id: number;
  packageName?: string | null;
  packageDimension?: string | null;
  packageWeight?: string | null;
  packageCapacity?: string | null;
  sortOrder: number;
}

interface FinalPriceDraftErrors {
  details?: Record<
    number,
    {
      quantity?: string;
      productPrice?: string;
      commission?: string;
      containerSize?: string;
      landFreightQty?: string;
      seaFreightQty?: string;
      landTotalPrice?: string;
      seaTotalPrice?: string;
    }
  >;
}

interface FinalPriceQuoteDialogProps {
  open: boolean;
  finalPriceQuote: RFQSupplierQuote | null;
  rfqDetails: RFQDetailOption[];
  finalPriceDraft: {
    details: FinalPriceDraftDetail[];
    packages: FinalPriceDraftPackage[];
    additionalCosts: {
      id: number;
      description: string;
      value: string;
      unit: string;
    }[];
    remark: string;
    recommend: string;
  };
  finalPriceErrors: FinalPriceDraftErrors;
  isSubmitting: boolean;
  onClose: () => void;
  onRemarkChange: (value: string) => void;
  onRecommendChange: (value: string) => void;
  onCommissionChange: (detailId: number, tierId: number, value: string) => void;
  onDuplicateSpecialDetail: (detailId: number) => void;
  onAddSpecialTier: (detailId: number) => void;
  onTierChange: (
    detailId: number,
    tierId: number,
    field:
      | 'quantity'
      | 'productPrice'
      | 'containerSize'
      | 'landFreightQty'
      | 'seaFreightQty'
      | 'landTotalPrice'
      | 'seaTotalPrice'
      | 'currency',
    value: string
  ) => void;
  onTierCurrencyChange: (detailId: number, tierId: number, value: string) => void;
  onTierFclChange: (detailId: number, tierId: number, checked: boolean) => void;
  onTierShareFclChange: (detailId: number, tierId: number, checked: boolean) => void;
  onDetailChange: (detailId: number, field: 'optionName' | 'plan' | 'spec', value: string) => void;
  onDuplicateDetail: (detailId: number) => void;
  onDeleteDetail: (detailId: number) => void;
  onDeleteTier: (detailId: number, tierId: number) => void;
  onAddAdditionalCost: () => void;
  onAdditionalCostChange: (
    additionalCostId: number,
    field: 'description' | 'value' | 'unit',
    value: string
  ) => void;
  onDeleteAdditionalCost: (additionalCostId: number) => void;
  onRequestSave: () => void;
  onGenerateMessage: () => void;
  onTranslateMessage: () => void;
  formatPrice: (value?: number | null, currency?: string | null) => string;
  currencyOptions: SystemConfig[];
  formatSupplierQuoteAdditionalCost: (additionalCost: RFQSupplierQuoteAdditionalCost) => string;
  getSupplierDisplayName: (supplier?: RFQSupplierQuote['supplier'] | null) => string;
  t: (key: string) => string;
}

export function FinalPriceQuoteDialog(props: FinalPriceQuoteDialogProps): ReactElement {
  const {
    open,
    finalPriceQuote,
    rfqDetails,
    finalPriceDraft,
    finalPriceErrors,
    isSubmitting,
    onClose,
    onRemarkChange,
    onRecommendChange,
    onCommissionChange,
    onDuplicateSpecialDetail,
    onAddSpecialTier,
    onTierChange,
    onTierCurrencyChange,
    onTierFclChange,
    onTierShareFclChange,
    onDetailChange,
    onDuplicateDetail,
    onDeleteDetail,
    onDeleteTier,
    onAddAdditionalCost,
    onAdditionalCostChange,
    onDeleteAdditionalCost,
    onRequestSave,
    onGenerateMessage,
    onTranslateMessage,
    formatPrice,
    currencyOptions,
    formatSupplierQuoteAdditionalCost,
    getSupplierDisplayName,
    t
  } = props;
  const [isOldPriceSectionExpanded, setIsOldPriceSectionExpanded] = useState(true);

  const renderPackageSummary = (packageItem: FinalPriceDraftPackage): string => {
    const dimension = packageItem.packageDimension?.trim();
    const weight = packageItem.packageWeight?.trim();
    const capacity = packageItem.packageCapacity?.trim();
    const summaryParts = [
      packageItem.packageName,
      dimension ? `ขนาด ${dimension}` : null,
      weight ? `น้ำหนัก ${weight}` : null,
      capacity ? `บรรจุ ${capacity}` : null
    ].filter(Boolean);

    return summaryParts.join(' | ');
  };

  const getTierCurrency = (detailId: number, tierId: number): string | null => {
    const quoteDetail = finalPriceQuote?.details?.find((item) => item.id === detailId);
    const quoteTier = quoteDetail?.tiers?.find((item) => item.id === tierId);
    return quoteTier?.currency || quoteDetail?.tiers?.[0]?.currency || null;
  };

  const getTierShippingCost = (detailId: number, tierId: number): number | null => {
    const quoteDetail = finalPriceQuote?.details?.find((item) => item.id === detailId);
    const quoteTier = quoteDetail?.tiers?.find((item) => item.id === tierId);
    return quoteTier?.shippingCost ?? null;
  };

  const getTierSupplierProductPrice = (detailId: number, tierId: number): number | null => {
    const quoteDetail = finalPriceQuote?.details?.find((item) => item.id === detailId);
    const quoteTier = quoteDetail?.tiers?.find((item) => item.id === tierId);
    return quoteTier?.productPrice ?? null;
  };

  const formatOptionNameWithPlan = (optionName?: string | null, plan?: string | null): string => {
    const trimmedOptionName = optionName?.trim();
    const trimmedPlan = plan?.trim();

    if (!trimmedOptionName) {
      return trimmedPlan || '-';
    }

    return trimmedPlan ? `${trimmedOptionName} (${trimmedPlan})` : trimmedOptionName;
  };

  const getTierQuantity = (detailId: number, tierId: number): number => {
    const quoteDetail = finalPriceQuote?.details?.find((item) => item.id === detailId);
    const quoteTier = quoteDetail?.tiers?.find((item) => item.id === tierId);
    return quoteTier?.quantity || 0;
  };

  const isSpecialOption = (optionName?: string | null): boolean =>
    optionName?.trim().endsWith(' พิเศษ') ?? false;

  const toNumberValue = (value?: string | null): number => {
    const normalizedValue = Number(String(value ?? '').replace(/,/g, '').trim());
    return Number.isFinite(normalizedValue) ? normalizedValue : 0;
  };

  const toSpecialTierSplit = (tier: FinalPriceDraftTier): RFQDetailTierSplit => ({
    id: tier.id,
    quantity: toNumberValue(tier.quantity?.toString()),
    sellPrice: toNumberValue(tier.productPrice),
    commission: toNumberValue(tier.commission),
    currency: tier.currency || 'THB',
    containerSize: tier.containerSize || null,
    landFreightQty: toNumberValue(tier.landFreightQty),
    landFreightCost: toNumberValue(tier.landTotalPrice),
    seaFreightQty: toNumberValue(tier.seaFreightQty),
    seaFreightCost: toNumberValue(tier.seaTotalPrice),
    isFcl: Boolean(tier.isFcl),
    isShareFCL: Boolean(tier.isShareFCL)
  });

  const shouldShowOldPriceSection =
    rfqDetails.length > 0 && rfqDetails.some((detail) => (detail.tiers || []).length > 0);

  useEffect(() => {
    if (shouldShowOldPriceSection) {
      setIsOldPriceSectionExpanded(true);
    }
  }, [shouldShowOldPriceSection]);

  const renderOldPriceDetailCard = (detail: RFQDetailOption): ReactElement => (
    <Box
      key={detail.id}
      sx={{
        border: '1px solid #dce4ee',
        borderRadius: 2,
        p: 2,
        backgroundColor: '#f8fafc'
      }}>
      <Stack spacing={1.25}>
        <Stack spacing={0.25}>
          <Typography variant="subtitle2" fontWeight={700}>
            {formatOptionNameWithPlan(detail.optionName, detail.plan)}
          </Typography>
          {detail.spec ? (
            <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-wrap' }}>
              {detail.spec}
            </Typography>
          ) : null}
        </Stack>

        <Box sx={{ width: '100%', maxWidth: '100%', overflowX: 'auto' }}>
          <Table
            size="small"
            sx={{
              width: '100%',
              tableLayout: 'fixed',
              '& .MuiTableCell-root': {
                px: 1,
                py: 0.75
              }
            }}>
            <TableHead>
              <TableRow>
                <TableCell align="center" sx={{ width: 90, whiteSpace: 'nowrap', fontSize: 12 }}>
                  MOQ
                </TableCell>
                <TableCell align="center" sx={{ width: 110, whiteSpace: 'nowrap', fontSize: 12 }}>
                  ราคาสินค้า
                </TableCell>
                <TableCell align="center" sx={{ width: 90, whiteSpace: 'nowrap', fontSize: 12 }}>
                  สกุลเงิน
                </TableCell>
                <TableCell align="center" sx={{ width: 110, whiteSpace: 'nowrap', fontSize: 12 }}>
                  รวมส่งทางรถ
                </TableCell>
                <TableCell align="center" sx={{ width: 110, whiteSpace: 'nowrap', fontSize: 12 }}>
                  รวมส่งทางเรือ
                </TableCell>
                <TableCell align="center" sx={{ width: 78, whiteSpace: 'nowrap', fontSize: 12 }}>
                  ปิดตู้
                </TableCell>
                <TableCell align="center" sx={{ width: 92, whiteSpace: 'nowrap', fontSize: 12 }}>
                  ปิดตู้ (share)
                </TableCell>
                <TableCell align="center" sx={{ width: 104, whiteSpace: 'nowrap', fontSize: 12 }}>
                  ขนาดตู้
                </TableCell>
                <TableCell align="center" sx={{ width: 86, whiteSpace: 'nowrap', fontSize: 12 }}>
                  ค่าคอม
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {(detail.tiers || [])
                .slice()
                .sort((left, right) => left.sortOrder - right.sortOrder)
                .map((tier) => (
                  <TableRow key={tier.id}>
                    <TableCell align="center" sx={{ width: 90 }}>
                      {tier.quantity || '-'}
                    </TableCell>
                    <TableCell align="center" sx={{ width: 110 }}>
                      {formatPrice(tier.productPrice, tier.currency)}
                    </TableCell>
                    <TableCell align="center" sx={{ width: 90 }}>
                      {tier.currency || '-'}
                    </TableCell>
                    <TableCell align="center" sx={{ width: 110 }}>
                      {formatPrice(tier.landTotalPrice, tier.currency)}
                    </TableCell>
                    <TableCell align="center" sx={{ width: 110 }}>
                      {formatPrice(tier.seaTotalPrice, tier.currency)}
                    </TableCell>
                    <TableCell align="center" sx={{ width: 78 }}>
                      {tier.isFcl ? 'ใช่' : '-'}
                    </TableCell>
                    <TableCell align="center" sx={{ width: 92 }}>
                      {tier.isFcl && tier.isShareFCL ? 'ใช่' : '-'}
                    </TableCell>
                    <TableCell align="center" sx={{ width: 104 }}>
                      {tier.containerSize || '-'}
                    </TableCell>
                    <TableCell align="center" sx={{ width: 86 }}>
                      {tier.commission ?? '-'}{tier.commission !== null && tier.commission !== undefined ? '%' : ''}
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </Box>
      </Stack>
    </Box>
  );

  const renderSpecialDetailCard = (detail: FinalPriceDraftDetail): ReactElement => (
    <Box
      key={detail.id}
      sx={{
        border: '1px solid #dce4ee',
        borderRadius: 2,
        p: 2,
        backgroundColor: '#fff'
      }}>
      <Stack spacing={1.5}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={2}>
          <Stack spacing={1} sx={{ flex: 1, minWidth: 0 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  size="small"
                  label="Option Name"
                  value={detail.optionName}
                  onChange={(event) => onDetailChange(detail.id, 'optionName', event.target.value)}
                  disabled={isSubmitting}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  size="small"
                  label="Plan"
                  value={detail.plan || ''}
                  onChange={(event) => onDetailChange(detail.id, 'plan', event.target.value)}
                  disabled={isSubmitting}
                  fullWidth
                />
              </Grid>
            </Grid>
            <TextField
              size="small"
              label="Spec"
              value={detail.spec}
              onChange={(event) => onDetailChange(detail.id, 'spec', event.target.value)}
              disabled={isSubmitting}
              fullWidth
              multiline
              minRows={2}
            />
          </Stack>
          <Stack direction="row" spacing={1} alignItems="flex-start">
            <Button
              size="small"
              variant="outlined"
              startIcon={<ContentCopy fontSize="small" />}
              onClick={() =>
                console.log('[FinalPriceDialog][OptionSpecial]', {
                  detailId: detail.id,
                  optionName: detail.optionName,
                  tierSplit: detail.tiers.map((tier) => toSpecialTierSplit(tier))
                })
              }
              sx={outlinedActionButtonSx}
              disabled={isSubmitting}>
              build
            </Button>
            <Button
              size="small"
              variant="outlined"
              startIcon={<Add fontSize="small" />}
              onClick={() => onAddSpecialTier(detail.id)}
              sx={outlinedActionButtonSx}
              disabled={isSubmitting}>
              เพิ่ม tier
            </Button>
            <Button
              size="small"
              variant="outlined"
              color="error"
              startIcon={<DeleteOutline fontSize="small" />}
              onClick={() => onDeleteDetail(detail.id)}
              sx={outlinedActionButtonSx}
              disabled={isSubmitting || finalPriceDraft.details.length <= 1}>
              ลบ option
            </Button>
          </Stack>
        </Stack>

        <Box sx={{ width: '100%', maxWidth: '100%', overflowX: 'auto' }}>
          <Table
            size="small"
            sx={{
              width: '100%',
              tableLayout: 'fixed',
              '& .MuiTableCell-root': {
                px: 1,
                py: 0.75
              }
            }}>
            <TableHead>
              <TableRow>
                <TableCell align="center" sx={{ width: 90, whiteSpace: 'nowrap', fontSize: 12 }}>
                  MOQ
                </TableCell>
                <TableCell align="center" sx={{ width: 100, whiteSpace: 'nowrap', fontSize: 12 }}>
                  ราคาขาย
                </TableCell>
                <TableCell align="center" sx={{ width: 90, whiteSpace: 'nowrap', fontSize: 12 }}>
                  สกุลเงิน
                </TableCell>
                <TableCell align="center" sx={{ width: 100, whiteSpace: 'nowrap', fontSize: 12 }}>
                  แบ่งส่งทางรถ
                </TableCell>
                <TableCell align="center" sx={{ width: 100, whiteSpace: 'nowrap', fontSize: 12 }}>
                  ค่าส่งทางรถ
                </TableCell>
                <TableCell align="center" sx={{ width: 100, whiteSpace: 'nowrap', fontSize: 12 }}>
                  แบ่งส่งทางเรือ
                </TableCell>
                <TableCell align="center" sx={{ width: 100, whiteSpace: 'nowrap', fontSize: 12 }}>
                  ค่าส่งทางเรือ
                </TableCell>
                <TableCell align="center" sx={{ width: 78, whiteSpace: 'nowrap', fontSize: 12 }}>
                  ปิดตู้
                </TableCell>
                <TableCell align="center" sx={{ width: 92, whiteSpace: 'nowrap', fontSize: 12 }}>
                  ปิดตู้ (share)
                </TableCell>
                <TableCell align="center" sx={{ width: 104, whiteSpace: 'nowrap', fontSize: 12 }}>
                  ขนาดตู้
                </TableCell>
                <TableCell align="center" sx={{ width: 86, whiteSpace: 'nowrap', fontSize: 12 }}>
                  ค่าคอม
                </TableCell>
                <TableCell align="center" sx={{ width: 64, whiteSpace: 'nowrap', fontSize: 12 }}>
                  จัดการ
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {detail.tiers.map((tier) => {
                const tierSplit = toSpecialTierSplit(tier);
                const tierError = finalPriceErrors.details?.[tier.id] || {};

                return (
                  <TableRow key={tier.id}>
                    <TableCell align="center" sx={{ width: 90 }}>
                      <TextField
                        size="small"
                        type="number"
                        value={tierSplit.quantity}
                        onChange={(event) =>
                          onTierChange(detail.id, tier.id, 'quantity', event.target.value)
                        }
                        error={Boolean(tierError.quantity)}
                        helperText={tierError.quantity}
                        inputProps={{ min: 0, step: '1' }}
                        sx={{
                          width: '10ch',
                          '& .MuiInputBase-input': {
                            fontSize: '12px'
                          },
                          '& input[type=number]::-webkit-outer-spin-button, & input[type=number]::-webkit-inner-spin-button':
                          {
                            WebkitAppearance: 'none',
                            margin: 0
                          },
                          '& input[type=number]': {
                            MozAppearance: 'textfield'
                          }
                        }}
                      />
                    </TableCell>
                    <TableCell align="center" sx={{ width: 100 }}>
                      <TextField
                        size="small"
                        type="number"
                        value={tierSplit.sellPrice}
                        onChange={(event) =>
                          onTierChange(detail.id, tier.id, 'productPrice', event.target.value)
                        }
                        error={Boolean(tierError.productPrice)}
                        helperText={tierError.productPrice}
                        inputProps={{ min: 0, step: '0.01' }}
                        sx={{
                          width: '10ch',
                          '& input[type=number]::-webkit-outer-spin-button, & input[type=number]::-webkit-inner-spin-button':
                          {
                            WebkitAppearance: 'none',
                            margin: 0
                          },
                          '& input[type=number]': {
                            MozAppearance: 'textfield'
                          }
                        }}
                      />
                    </TableCell>
                    <TableCell align="center" sx={{ width: 90 }}>
                      <TextField
                        size="small"
                        select
                        value={tierSplit.currency || 'THB'}
                        onChange={(event) =>
                          onTierCurrencyChange(detail.id, tier.id, event.target.value)
                        }
                        fullWidth
                        sx={{
                          '& .MuiSelect-select': {
                            fontSize: '12px'
                          }
                        }}
                      >
                        {currencyOptions.map((currencyOption) => (
                          <MenuItem key={currencyOption.code} value={currencyOption.code}>
                            {currencyOption.code}
                          </MenuItem>
                        ))}
                      </TextField>
                    </TableCell>
                    <TableCell align="center" sx={{ width: 100 }}>
                      <TextField
                        size="small"
                        type="number"
                        value={tier.landFreightQty}
                        onChange={(event) =>
                          onTierChange(detail.id, tier.id, 'landFreightQty', event.target.value)
                        }
                        error={Boolean(tierError.landFreightQty)}
                        helperText={tierError.landFreightQty}
                        inputProps={{ min: 0, step: '1' }}
                        sx={{
                          width: '10ch',
                          '& input[type=number]::-webkit-outer-spin-button, & input[type=number]::-webkit-inner-spin-button':
                          {
                            WebkitAppearance: 'none',
                            margin: 0
                          },
                          '& input[type=number]': {
                            MozAppearance: 'textfield'
                          }
                        }}
                      />
                    </TableCell>
                    <TableCell align="center" sx={{ width: 100 }}>
                      <TextField
                        size="small"
                        type="number"
                        value={tierSplit.landFreightCost}
                        onChange={(event) =>
                          onTierChange(detail.id, tier.id, 'landTotalPrice', event.target.value)
                        }
                        error={Boolean(tierError.landTotalPrice)}
                        helperText={tierError.landTotalPrice}
                        inputProps={{ min: 0, step: '0.01' }}
                        sx={{
                          width: '10ch',
                          '& input[type=number]::-webkit-outer-spin-button, & input[type=number]::-webkit-inner-spin-button':
                          {
                            WebkitAppearance: 'none',
                            margin: 0
                          },
                          '& input[type=number]': {
                            MozAppearance: 'textfield'
                          }
                        }}
                      />
                    </TableCell>
                    <TableCell align="center" sx={{ width: 100 }}>
                      <TextField
                        size="small"
                        type="number"
                        value={tier.seaFreightQty}
                        onChange={(event) =>
                          onTierChange(detail.id, tier.id, 'seaFreightQty', event.target.value)
                        }
                        error={Boolean(tierError.seaFreightQty)}
                        helperText={tierError.seaFreightQty}
                        inputProps={{ min: 0, step: '1' }}
                        sx={{
                          width: '10ch',
                          '& input[type=number]::-webkit-outer-spin-button, & input[type=number]::-webkit-inner-spin-button':
                          {
                            WebkitAppearance: 'none',
                            margin: 0
                          },
                          '& input[type=number]': {
                            MozAppearance: 'textfield'
                          }
                        }}
                      />
                    </TableCell>
                    <TableCell align="center" sx={{ width: 100 }}>
                      <TextField
                        size="small"
                        type="number"
                        value={tierSplit.seaFreightCost}
                        onChange={(event) =>
                          onTierChange(detail.id, tier.id, 'seaTotalPrice', event.target.value)
                        }
                        error={Boolean(tierError.seaTotalPrice)}
                        helperText={tierError.seaTotalPrice}
                        inputProps={{ min: 0, step: '0.01' }}
                        sx={{
                          width: '10ch',
                          '& input[type=number]::-webkit-outer-spin-button, & input[type=number]::-webkit-inner-spin-button':
                          {
                            WebkitAppearance: 'none',
                            margin: 0
                          },
                          '& input[type=number]': {
                            MozAppearance: 'textfield'
                          }
                        }}
                      />
                    </TableCell>
                    <TableCell align="center" sx={{ width: 78 }}>
                      <FormControlLabel
                        sx={{ m: 0, justifyContent: 'center' }}
                        control={
                          <Checkbox
                            checked={Boolean(tierSplit.isFcl)}
                            onChange={(event) =>
                              onTierFclChange(detail.id, tier.id, event.target.checked)
                            }
                          />
                        }
                        label=""
                      />
                    </TableCell>
                    <TableCell align="center" sx={{ width: 92 }}>
                      {tierSplit.isFcl ? (
                        <FormControlLabel
                          sx={{ m: 0, justifyContent: 'center' }}
                          control={
                            <Checkbox
                              checked={Boolean(tierSplit.isShareFCL)}
                              onChange={(event) =>
                                onTierShareFclChange(
                                  detail.id,
                                  tier.id,
                                  event.target.checked
                                )
                              }
                            />
                          }
                          label=""
                        />
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell align="center" sx={{ width: 104 }}>
                      {tierSplit.isFcl || tierSplit.isShareFCL ? (
                        <TextField
                          size="small"
                          select
                          value={tierSplit.containerSize || ''}
                          onChange={(event) =>
                            onTierChange(detail.id, tier.id, 'containerSize', event.target.value)
                          }
                          error={Boolean(tierError.containerSize)}
                          helperText={tierError.containerSize}
                          fullWidth
                        >
                          <MenuItem value="">
                            <em>เลือกขนาดตู้</em>
                          </MenuItem>
                          {CONTAINER_SIZE_OPTIONS.map((option) => (
                            <MenuItem key={option} value={option}>
                              {option}
                            </MenuItem>
                          ))}
                        </TextField>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell align="center" sx={{ width: 86 }}>
                      <TextField
                        size="small"
                        type="number"
                        value={tierSplit.commission ?? 100}
                        onChange={(event) =>
                          onCommissionChange(detail.id, tier.id, event.target.value)
                        }
                        error={Boolean(tierError.commission)}
                        helperText={tierError.commission}
                        InputProps={{
                          endAdornment: <InputAdornment position="end">%</InputAdornment>
                        }}
                        inputProps={{ min: 0, step: '1', max: 100 }}
                        sx={{
                          width: '10ch',
                          '& .MuiInputBase-input': {
                            fontSize: '12px'
                          },
                          '& input[type=number]::-webkit-outer-spin-button, & input[type=number]::-webkit-inner-spin-button':
                          {
                            WebkitAppearance: 'none',
                            margin: 0
                          },
                          '& input[type=number]': {
                            MozAppearance: 'textfield'
                          }
                        }}
                      />
                    </TableCell>
                    <TableCell align="center" sx={{ width: 64 }}>
                      <Tooltip title="ลบ MOQ">
                        <span>
                          <IconButton
                            color="error"
                            onClick={() => onDeleteTier(detail.id, tier.id)}
                            disabled={detail.tiers.length <= 1}>
                            <DeleteOutline />
                          </IconButton>
                        </span>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Box>
      </Stack>
    </Box>
  );

  const renderDetailCard = (detail: FinalPriceDraftDetail): ReactElement => (
    <Box
      key={detail.id}
      sx={{
        border: '1px solid #dce4ee',
        borderRadius: 2,
        p: 2,
        backgroundColor: '#fff'
      }}>
      <Stack spacing={1.5}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
          {/* <Stack spacing={1} sx={{ flex: 1, minWidth: 0 }}> */}
          <Grid container spacing={1}>
            <GridTextField item xs={12} md={6}>
              <TextField
                size="small"
                label="Option Name"
                value={detail.optionName}
                onChange={(event) => onDetailChange(detail.id, 'optionName', event.target.value)}
                disabled={isSubmitting}
                fullWidth
              />
            </GridTextField>
            <GridTextField item xs={12} md={6}>
              <TextField
                size="small"
                label="Plan"
                InputLabelProps={{ shrink: true }}
                value={detail.plan || ''}
                onChange={(event) => onDetailChange(detail.id, 'plan', event.target.value)}
                disabled={isSubmitting}
                fullWidth
              />
            </GridTextField>
            <GridTextField item md={12}>
              <TextField
                size="small"
                label="Spec"
                value={detail.spec}
                onChange={(event) => onDetailChange(detail.id, 'spec', event.target.value)}
                disabled={isSubmitting}
                fullWidth
                multiline
                minRows={2}
              />
            </GridTextField>
          </Grid>
          {/* </Stack> */}
          <Stack direction="row" spacing={1} alignItems="flex-start">
            <Button
              size="small"
              variant="outlined"
              startIcon={<ContentCopy fontSize="small" />}
              onClick={() => onDuplicateDetail(detail.id)}
              sx={outlinedActionButtonSx}
              disabled={isSubmitting}>
              คัดลอก option
            </Button>
            <Button
              size="small"
              variant="outlined"
              color="error"
              startIcon={<DeleteOutline fontSize="small" />}
              onClick={() => onDeleteDetail(detail.id)}
              sx={outlinedActionButtonSx}
              disabled={isSubmitting || finalPriceDraft.details.length <= 1}>
              ลบ option
            </Button>
          </Stack>
        </Stack>

        <Box sx={{ width: '100%', maxWidth: '100%', overflowX: 'auto' }}>
          <Table
            size="small"
            sx={{
              width: '100%',
              tableLayout: 'fixed',
              '& .MuiTableCell-root': {
                px: 1,
                py: 0.75
              }
            }}>
            <TableHead>
              <TableRow>
                <TableCell
                  align="center"
                  sx={{ width: 90, whiteSpace: 'nowrap', fontSize: 12 }}>
                  MOQ
                </TableCell>
                <TableCell align="center" sx={{ width: 110, whiteSpace: 'nowrap', fontSize: 12 }}>
                  ราคาจาก supplier
                </TableCell>
                <TableCell align="center" sx={{ width: 110, whiteSpace: 'nowrap', fontSize: 12 }}>
                  ค่าขนส่งภายในจีน
                </TableCell>
                <TableCell align="center" sx={{ width: 100, whiteSpace: 'nowrap', fontSize: 12 }}>
                  ราคาสินค้า
                </TableCell>
                <TableCell align="center" sx={{ width: 90, whiteSpace: 'nowrap', fontSize: 12 }}>
                  สกุลเงิน
                </TableCell>
                <TableCell align="center" sx={{ width: 100, whiteSpace: 'nowrap', fontSize: 12 }}>
                  รวมส่งทางรถ
                </TableCell>
                <TableCell align="center" sx={{ width: 100, whiteSpace: 'nowrap', fontSize: 12 }}>
                  รวมส่งทางเรือ
                </TableCell>
                <TableCell align="center" sx={{ width: 78, whiteSpace: 'nowrap', fontSize: 12 }}>
                  ปิดตู้
                </TableCell>
                <TableCell align="center" sx={{ width: 92, whiteSpace: 'nowrap', fontSize: 12 }}>
                  ปิดตู้ (share)
                </TableCell>
                <TableCell align="center" sx={{ width: 104, whiteSpace: 'nowrap', fontSize: 12 }}>
                  ขนาดตู้
                </TableCell>
                <TableCell align="center" sx={{ width: 86, whiteSpace: 'nowrap', fontSize: 12 }}>
                  ค่าคอม
                </TableCell>
                <TableCell align="center" sx={{ width: 64, whiteSpace: 'nowrap', fontSize: 12 }}>
                  จัดการ
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {detail.tiers.map((tier) => {
                const tierError = finalPriceErrors.details?.[tier.id] || {};
                const tierCurrency = getTierCurrency(detail.id, tier.id);
                const tierSupplierProductPrice = getTierSupplierProductPrice(detail.id, tier.id);
                const tierShippingCost = getTierShippingCost(detail.id, tier.id);

                return (
                  <TableRow key={tier.id}>
                    <TableCell align="center" sx={{ width: 90 }}>
                      <TextField
                        size="small"
                        type="number"
                        value={tier.quantity}
                        onChange={(event) =>
                          onTierChange(detail.id, tier.id, 'quantity', event.target.value)
                        }
                        error={Boolean(tierError.quantity)}
                        helperText={tierError.quantity}
                        inputProps={{ min: 0, step: '1' }}
                        sx={{
                          width: '10ch',
                          '& .MuiInputBase-input': {
                            fontSize: '12px'
                          },
                          '& input[type=number]::-webkit-outer-spin-button, & input[type=number]::-webkit-inner-spin-button':
                          {
                            WebkitAppearance: 'none',
                            margin: 0
                          },
                          '& input[type=number]': {
                            MozAppearance: 'textfield'
                          }
                        }}
                      />
                    </TableCell>
                    <TableCell align="center" sx={{ width: 110 }}>
                      {formatPrice(tierSupplierProductPrice, tierCurrency)}
                    </TableCell>
                    <TableCell align="center" sx={{ width: 110 }}>
                      {formatPrice(tierShippingCost, tierCurrency)}
                    </TableCell>
                    <TableCell align="center" sx={{ width: 100 }}>
                      <TextField
                        size="small"
                        type="number"
                        value={tier.productPrice}
                        onChange={(event) =>
                          onTierChange(detail.id, tier.id, 'productPrice', event.target.value)
                        }
                        error={Boolean(tierError.productPrice)}
                        helperText={tierError.productPrice}
                        inputProps={{ min: 0, step: '0.01' }}
                        sx={{
                          width: '10ch',
                          '& input[type=number]::-webkit-outer-spin-button, & input[type=number]::-webkit-inner-spin-button':
                          {
                            WebkitAppearance: 'none',
                            margin: 0
                          },
                          '& input[type=number]': {
                            MozAppearance: 'textfield'
                          }
                        }}
                      />
                    </TableCell>
                    <TableCell align="center" sx={{ width: 90 }}>
                      <TextField
                        size="small"
                        select
                        value={tier.currency || 'THB'}
                        onChange={(event) =>
                          onTierCurrencyChange(detail.id, tier.id, event.target.value)
                        }
                        fullWidth
                        sx={{
                          '& .MuiSelect-select': {
                            fontSize: '12px'
                          }
                        }}>
                        {currencyOptions.map((currencyOption) => (
                          <MenuItem key={currencyOption.code} value={currencyOption.code}>
                            {currencyOption.code}
                          </MenuItem>
                        ))}
                      </TextField>
                    </TableCell>
                    <TableCell align="center" sx={{ width: 100 }}>
                      <TextField
                        size="small"
                        type="number"
                        value={tier.landTotalPrice}
                        onChange={(event) =>
                          onTierChange(detail.id, tier.id, 'landTotalPrice', event.target.value)
                        }
                        error={Boolean(tierError.landTotalPrice)}
                        helperText={tierError.landTotalPrice}
                        inputProps={{ min: 0, step: '0.01' }}
                        sx={{
                          width: '10ch',
                          '& input[type=number]::-webkit-outer-spin-button, & input[type=number]::-webkit-inner-spin-button':
                          {
                            WebkitAppearance: 'none',
                            margin: 0
                          },
                          '& input[type=number]': {
                            MozAppearance: 'textfield'
                          }
                        }}
                      />
                    </TableCell>
                    <TableCell align="center" sx={{ width: 100 }}>
                      <TextField
                        size="small"
                        type="number"
                        value={tier.seaTotalPrice}
                        onChange={(event) =>
                          onTierChange(detail.id, tier.id, 'seaTotalPrice', event.target.value)
                        }
                        error={Boolean(tierError.seaTotalPrice)}
                        helperText={tierError.seaTotalPrice}
                        inputProps={{ min: 0, step: '0.01' }}
                        sx={{
                          width: '10ch',
                          '& input[type=number]::-webkit-outer-spin-button, & input[type=number]::-webkit-inner-spin-button':
                          {
                            WebkitAppearance: 'none',
                            margin: 0
                          },
                          '& input[type=number]': {
                            MozAppearance: 'textfield'
                          }
                        }}
                      />
                    </TableCell>
                    <TableCell align="center" sx={{ width: 78 }}>
                      <FormControlLabel
                        sx={{ m: 0, justifyContent: 'center' }}
                        control={
                          <Checkbox
                            checked={Boolean(tier.isFcl)}
                            onChange={(event) =>
                              onTierFclChange(detail.id, tier.id, event.target.checked)
                            }
                          />
                        }
                        label=""
                      />
                    </TableCell>
                    <TableCell align="center" sx={{ width: 92 }}>
                      {tier.isFcl ? (
                        <FormControlLabel
                          sx={{ m: 0, justifyContent: 'center' }}
                          control={
                            <Checkbox
                              checked={Boolean(tier.isShareFCL)}
                              onChange={(event) =>
                                onTierShareFclChange(
                                  detail.id,
                                  tier.id,
                                  event.target.checked
                                )
                              }
                            />
                          }
                          label=""
                        />
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell align="center" sx={{ width: 104 }}>
                      {tier.isFcl || tier.isShareFCL ? (
                        <TextField
                          size="small"
                          select
                          value={tier.containerSize || ''}
                          onChange={(event) =>
                            onTierChange(detail.id, tier.id, 'containerSize', event.target.value)
                          }
                          error={Boolean(tierError.containerSize)}
                          helperText={tierError.containerSize}
                          fullWidth
                          sx={{
                            '& .MuiSelect-select': {
                              fontSize: '12px'
                            }
                          }}
                        >
                          <MenuItem value="">
                            <em>เลือกขนาดตู้</em>
                          </MenuItem>
                          {CONTAINER_SIZE_OPTIONS.map((option) => (
                            <MenuItem key={option} value={option}>
                              {option}
                            </MenuItem>
                          ))}
                        </TextField>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell align="center" sx={{ width: 86 }}>
                      {/*
                      Keep the displayed default at 100% when the draft has no value yet.
                      */}
                      <TextField
                        size="small"
                        type="number"
                        value={tier.commission}
                        onChange={(event) =>
                          onCommissionChange(detail.id, tier.id, event.target.value)
                        }
                        error={Boolean(tierError.commission)}
                        helperText={tierError.commission}
                        InputProps={{
                          endAdornment: <InputAdornment position="end">%</InputAdornment>
                        }}
                        inputProps={{ min: 0, step: '1', max: 100 }}
                        sx={{
                          width: '10ch',
                          '& .MuiInputBase-input': {
                            fontSize: '12px'
                          },
                          '& input[type=number]::-webkit-outer-spin-button, & input[type=number]::-webkit-inner-spin-button':
                          {
                            WebkitAppearance: 'none',
                            margin: 0,
                            fontSize: '12px'
                          },
                          '& input[type=number]': {
                            MozAppearance: 'textfield'
                          },
                        }}
                      />
                    </TableCell>
                    <TableCell align="center" sx={{ width: 64 }}>
                      <Tooltip title="ลบ MOQ">
                        <span>
                          <IconButton
                            color="error"
                            onClick={() => onDeleteTier(detail.id, tier.id)}
                            disabled={detail.tiers.length <= 1}>
                            <DeleteOutline />
                          </IconButton>
                        </span>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Box>
      </Stack>
    </Box >
  );

  return (
    <Dialog open={open} onClose={isSubmitting ? undefined : onClose} maxWidth="lg" fullWidth>
      <DialogTitle>Final ราคา RFQ</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={3}>
          <Box>
            <Typography variant="subtitle1" fontWeight={700}>
              {getSupplierDisplayName(finalPriceQuote?.supplier)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {finalPriceQuote?.supplier?.supplierCode || finalPriceQuote?.supplier?.id || '-'}
            </Typography>
          </Box>


          {shouldShowOldPriceSection ? (
            <Box
              sx={{
                border: '1px solid #cbd5e1',
                borderRadius: 2,
                backgroundColor: '#fff7ed',
                overflow: 'hidden'
              }}>
              <Button
                fullWidth
                variant="text"
                onClick={() => setIsOldPriceSectionExpanded((previous) => !previous)}
                sx={{
                  justifyContent: 'space-between',
                  px: 2,
                  py: 1.25,
                  color: 'text.primary',
                  borderRadius: 0
                }}
                endIcon={
                  <ArrowDropDown
                    sx={{
                      transform: isOldPriceSectionExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                      opacity: 0.85
                    }}
                  />
                }>
                <Typography variant="subtitle1" fontWeight={700}>
                  ราคาที่เคยให้
                </Typography>
              </Button>
              <Collapse in={isOldPriceSectionExpanded} timeout="auto" unmountOnExit>
                <Stack spacing={1.5} sx={{ px: 2, pb: 2 }}>
                  {rfqDetails
                    .filter((detail) => (detail.tiers || []).length > 0)
                    .map((detail) => renderOldPriceDetailCard(detail))}
                </Stack>
              </Collapse>
            </Box>
          ) : null}

          <Stack spacing={2}>
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={1}
              justifyContent="space-between"
              alignItems={{ xs: 'stretch', sm: 'center' }}
              useFlexGap>
              <Typography variant="subtitle1" fontWeight={700}>
                รายการ Final ราคา
              </Typography>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} useFlexGap>
                <Button
                  variant="outlined"
                  startIcon={<EmojiTransportation />}
                  disabled={isSubmitting || !finalPriceDraft.details.length}
                  className={'btn-indigo-blue'}
                  onClick={() => onDuplicateSpecialDetail(finalPriceDraft.details[0].id)}>
                  Option พิเศษ
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<AutoAwesome />}
                  disabled={isSubmitting}
                  className={'btn-indigo-blue'}
                  onClick={onGenerateMessage}>
                  {t('priceInquiryManagement.generateFinalInquiry.button')}
                </Button>
                <Button
                  variant="outlined"
                  className={'btn-indigo-blue'}
                  disabled={isSubmitting}
                  onClick={onTranslateMessage}>
                  {t('priceInquiryManagement.generateFinalInquiry.translateButton')}
                </Button>
              </Stack>
            </Stack>
            {finalPriceDraft.details.some((detail) => !isSpecialOption(detail.optionName)) ? (
              <Stack spacing={1.5}>
                <Typography variant="subtitle1" fontWeight={700}>
                  Option ปกติ
                </Typography>
                <Stack spacing={2}>
                  {finalPriceDraft.details
                    .filter((detail) => !isSpecialOption(detail.optionName))
                    .map((detail) => renderDetailCard(detail))}
                </Stack>
              </Stack>
            ) : null}

            {finalPriceDraft.details.some((detail) => isSpecialOption(detail.optionName)) ? (
              <Stack spacing={1.5}>
                <Typography variant="subtitle1" fontWeight={700}>
                  Option พิเศษ
                </Typography>
                <Stack spacing={2}>
                  {finalPriceDraft.details
                    .filter((detail) => isSpecialOption(detail.optionName))
                    .map((detail) => renderSpecialDetailCard(detail))}
                </Stack>
              </Stack>
            ) : null}

            {!finalPriceDraft.details.length ? (
              <Typography variant="body2" color="text.secondary">
                ยังไม่มีรายละเอียดราคาจาก supplier quote
              </Typography>
            ) : null}

            {finalPriceDraft.packages.length ? (
              <Box
                sx={{
                  border: '1px solid #dce4ee',
                  borderRadius: 2,
                  px: 1.5,
                  py: 1,
                  backgroundColor: '#f8fafc'
                }}>
                <Stack spacing={0.75}>
                  <Typography variant="subtitle1" fontWeight={700}>
                    Packing List
                  </Typography>
                  {finalPriceDraft.packages
                    .slice()
                    .sort((left, right) => left.sortOrder - right.sortOrder)
                    .map((packageItem, packageIndex) => (
                      <Typography key={packageItem.id || packageIndex} variant="body2">
                        {renderPackageSummary(packageItem)}
                      </Typography>
                    ))}
                </Stack>
              </Box>
            ) : null}

            <Stack spacing={1}>
              <Typography variant="subtitle1" fontWeight={700}>
                รายละเอียดเพิ่มเติม จาก Supplier Quote
              </Typography>
              {finalPriceQuote?.additionalCosts?.length ? (
                <Box
                  sx={{
                    border: '1px solid #dce4ee',
                    borderRadius: 2,
                    p: 2,
                    backgroundColor: '#fff'
                  }}>
                  <Stack spacing={0.75}>
                    {finalPriceQuote.additionalCosts.map((additionalCost, index) => (
                      <Typography
                        key={additionalCost.id || `${additionalCost.description}-${index}`}
                        variant="body2">
                        {formatSupplierQuoteAdditionalCost(additionalCost) || '-'}
                      </Typography>
                    ))}
                  </Stack>
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  ไม่มีรายละเอียดเพิ่มเติม
                </Typography>
              )}
            </Stack>

            <Stack spacing={2}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="subtitle1" fontWeight={700}>
                  รายละเอียดเพิ่มเติม
                </Typography>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<Add />}
                  sx={outlinedActionButtonSx}
                  onClick={onAddAdditionalCost}>
                  เพิ่มรายละเอียด
                </Button>
              </Stack>
              {finalPriceDraft.additionalCosts.length ? (
                finalPriceDraft.additionalCosts.map((additionalCost) => (
                  <Grid container spacing={1} key={additionalCost.id} alignItems="center">
                    <Grid item xs={12} md={5}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Name"
                        value={additionalCost.description}
                        onChange={(event) =>
                          onAdditionalCostChange(
                            additionalCost.id,
                            'description',
                            event.target.value
                          )
                        }
                      />
                    </Grid>
                    <Grid item xs={12} md={3}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Value"
                        value={additionalCost.value}
                        onChange={(event) =>
                          onAdditionalCostChange(additionalCost.id, 'value', event.target.value)
                        }
                      />
                    </Grid>
                    <Grid item xs={12} md={3}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Unit"
                        value={additionalCost.unit}
                        onChange={(event) =>
                          onAdditionalCostChange(additionalCost.id, 'unit', event.target.value)
                        }
                      />
                    </Grid>
                    <Grid item xs={12} md={1}>
                      <Tooltip title="ลบ">
                        <IconButton
                          color="error"
                          onClick={() => onDeleteAdditionalCost(additionalCost.id)}>
                          <DeleteOutline />
                        </IconButton>
                      </Tooltip>
                    </Grid>
                  </Grid>
                ))
              ) : (
                <Typography variant="body2" color="text.secondary">
                  ยังไม่มีรายละเอียดเพิ่มเติม
                </Typography>
              )}
            </Stack>

            <TextField
              label="Internal Remark"
              value={finalPriceDraft.remark}
              onChange={(event) => onRemarkChange(event.target.value)}
              multiline
              minRows={4}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />

            <TextField
              label="คำแนะนำสำหรับ RFQ นี้ (ลูกค้า)"
              value={finalPriceDraft.recommend}
              onChange={(event) => onRecommendChange(event.target.value)}
              multiline
              minRows={4}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />
          </Stack>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button className="btn-crimson-red" disabled={isSubmitting} onClick={onClose}>
          {t('button.cancel')}
        </Button>
        <Button
          className="btn-emerald-green"
          variant="contained"
          disabled={isSubmitting}
          onClick={onRequestSave}>
          บันทึก Final ราคา
        </Button>
      </DialogActions>
    </Dialog>
  );
}
