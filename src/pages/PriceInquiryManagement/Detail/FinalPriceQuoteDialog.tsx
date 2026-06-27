import { Add, DeleteOutline } from '@mui/icons-material';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
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
  productPrice: number;
  landFreightCost: string;
  seaFreightCost: string;
  currency?: string | null;
  exchangeRate: string;
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
  details?: Record<
    number,
    { landFreightCost?: string; seaFreightCost?: string; exchangeRate?: string }
  >;
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
    recommend: string;
  };
  finalPriceErrors: FinalPriceDraftErrors;
  isSubmitting: boolean;
  onClose: () => void;
  onRemarkChange: (value: string) => void;
  onTierChange: (
    detailId: number,
    tierId: number,
    field: 'landFreightCost' | 'seaFreightCost' | 'exchangeRate',
    value: string
  ) => void;
  onAddAdditionalCost: () => void;
  onAdditionalCostChange: (
    additionalCostId: number,
    field: 'description' | 'value' | 'unit',
    value: string
  ) => void;
  onDeleteAdditionalCost: (additionalCostId: number) => void;
  onRequestSave: () => void;
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
    onTierChange,
    onAddAdditionalCost,
    onAdditionalCostChange,
    onDeleteAdditionalCost,
    onRequestSave,
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
            <Typography variant="subtitle1" fontWeight={700}>
              รายการ Final ราคา
            </Typography>
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
                          <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                            ราคาสินค้า
                          </TableCell>
                          <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                            ค่าขนส่ง
                          </TableCell>
                          <TableCell align="right" sx={{ width: 110, whiteSpace: 'nowrap' }}>
                            อัตราแลกเปลี่ยน
                          </TableCell>
                          <TableCell
                            align="right"
                            sx={{ width: 120, whiteSpace: 'nowrap', fontSize: 12 }}>
                            ค่าขนส่งทางรถ
                          </TableCell>
                          <TableCell align="right" sx={{ whiteSpace: 'nowrap', fontSize: 12 }}>
                            รวมทางรถ
                          </TableCell>
                          <TableCell
                            align="right"
                            sx={{ width: 120, whiteSpace: 'nowrap', fontSize: 12 }}>
                            ค่าขนส่งทางเรือ
                          </TableCell>
                          <TableCell align="right" sx={{ whiteSpace: 'nowrap', fontSize: 12 }}>
                            รวมทางเรือ
                          </TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {detail.tiers.map((tier) => {
                          const landFreightCost = Number(tier.landFreightCost.replace(/,/g, '')) || 0;
                          const seaFreightCost = Number(tier.seaFreightCost.replace(/,/g, '')) || 0;
                          const exchangeRate = Number(tier.exchangeRate.replace(/,/g, '')) || 1;
                          const tierError = finalPriceErrors.details?.[tier.id] || {};
                          const tierCurrency = getTierCurrency(detail.id, tier.id);
                          const tierShippingCost = getTierShippingCost(detail.id, tier.id);
                          const quantity = getTierQuantity(detail.id, tier.id) || tier.quantity;
                          const shippingPerUnit = quantity > 0 ? (tierShippingCost || 0) / quantity : 0;
                          const baseAmount = tier.productPrice + shippingPerUnit;
                          const landTotalPrice = baseAmount * exchangeRate + landFreightCost;
                          const seaTotalPrice = baseAmount * exchangeRate + seaFreightCost;

                          return (
                            <TableRow key={tier.id}>
                              <TableCell>{formatQuantity(tier.quantity)}</TableCell>
                              <TableCell align="right">
                                {formatPrice(tier.productPrice, tierCurrency)}
                              </TableCell>
                              <TableCell align="right">
                                {formatPrice(tierShippingCost, tierCurrency)}
                              </TableCell>
                              <TableCell align="right" sx={{ minWidth: 120 }}>
                                <TextField
                                  size="small"
                                  type="number"
                                  value={tier.exchangeRate}
                                  onChange={(event) =>
                                    onTierChange(
                                      detail.id,
                                      tier.id,
                                      'exchangeRate',
                                      event.target.value
                                    )
                                  }
                                  error={Boolean(tierError.exchangeRate)}
                                  helperText={tierError.exchangeRate}
                                  inputProps={{ min: 0, step: '0.0001' }}
                                  fullWidth
                                />
                              </TableCell>
                              <TableCell align="right" sx={{ minWidth: 120 }}>
                                <TextField
                                  size="small"
                                  type="number"
                                  value={tier.landFreightCost}
                                  onChange={(event) =>
                                    onTierChange(
                                      detail.id,
                                      tier.id,
                                      'landFreightCost',
                                      event.target.value
                                    )
                                  }
                                  error={Boolean(tierError.landFreightCost)}
                                  helperText={tierError.landFreightCost}
                                  inputProps={{ min: 0, step: '0.01' }}
                                  fullWidth
                                />
                              </TableCell>
                              <TableCell align="right">
                                {formatPrice(landTotalPrice, 'THB')}
                              </TableCell>
                              <TableCell align="right" sx={{ minWidth: 120 }}>
                                <TextField
                                  size="small"
                                  type="number"
                                  value={tier.seaFreightCost}
                                  onChange={(event) =>
                                    onTierChange(
                                      detail.id,
                                      tier.id,
                                      'seaFreightCost',
                                      event.target.value
                                    )
                                  }
                                  error={Boolean(tierError.seaFreightCost)}
                                  helperText={tierError.seaFreightCost}
                                  inputProps={{ min: 0, step: '0.01' }}
                                  fullWidth
                                />
                              </TableCell>
                              <TableCell align="right">
                                {formatPrice(seaTotalPrice, 'THB')}
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
                Additional Cost จาก Supplier Quote
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
                  ไม่มี Additional Cost
                </Typography>
              )}
            </Stack>

            <Stack spacing={2}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="subtitle1" fontWeight={700}>
                  Additional Cost เพิ่มเติม
                </Typography>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<Add />}
                  sx={outlinedActionButtonSx}
                  onClick={onAddAdditionalCost}>
                  เพิ่มค่าใช้จ่าย
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
                      <Tooltip title="ลบค่าใช้จ่าย">
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
                  ยังไม่มี Additional Cost เพิ่มเติม
                </Typography>
              )}
            </Stack>

            <TextField
              label="Remark / คำแนะนำสำหรับ RFQ นี้"
              value={finalPriceDraft.recommend}
              onChange={(event) => onRemarkChange(event.target.value)}
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
