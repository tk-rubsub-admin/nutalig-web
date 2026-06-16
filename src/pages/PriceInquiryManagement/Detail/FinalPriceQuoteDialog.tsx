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
import { RFQSupplierQuote, RFQSupplierQuoteAdditionalCost } from 'services/RFQ/rfq-type';
import { outlinedActionButtonSx } from './supplierQuoteDialogStyles';

interface FinalPriceDraftTier {
  id: number;
  quantity: number;
  productPrice: number;
  landFreightCost: string;
  seaFreightCost: string;
}

interface FinalPriceDraftDetail {
  id: number;
  optionName: string;
  spec: string;
  tiers: FinalPriceDraftTier[];
}

interface FinalPriceDraftAdditionalCost {
  id: number;
  description: string;
  value: string;
  unit: string;
}

interface FinalPriceDraftErrors {
  details?: Record<number, { landFreightCost?: string; seaFreightCost?: string }>;
}

interface FinalPriceQuoteDialogProps {
  open: boolean;
  finalPriceQuote: RFQSupplierQuote | null;
  finalPriceDraft: {
    details: FinalPriceDraftDetail[];
    additionalCosts: FinalPriceDraftAdditionalCost[];
    remark: string;
  };
  finalPriceErrors: FinalPriceDraftErrors;
  isSubmitting: boolean;
  onClose: () => void;
  onRemarkChange: (value: string) => void;
  onTierChange: (
    detailId: number,
    tierId: number,
    field: 'landFreightCost' | 'seaFreightCost',
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
                          <TableCell>MOQ</TableCell>
                          <TableCell align="right">ราคาสินค้า</TableCell>
                          <TableCell align="right">ค่าขนส่งทางรถ</TableCell>
                          <TableCell align="right">รวมทางรถ</TableCell>
                          <TableCell align="right">ค่าขนส่งทางเรือ</TableCell>
                          <TableCell align="right">รวมทางเรือ</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {detail.tiers.map((tier) => {
                          const landFreightCost = Number(tier.landFreightCost.replace(/,/g, '')) || 0;
                          const seaFreightCost = Number(tier.seaFreightCost.replace(/,/g, '')) || 0;
                          const tierError = finalPriceErrors.details?.[tier.id] || {};

                          return (
                            <TableRow key={tier.id}>
                              <TableCell>{formatQuantity(tier.quantity)}</TableCell>
                              <TableCell align="right">{formatPrice(tier.productPrice)}</TableCell>
                              <TableCell align="right" sx={{ minWidth: 160 }}>
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
                                {formatPrice(tier.productPrice + landFreightCost)}
                              </TableCell>
                              <TableCell align="right" sx={{ minWidth: 160 }}>
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
                                {formatPrice(tier.productPrice + seaFreightCost)}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
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
              value={finalPriceDraft.remark}
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
        <Button variant="contained" disabled={isSubmitting} onClick={onRequestSave}>
          บันทึก Final ราคา
        </Button>
        <Button disabled={isSubmitting} onClick={onClose}>
          {t('button.cancel')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
