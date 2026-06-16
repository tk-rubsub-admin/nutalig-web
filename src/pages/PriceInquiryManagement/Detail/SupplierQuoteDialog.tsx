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
  InputAdornment,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography
} from '@mui/material';
import { ReactElement } from 'react';
import { Supplier } from 'services/Supplier/supplier-type';
import { RFQSupplierQuote } from 'services/RFQ/rfq-type';
import { blueActionButtonSx, outlinedActionButtonSx } from './supplierQuoteDialogStyles';

export interface SupplierQuoteDialogDetail {
  id: number;
  rfqDetailId?: number | null;
  optionName: string;
  spec: string;
  sortOrder: number;
  remark: string;
  packageDimension?: string;
  packageWeight?: string;
  packageCapacity?: string;
  packageBoxWidth?: string;
  packageBoxLength?: string;
  packageBoxHeight?: string;
  packagePiecesPerBox?: string;
  packageWeightPerBoxKg?: string;
  tiers: Array<{
    id: number;
    quantity: number;
    productPrice: number;
    shippingCost: number;
    currency?: string | null;
    sortOrder: number;
    createdDate: string;
    updatedDate: string;
  }>;
  createdDate: string;
  updatedDate: string;
  createdBy: string;
  updatedBy: string;
}

export interface SupplierQuoteDialogProps {
  open: boolean;
  supplier: Supplier | null;
  quote: RFQSupplierQuote | null;
  quoteSupplierSearchInput: string;
  onQuoteSupplierSearchInputChange: (value: string) => void;
  onQuoteSupplierSearchEnter: () => void;
  onQuoteSupplierSearch: () => void;
  isQuoteSupplierSearchFetching: boolean;
  quoteSupplierSearchResult: Supplier[];
  supplierQuoteBySupplierId: Record<string, RFQSupplierQuote | null>;
  onSelectSupplier: (supplier: Supplier) => void;
  onChangeSupplier: () => void;
  quoteDraftDetails: SupplierQuoteDialogDetail[];
  quoteDraftAdditionalCosts: Array<{
    id: number;
    description: string;
    value: string;
    unit: string;
  }>;
  quoteDraftErrors: Record<number, any>;
  onAddDetail: () => void;
  onDetailChange: (
    detailId: number,
    field:
      | 'optionName'
      | 'spec'
      | 'remark'
      | 'packageDimension'
      | 'packageWeight'
      | 'packageCapacity'
      | 'packageBoxWidth'
      | 'packageBoxLength'
      | 'packageBoxHeight'
      | 'packagePiecesPerBox'
      | 'packageWeightPerBoxKg',
    value: string
  ) => void;
  onAddTier: (detailId: number) => void;
  onTierChange: (
    detailId: number,
    tierId: number,
    field: 'quantity' | 'productPrice' | 'shippingCost',
    value: string
  ) => void;
  onDeleteTier: (detailId: number, tierId: number) => void;
  onAddAdditionalCost: () => void;
  onAdditionalCostChange: (
    additionalCostId: number,
    field: 'description' | 'value' | 'unit',
    value: string
  ) => void;
  onDeleteAdditionalCost: (additionalCostId: number) => void;
  onSave: () => void;
  onClose: () => void;
  isSubmitting: boolean;
  t: (key: string) => string;
}

export function SupplierQuoteDialog(props: SupplierQuoteDialogProps): ReactElement {
  const {
    open,
    supplier,
    quote,
    quoteSupplierSearchInput,
    onQuoteSupplierSearchInputChange,
    onQuoteSupplierSearchEnter,
    onQuoteSupplierSearch,
    isQuoteSupplierSearchFetching,
    quoteSupplierSearchResult,
    supplierQuoteBySupplierId,
    onSelectSupplier,
    onChangeSupplier,
    quoteDraftDetails,
    quoteDraftAdditionalCosts,
    quoteDraftErrors,
    onAddDetail,
    onDetailChange,
    onAddTier,
    onTierChange,
    onDeleteTier,
    onAddAdditionalCost,
    onAdditionalCostChange,
    onDeleteAdditionalCost,
    onSave,
    onClose,
    isSubmitting,
    t
  } = props;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        {quote ? 'แก้ไขราคาที่ supplier ตอบกลับ' : 'บันทึกราคาที่ supplier ตอบกลับ'}
      </DialogTitle>
      <DialogContent dividers>
        <Stack spacing={3}>
          <Stack spacing={2}>
            {supplier ? null : (
              <>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                  <TextField
                    fullWidth
                    size="small"
                    label="ค้นหาคู่ค้า"
                    value={quoteSupplierSearchInput}
                    onChange={(event) => onQuoteSupplierSearchInputChange(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        event.preventDefault();
                        onQuoteSupplierSearchEnter();
                      }
                    }}
                  />
                  <Button
                    variant="contained"
                    sx={blueActionButtonSx}
                    onClick={onQuoteSupplierSearch}>
                    ค้นหา
                  </Button>
                </Stack>

                {isQuoteSupplierSearchFetching ? (
                  <Stack alignItems="center" justifyContent="center" sx={{ py: 3 }}>
                    <Typography variant="body2" color="text.secondary">
                      กำลังโหลดข้อมูลคู่ค้า...
                    </Typography>
                  </Stack>
                ) : quoteSupplierSearchResult.length ? (
                  <Stack spacing={1.25}>
                    {quoteSupplierSearchResult.map((item) => {
                      const supplierId = item.supplierId || item.id;
                      const existingQuote = supplierId
                        ? supplierQuoteBySupplierId[supplierId]
                        : null;

                      return (
                        <Box
                          key={item.supplierId || item.id}
                          sx={{
                            border: '1px solid #dce4ee',
                            borderRadius: 2,
                            p: 1.5,
                            backgroundColor: '#fff'
                          }}>
                          <Stack
                            direction={{ xs: 'column', sm: 'row' }}
                            spacing={1}
                            justifyContent="space-between"
                            alignItems={{ xs: 'flex-start', sm: 'center' }}>
                            <Box sx={{ minWidth: 0 }}>
                              <Typography variant="subtitle2" fontWeight={700}>
                                {item.supplierName || '-'}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                {item.supplierId || item.id} | {item.supplierCode || '-'}
                              </Typography>
                            </Box>
                            <Button
                              variant="contained"
                              sx={blueActionButtonSx}
                              onClick={() => onSelectSupplier(item)}>
                              {existingQuote ? 'แก้ไขราคา' : 'เลือก'}
                            </Button>
                          </Stack>
                        </Box>
                      );
                    })}
                  </Stack>
                ) : (
                  <Box
                    sx={{
                      border: '1px dashed #cbd5e1',
                      borderRadius: 2,
                      py: 3,
                      px: 2,
                      textAlign: 'center',
                      backgroundColor: '#f8fafc'
                    }}>
                    <Typography variant="body2" color="text.secondary">
                      ไม่พบคู่ค้าที่ใช้งานอยู่
                    </Typography>
                  </Box>
                )}
              </>
            )}
          </Stack>

          {supplier ? (
            <>
              <Stack spacing={2}>
                <Box
                  sx={{
                    border: '1px solid #dce4ee',
                    borderRadius: 2,
                    p: 1.5,
                    backgroundColor: '#f8fafc'
                  }}>
                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                    spacing={2}>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography variant="subtitle2" fontWeight={700}>
                        {supplier.supplierName || '-'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {supplier.supplierId || supplier.id || '-'} | {supplier.supplierCode || '-'}
                      </Typography>
                    </Box>
                    <Button
                      variant="contained"
                      size="small"
                      sx={outlinedActionButtonSx}
                      onClick={onChangeSupplier}>
                      เปลี่ยนคู่ค้า
                    </Button>
                  </Stack>
                </Box>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="subtitle1" fontWeight={700}>
                    รายการราคาที่ตอบกลับ
                  </Typography>
                  <Button
                    variant="contained"
                    size="small"
                    startIcon={<Add />}
                    sx={outlinedActionButtonSx}
                    onClick={onAddDetail}>
                    เพิ่มรายการ
                  </Button>
                </Stack>
                {quoteDraftDetails.map((detail) => {
                  const detailError = quoteDraftErrors[detail.id] || {};
                  return (
                    <Box
                      key={detail.id}
                      sx={{
                        border: '1px solid #dce4ee',
                        borderRadius: 3,
                        p: 2,
                        backgroundColor: '#fff'
                      }}>
                      <Stack spacing={2}>
                        <Grid container spacing={1.5}>
                          <Grid item xs={12} md={4}>
                            <TextField
                              fullWidth
                              size="small"
                              label="Option"
                              value={detail.optionName}
                              error={Boolean(detailError.optionName)}
                              helperText={detailError.optionName}
                              InputLabelProps={{ shrink: true }}
                              onChange={(event) =>
                                onDetailChange(detail.id, 'optionName', event.target.value)
                              }
                            />
                          </Grid>
                          <Grid item xs={12} md={8}>
                            <TextField
                              fullWidth
                              size="small"
                              label="Spec"
                              value={detail.spec}
                              error={Boolean(detailError.spec)}
                              helperText={detailError.spec}
                              InputLabelProps={{ shrink: true }}
                              onChange={(event) =>
                                onDetailChange(detail.id, 'spec', event.target.value)
                              }
                            />
                          </Grid>
                          <Grid item xs={12}>
                            <TextField
                              fullWidth
                              size="small"
                              label="Remark"
                              value={detail.remark || ''}
                              InputLabelProps={{ shrink: true }}
                              onChange={(event) =>
                                onDetailChange(detail.id, 'remark', event.target.value)
                              }
                            />
                          </Grid>
                        </Grid>

                        <Stack direction="row" justifyContent="flex-end" alignItems="center">
                          <Button
                            size="small"
                            variant="contained"
                            startIcon={<Add />}
                            sx={outlinedActionButtonSx}
                            onClick={() => onAddTier(detail.id)}>
                            เพิ่ม Tier
                          </Button>
                        </Stack>
                        {detailError.tiers ? (
                          <Typography variant="caption" color="error">
                            {detailError.tiers}
                          </Typography>
                        ) : null}
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell>MOQ</TableCell>
                              <TableCell>Product Price</TableCell>
                              <TableCell>ค่าขนส่ง</TableCell>
                              <TableCell align="center">จัดการ</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {detail.tiers.length ? (
                              detail.tiers.map((tier) => {
                                const tierError = detailError.tierErrors?.[tier.id] || {};
                                return (
                                  <TableRow key={tier.id}>
                                    <TableCell>
                                      <TextField
                                        fullWidth
                                        size="small"
                                        type="number"
                                        value={tier.quantity}
                                        error={Boolean(tierError.quantity)}
                                        helperText={tierError.quantity}
                                        onChange={(event) =>
                                          onTierChange(
                                            detail.id,
                                            tier.id,
                                            'quantity',
                                            event.target.value
                                          )
                                        }
                                      />
                                    </TableCell>
                                    <TableCell>
                                      <TextField
                                        fullWidth
                                        size="small"
                                        type="number"
                                        value={tier.productPrice}
                                        error={Boolean(tierError.productPrice)}
                                        helperText={tierError.productPrice}
                                        InputProps={{
                                          endAdornment: (
                                            <InputAdornment position="end">
                                              หยวน​ (¥)
                                            </InputAdornment>
                                          )
                                        }}
                                        onChange={(event) =>
                                          onTierChange(
                                            detail.id,
                                            tier.id,
                                            'productPrice',
                                            event.target.value
                                          )
                                        }
                                      />
                                    </TableCell>
                                    <TableCell>
                                      <TextField
                                        fullWidth
                                        size="small"
                                        type="number"
                                        value={tier.shippingCost}
                                        error={Boolean(tierError.shippingCost)}
                                        helperText={tierError.shippingCost}
                                        InputProps={{
                                          endAdornment: (
                                            <InputAdornment position="end">
                                              หยวน​ (¥)
                                            </InputAdornment>
                                          )
                                        }}
                                        onChange={(event) =>
                                          onTierChange(
                                            detail.id,
                                            tier.id,
                                            'shippingCost',
                                            event.target.value
                                          )
                                        }
                                      />
                                    </TableCell>
                                    <TableCell align="center">
                                      <IconButton
                                        size="small"
                                        onClick={() => onDeleteTier(detail.id, tier.id)}
                                        sx={{ color: '#c62828' }}>
                                        <DeleteOutline fontSize="small" />
                                      </IconButton>
                                    </TableCell>
                                  </TableRow>
                                );
                              })
                            ) : (
                              <TableRow>
                                <TableCell colSpan={4} align="center">
                                  <Typography variant="body2" color="text.secondary">
                                    ยังไม่มีข้อมูล Tier
                                  </Typography>
                                </TableCell>
                              </TableRow>
                            )}
                          </TableBody>
                        </Table>
                        <Stack spacing={2}>
                          <Typography>Package</Typography>
                          <Grid container spacing={1.5}>
                            <Grid item xs={4} md={1}>
                              <TextField
                                fullWidth
                                size="small"
                                label="กว้าง"
                                type="number"
                                required
                                InputLabelProps={{ shrink: true }}
                                value={detail.packageBoxWidth || ''}
                                onChange={(event) =>
                                  onDetailChange(detail.id, 'packageBoxWidth', event.target.value)
                                }
                              />
                            </Grid>
                            <Grid item xs="auto" sx={{ display: 'flex', alignItems: 'center' }}>
                              <Typography
                                variant="body2"
                                color="text.secondary"
                                sx={{ px: 0.5, fontWeight: 700 }}>
                                x
                              </Typography>
                            </Grid>
                            <Grid item xs={4} md={1}>
                              <TextField
                                fullWidth
                                size="small"
                                label="ยาว"
                                type="number"
                                required
                                InputLabelProps={{ shrink: true }}
                                value={detail.packageBoxLength || ''}
                                onChange={(event) =>
                                  onDetailChange(detail.id, 'packageBoxLength', event.target.value)
                                }
                              />
                            </Grid>
                            <Grid item xs="auto" sx={{ display: 'flex', alignItems: 'center' }}>
                              <Typography
                                variant="body2"
                                color="text.secondary"
                                sx={{ px: 0.5, fontWeight: 700 }}>
                                x
                              </Typography>
                            </Grid>
                            <Grid item xs={4} md={1}>
                              <TextField
                                fullWidth
                                size="small"
                                label="สูง"
                                type="number"
                                required
                                InputLabelProps={{ shrink: true }}
                                value={detail.packageBoxHeight || ''}
                                onChange={(event) =>
                                  onDetailChange(detail.id, 'packageBoxHeight', event.target.value)
                                }
                              />
                            </Grid>
                            <Grid item md={2} />
                            <Grid item xs={6} md={3}>
                              <TextField
                                fullWidth
                                size="small"
                                label="1 กล่องบรรจุจำนวนกี่ชิ้น"
                                type="number"
                                InputLabelProps={{ shrink: true }}
                                value={detail.packagePiecesPerBox || ''}
                                onChange={(event) =>
                                  onDetailChange(
                                    detail.id,
                                    'packagePiecesPerBox',
                                    event.target.value
                                  )
                                }
                              />
                            </Grid>
                            <Grid item xs={6} md={3}>
                              <TextField
                                fullWidth
                                size="small"
                                label="1 กล่อง ขนาดกี่ kg"
                                type="number"
                                InputLabelProps={{ shrink: true }}
                                value={detail.packageWeightPerBoxKg || ''}
                                onChange={(event) =>
                                  onDetailChange(
                                    detail.id,
                                    'packageWeightPerBoxKg',
                                    event.target.value
                                  )
                                }
                              />
                            </Grid>
                          </Grid>
                        </Stack>
                      </Stack>
                    </Box>
                  );
                })}
              </Stack>

              <Stack spacing={2}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="subtitle1" fontWeight={700}>
                    Additional Cost
                  </Typography>
                  <Button
                    variant="contained"
                    size="small"
                    startIcon={<Add />}
                    sx={outlinedActionButtonSx}
                    onClick={onAddAdditionalCost}>
                    เพิ่มรายละเอียดเพิ่มเติม
                  </Button>
                </Stack>
                {quoteDraftAdditionalCosts.map((additionalCost) => (
                  <Grid container spacing={1} key={additionalCost.id}>
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
                    <Grid item xs={12} md={4}>
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
                  </Grid>
                ))}
              </Stack>
            </>
          ) : null}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button
          variant="contained"
          color="secondary"
          disabled={isSubmitting || !supplier}
          onClick={onSave}>
          {t('button.save')}
        </Button>
        <Button variant="contained" onClick={onClose}>
          {t('button.close')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
