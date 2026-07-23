import { Add, AutoAwesome, DeleteOutline } from '@mui/icons-material';
import {
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Grid,
  IconButton,
  InputAdornment,
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
import { ReactElement } from 'react';
import {
  RFQSupplierQuote,
  RFQSupplierQuoteAdditionalCost
} from 'services/RFQ/rfq-type';
import { outlinedActionButtonSx } from './supplierQuoteDialogStyles';

interface FinalPriceDraftTier {
  id: number;
  quantity: number;
  productPrice: string;
  commission: string;
  landTotalPrice: string;
  seaTotalPrice: string;
  isFcl: boolean;
  currency?: string | null;
}

interface FinalPriceDraftDetail {
  id: number;
  optionName: string;
  spec: string;
  packages?: FinalPriceDraftPackage[];
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
  details?: Record<number, { productPrice?: string; landTotalPrice?: string; seaTotalPrice?: string }>;
}

interface FinalPriceQuoteDialogProps {
  open: boolean;
  finalPriceQuote: RFQSupplierQuote | null;
  finalPriceDraft: {
    details: FinalPriceDraftDetail[];
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
  onTierChange: (
    detailId: number,
    tierId: number,
    field: 'productPrice' | 'landTotalPrice' | 'seaTotalPrice',
    value: string
  ) => void;
  onTierFclChange: (detailId: number, tierId: number, checked: boolean) => void;
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
  formatQuantity: (value?: number | null) => string;
  formatPrice: (value?: number | null, currency?: string | null) => string;
  formatSupplierQuoteAdditionalCost: (additionalCost: RFQSupplierQuoteAdditionalCost) => string;
  getSupplierDisplayName: (supplier?: RFQSupplierQuote['supplier'] | null) => string;
  t: (key: string) => string;
}

export function FinalPriceQuoteDialog(props: FinalPriceQuoteDialogProps): ReactElement {
  const {
    open,
    finalPriceQuote,
    finalPriceDraft,
    finalPriceErrors,
    isSubmitting,
    onClose,
    onRemarkChange,
    onRecommendChange,
    onCommissionChange,
    onTierChange,
    onTierFclChange,
    onAddAdditionalCost,
    onAdditionalCostChange,
    onDeleteAdditionalCost,
    onRequestSave,
    onGenerateMessage,
    onTranslateMessage,
    formatQuantity,
    formatPrice,
    formatSupplierQuoteAdditionalCost,
    getSupplierDisplayName,
    t
  } = props;

  const renderPackageSummary = (packageItem: FinalPriceDraftPackage): string => {
    const dimension = packageItem.packageDimension?.trim();
    const weight = packageItem.packageWeight?.trim();
    const capacity = packageItem.packageCapacity?.trim();
    const summaryParts = [
      packageItem.packageName,
      dimension ? `ขนาด ${dimension}` : null,
      weight ? `น้ำหนัก ${weight} kg` : null,
      capacity ? `บรรจุ ${capacity} ชิ้น` : null
    ].filter(Boolean);

    return summaryParts.join(' • ');
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

  const getTierQuantity = (detailId: number, tierId: number): number => {
    const quoteDetail = finalPriceQuote?.details?.find((item) => item.id === detailId);
    const quoteTier = quoteDetail?.tiers?.find((item) => item.id === tierId);
    return quoteTier?.quantity || 0;
  };

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
            {finalPriceDraft.details.length ? (
              finalPriceDraft.details.map((detail, detailIndex) => (
                <Box
                  key={detail.id}
                  sx={{
                    border: '1px solid #dce4ee',
                    borderRadius: 2,
                    p: 2,
                    backgroundColor: '#fff'
                  }}>
                  <Stack spacing={1.5}>
                    <Box>
                      <Typography variant="body2" fontWeight={700}>
                        {detail.optionName || `Option ${detailIndex + 1}`}
                      </Typography>
                      {detail.spec ? (
                        <Typography variant="body2" color="text.secondary">
                          {detail.spec}
                        </Typography>
                      ) : null}
                    </Box>

                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ whiteSpace: 'nowrap' }}>MOQ</TableCell>
                          <TableCell align="right" sx={{ minWidth: 140, whiteSpace: 'nowrap' }}>
                            ราคาจาก supplier
                          </TableCell>
                          <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                            ค่าขนส่งภายในจีน
                          </TableCell>
                          <TableCell align="right" sx={{ minWidth: 140, whiteSpace: 'nowrap' }}>
                            ราคาสินค้า(บาท)
                          </TableCell>
                          <TableCell align="right" sx={{ minWidth: 140, whiteSpace: 'nowrap', fontSize: 12 }}>
                            รวมส่งทางรถ
                          </TableCell>
                          <TableCell align="right" sx={{ minWidth: 140, whiteSpace: 'nowrap', fontSize: 12 }}>
                            รวมส่งทางเรือ
                          </TableCell>
                          <TableCell align="center" sx={{ minWidth: 120, whiteSpace: 'nowrap' }}>
                            ปิดตู้
                          </TableCell>
                          <TableCell align="right" sx={{ minWidth: 140, whiteSpace: 'nowrap' }}>
                            Commission
                          </TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {detail.tiers.map((tier) => {
                          const tierError = finalPriceErrors.details?.[tier.id] || {};
                          const tierCurrency = getTierCurrency(detail.id, tier.id);
                          const tierSupplierProductPrice = getTierSupplierProductPrice(
                            detail.id,
                            tier.id
                          );
                          const tierShippingCost = getTierShippingCost(detail.id, tier.id);

                          return (
                            <TableRow key={tier.id}>
                              <TableCell>{formatQuantity(tier.quantity)}</TableCell>
                              <TableCell align="right">
                                {formatPrice(tierSupplierProductPrice, tierCurrency)}
                              </TableCell>
                              <TableCell align="right">
                                {formatPrice(tierShippingCost, tierCurrency)}
                              </TableCell>
                              <TableCell align="right" sx={{ minWidth: 140 }}>
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
                                  fullWidth
                                />
                              </TableCell>
                              <TableCell align="right" sx={{ minWidth: 140 }}>
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
                                  fullWidth
                                />
                              </TableCell>
                              <TableCell align="right" sx={{ minWidth: 140 }}>
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
                                  fullWidth
                                />
                              </TableCell>
                              <TableCell align="center" sx={{ minWidth: 120 }}>
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
                              <TableCell align="right" sx={{ minWidth: 50 }}>
                                <TextField
                                  size="small"
                                  type="number"
                                  value={tier.commission}
                                  onChange={(event) =>
                                    onCommissionChange(detail.id, tier.id, event.target.value)
                                  }
                                  InputProps={{
                                    endAdornment: <InputAdornment position="end">%</InputAdornment>
                                  }}
                                  inputProps={{ min: 0, step: '1', max: 100 }}
                                  fullWidth
                                />
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>

                    {detail.packages?.length ? (
                      <Box
                        sx={{
                          border: '1px solid #dce4ee',
                          borderRadius: 2,
                          px: 1.5,
                          py: 1,
                          backgroundColor: '#f8fafc'
                        }}>
                        <Stack spacing={0.75}>
                          <Typography variant="caption" fontWeight={700} color="text.secondary">
                            Packing List
                          </Typography>
                          {detail.packages
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
                  </Stack>
                </Box>
              ))
            ) : (
              <Typography variant="body2" color="text.secondary">
                ยังไม่มีรายละเอียดราคาจาก supplier quote
              </Typography>
            )}

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
              label="Remark"
              value={finalPriceDraft.remark}
              onChange={(event) => onRemarkChange(event.target.value)}
              multiline
              minRows={4}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />

            <TextField
              label="คำแนะนำสำหรับ RFQ นี้"
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
