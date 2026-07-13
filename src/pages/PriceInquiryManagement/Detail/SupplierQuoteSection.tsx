import { Add, DeleteOutline, Edit } from '@mui/icons-material';
import {
  Box,
  Button,
  Chip,
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
import { RFQSupplierQuote, RFQSupplierQuoteAdditionalCost } from 'services/RFQ/rfq-type';
import { outlinedActionButtonSx } from './supplierQuoteDialogStyles';
import { SupplierQuoteDialogDetail } from './SupplierQuoteDialog';

interface SupplierQuoteDraftAdditionalCost {
  id: number;
  description: string;
  value: string;
  unit: string;
}

interface SupplierQuoteSectionProps {
  quotes: RFQSupplierQuote[];
  editingQuoteId: string | null;
  quoteDraftDetails: SupplierQuoteDialogDetail[];
  quoteDraftAdditionalCosts: SupplierQuoteDraftAdditionalCost[];
  quoteDraftErrors: Record<number, any>;
  isSubmitting: boolean;
  onEditQuote: (quote: RFQSupplierQuote) => void;
  onCancelEditQuote: () => void;
  onSaveEditQuote: () => void;
  onDetailChange: (
    detailId: number,
    field:
      | 'optionName'
      | 'spec'
      | 'remark',
    value: string
  ) => void;
  onAddPackage: (detailId: number) => void;
  onPackageChange: (
    detailId: number,
    packageId: number,
    field:
      | 'packageName'
      | 'packageWidth'
      | 'packageLength'
      | 'packageHeight'
      | 'packageWeight'
      | 'packageCapacity',
    value: string
  ) => void;
  onDeletePackage: (detailId: number, packageId: number) => void;
  onTierChange: (
    detailId: number,
    tierId: number,
    field: 'quantity' | 'productPrice' | 'shippingCost',
    value: string
  ) => void;
  onAdditionalCostChange: (
    additionalCostId: number,
    field: 'description' | 'value' | 'unit',
    value: string
  ) => void;
  formatQuantity: (value?: number | null) => string;
  formatPrice: (value?: number | null, currency?: string | null) => string;
  formatSupplierQuoteAdditionalCost: (additionalCost: RFQSupplierQuoteAdditionalCost) => string;
  getSupplierDisplayName: (supplier?: RFQSupplierQuote['supplier'] | null) => string;
}

export function SupplierQuoteSection(props: SupplierQuoteSectionProps): ReactElement {
  const {
    quotes,
    editingQuoteId,
    quoteDraftDetails,
    quoteDraftAdditionalCosts,
    quoteDraftErrors,
    isSubmitting,
    onEditQuote,
    onCancelEditQuote,
    onSaveEditQuote,
    onDetailChange,
    onAddPackage,
    onPackageChange,
    onDeletePackage,
    onTierChange,
    onAdditionalCostChange,
    formatQuantity,
    formatPrice,
    formatSupplierQuoteAdditionalCost,
    getSupplierDisplayName
  } = props;

  return (
    <Box
      sx={{
        border: '1px solid #e6ebf1',
        borderRadius: 3,
        overflow: 'hidden',
        backgroundColor: '#fff'
      }}>
      <Stack spacing={2} sx={{ p: 2 }}>
        {quotes.length ? (
          quotes.map((quote) => {
            const isEditing = editingQuoteId === quote.id;

            return (
              <Box
                key={quote.id}
                sx={{
                  border: '1px solid #dce4ee',
                  borderRadius: 3,
                  p: 2,
                  backgroundColor: '#fff'
                }}>
                <Stack spacing={2}>
                  <Stack
                    direction={{ xs: 'column', sm: 'row' }}
                    spacing={1.5}
                    justifyContent="space-between"
                    alignItems={{ xs: 'flex-start', sm: 'center' }}>
                    <Box sx={{ minWidth: 0 }}>
                      <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                        <Typography variant="subtitle1" fontWeight={700}>
                          {getSupplierDisplayName(quote.supplier)}
                        </Typography>
                        {/* <Chip
                          size="small"
                          label={quote.status || 'DRAFT'}
                          sx={{
                            backgroundColor: '#e8f5e9',
                            color: '#2e7d32',
                            border: '1px solid #2e7d3233',
                            fontWeight: 700
                          }}
                        /> */}
                      </Stack>
                      <Typography variant="body2" color="text.secondary">
                        {quote.supplier?.supplierCode || quote.supplier?.id || '-'}
                      </Typography>
                      {quote.remark ? (
                        <Typography variant="body2" sx={{ mt: 0.5 }}>
                          Remark: {quote.remark}
                        </Typography>
                      ) : null}
                    </Box>
                    <Stack direction="row" spacing={1} flexWrap="wrap">
                      {isEditing ? (
                        <>
                          <Button
                            variant="contained"
                            size="small"
                            disabled={isSubmitting}
                            sx={outlinedActionButtonSx}
                            onClick={onSaveEditQuote}>
                            บันทึก
                          </Button>
                          <Button
                            variant="contained"
                            size="small"
                            className="btn-crimson-red"
                            sx={outlinedActionButtonSx}
                            disabled={isSubmitting}
                            onClick={onCancelEditQuote}>
                            ยกเลิก
                          </Button>
                        </>
                      ) : (
                        <Button
                          variant="contained"
                          size="small"
                          startIcon={<Edit />}
                          sx={outlinedActionButtonSx}
                          disabled={isSubmitting}
                          onClick={() => onEditQuote(quote)}>
                          แก้ไขราคา
                        </Button>
                      )}
                    </Stack>
                  </Stack>

                  {(isEditing ? quoteDraftDetails : quote.details)?.length ? (
                    (isEditing ? quoteDraftDetails : quote.details).map((detail, detailIndex) => {
                      const detailError = isEditing ? quoteDraftErrors[detail.id] || {} : {};

                      return (
                        <Box
                          key={detail.id || `${quote.id}-${detailIndex}`}
                          sx={{
                            border: '1px solid #edf2f7',
                            borderRadius: 2,
                            p: 1.5,
                            backgroundColor: '#fbfdff'
                          }}>
                          <Stack spacing={1.25}>
                            <Box>
                              {isEditing ? (
                                <Grid container spacing={1.5}>
                                  <Grid item xs={12} md={4}>
                                    <TextField
                                      fullWidth
                                      size="small"
                                      label="Option"
                                      value={detail.optionName || ''}
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
                                      value={detail.spec || ''}
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
                              ) : (
                                <>
                                  <Typography variant="body2" fontWeight={700}>
                                    {detail.optionName || `Option ${detailIndex + 1}`}
                                  </Typography>
                                  <Typography variant="body2" color="text.secondary">
                                    {detail.spec || '-'}
                                  </Typography>
                                  {detail.remark ? (
                                    <Typography variant="caption" color="text.secondary">
                                      Remark: {detail.remark}
                                    </Typography>
                                  ) : null}
                                </>
                              )}
                            </Box>

                            <Stack spacing={1.5}>
                              <Stack direction="row" justifyContent="space-between" alignItems="center">
                                <Typography variant="subtitle2" fontWeight={700}>
                                  Package
                                </Typography>
                                {isEditing ? (
                                  <Button
                                    size="small"
                                    variant="contained"
                                    startIcon={<Add />}
                                    sx={outlinedActionButtonSx}
                                    onClick={() => onAddPackage(detail.id)}>
                                    เพิ่ม Package
                                  </Button>
                                ) : null}
                              </Stack>
                              {isEditing && detailError.package ? (
                                <Typography variant="caption" color="error">
                                  {detailError.package}
                                </Typography>
                              ) : null}
                              {isEditing ? (
                                <Table size="small">
                                  <TableHead>
                                    <TableRow>
                                      <TableCell>ชื่อ Package</TableCell>
                                      <TableCell>กว้าง</TableCell>
                                      <TableCell>ยาว</TableCell>
                                      <TableCell>สูง</TableCell>
                                      <TableCell>1 กล่องบรรจุจำนวนกี่ชิ้น</TableCell>
                                      <TableCell>1 กล่อง ขนาดกี่ kg</TableCell>
                                      <TableCell align="center">จัดการ</TableCell>
                                    </TableRow>
                                  </TableHead>
                                  <TableBody>
                                    {detail.packages.length ? (
                                      detail.packages.map((packageItem) => (
                                        <TableRow key={packageItem.id}>
                                          <TableCell>
                                            <TextField
                                              fullWidth
                                              size="small"
                                              value={packageItem.packageName || ''}
                                              onChange={(event) =>
                                                onPackageChange(
                                                  detail.id,
                                                  packageItem.id,
                                                  'packageName',
                                                  event.target.value
                                                )
                                              }
                                            />
                                          </TableCell>
                                          <TableCell>
                                            <TextField
                                              fullWidth
                                              size="small"
                                              value={packageItem.packageWidth || ''}
                                              onChange={(event) =>
                                                onPackageChange(
                                                  detail.id,
                                                  packageItem.id,
                                                  'packageWidth',
                                                  event.target.value
                                                )
                                              }
                                            />
                                          </TableCell>
                                          <TableCell>
                                            <TextField
                                              fullWidth
                                              size="small"
                                              value={packageItem.packageLength || ''}
                                              onChange={(event) =>
                                                onPackageChange(
                                                  detail.id,
                                                  packageItem.id,
                                                  'packageLength',
                                                  event.target.value
                                                )
                                              }
                                            />
                                          </TableCell>
                                          <TableCell>
                                            <TextField
                                              fullWidth
                                              size="small"
                                              value={packageItem.packageHeight || ''}
                                              onChange={(event) =>
                                                onPackageChange(
                                                  detail.id,
                                                  packageItem.id,
                                                  'packageHeight',
                                                  event.target.value
                                                )
                                              }
                                            />
                                          </TableCell>
                                          <TableCell>
                                            <TextField
                                              fullWidth
                                              size="small"
                                              value={packageItem.packageWeight || ''}
                                              onChange={(event) =>
                                                onPackageChange(
                                                  detail.id,
                                                  packageItem.id,
                                                  'packageWeight',
                                                  event.target.value
                                                )
                                              }
                                            />
                                          </TableCell>
                                          <TableCell>
                                            <TextField
                                              fullWidth
                                              size="small"
                                              value={packageItem.packageCapacity || ''}
                                              onChange={(event) =>
                                                onPackageChange(
                                                  detail.id,
                                                  packageItem.id,
                                                  'packageCapacity',
                                                  event.target.value
                                                )
                                              }
                                            />
                                          </TableCell>
                                          <TableCell align="center">
                                            <IconButton
                                              size="small"
                                              onClick={() =>
                                                onDeletePackage(detail.id, packageItem.id)
                                              }
                                              sx={{ color: '#c62828' }}>
                                              <DeleteOutline fontSize="small" />
                                            </IconButton>
                                          </TableCell>
                                        </TableRow>
                                      ))
                                    ) : (
                                      <TableRow>
                                        <TableCell colSpan={7} align="center">
                                          <Typography variant="body2" color="text.secondary">
                                            ยังไม่มี Package
                                          </Typography>
                                        </TableCell>
                                      </TableRow>
                                    )}
                                  </TableBody>
                                </Table>
                              ) : (
                                <Stack spacing={1}>
                                  {(detail.packages?.length
                                    ? detail.packages
                                    : detail.packageDimension ||
                                      detail.packageWeight ||
                                      detail.packageCapacity
                                      ? [
                                        {
                                          id: 0,
                                          packageName: detail.packageName,
                                          packageDimension: detail.packageDimension,
                                          packageWeight: detail.packageWeight,
                                          packageCapacity: detail.packageCapacity,
                                          sortOrder: 1
                                        }
                                      ]
                                      : []
                                ).map((packageItem, index) => (
                                    <Grid
                                      container
                                      spacing={1.5}
                                      key={`package-view-${detail.id}-${index}`}>
                                      <Grid item xs={12} md={3}>
                                        <Typography variant="caption" color="text.secondary">
                                          ชื่อ Package
                                        </Typography>
                                        <Typography variant="body2" fontWeight={600}>
                                          {packageItem.packageName || '-'}
                                        </Typography>
                                      </Grid>
                                      <Grid item xs={12} md={3}>
                                        <Typography variant="caption" color="text.secondary">
                                          ขนาดบรรจุ #{index + 1}
                                        </Typography>
                                        <Typography variant="body2" fontWeight={600}>
                                          {packageItem.packageDimension || '-'}
                                        </Typography>
                                      </Grid>
                                      <Grid item xs={12} md={3}>
                                        <Typography variant="caption" color="text.secondary">
                                          น้ำหนักบรรจุ
                                        </Typography>
                                        <Typography variant="body2" fontWeight={600}>
                                          {packageItem.packageWeight || '-'}
                                        </Typography>
                                      </Grid>
                                      <Grid item xs={12} md={3}>
                                        <Typography variant="caption" color="text.secondary">
                                          ความจุ
                                        </Typography>
                                        <Typography variant="body2" fontWeight={600}>
                                          {packageItem.packageCapacity || '-'}
                                        </Typography>
                                      </Grid>
                                    </Grid>
                                  ))}
                                </Stack>
                              )}
                            </Stack>

                            <Table size="small">
                              <TableHead>
                                <TableRow
                                  sx={{
                                    '& th': {
                                      fontWeight: 700,
                                      backgroundColor: '#f8fafc',
                                      whiteSpace: 'nowrap'
                                    }
                                  }}>
                                  <TableCell>MOQ</TableCell>
                                  <TableCell align="right">ราคาสินค้า</TableCell>
                                  <TableCell align="right">ค่าขนส่ง</TableCell>
                                  <TableCell align="right">รวม</TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {detail.tiers.map((tier, tierIndex) => {
                                  const tierError = isEditing
                                    ? detailError.tierErrors?.[tier.id] || {}
                                    : {};
                                  const quantity = Number(tier.quantity);
                                  const productPrice = Number(tier.productPrice);
                                  const shippingCostValue = tier.shippingCost ?? null;
                                  const shippingCost =
                                    shippingCostValue === null || shippingCostValue === undefined
                                      ? null
                                      : Number(shippingCostValue);
                                  const totalPrice =
                                    Number.isFinite(quantity) &&
                                      Number.isFinite(productPrice) &&
                                      shippingCost !== null &&
                                      Number.isFinite(shippingCost)
                                      ? productPrice * quantity + shippingCost
                                      : null;
                                  const productPriceCurrency =
                                    tier.productPriceCurrency ?? tier.currency ?? null;
                                  const shippingCostCurrency =
                                    tier.shippingCostCurrency ?? tier.currency ?? null;
                                  const totalPriceCurrency = productPriceCurrency;

                                  return (
                                    <TableRow
                                      key={tier.id || `${detail.id || detailIndex}-${tierIndex}`}>
                                      <TableCell sx={{ fontWeight: 600 }}>
                                        {isEditing ? (
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
                                                tier.id || -(tierIndex + 1),
                                                'quantity',
                                                event.target.value
                                              )
                                            }
                                          />
                                        ) : (
                                          formatQuantity(tier.quantity)
                                        )}
                                      </TableCell>
                                      <TableCell align="right">
                                        {isEditing ? (
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
                                                tier.id || -(tierIndex + 1),
                                                'productPrice',
                                                event.target.value
                                              )
                                            }
                                          />
                                        ) : (
                                          formatPrice(productPrice, productPriceCurrency)
                                        )}
                                      </TableCell>
                                      <TableCell align="right">
                                        {isEditing ? (
                                          <TextField
                                            fullWidth
                                            size="small"
                                            type="number"
                                            value={tier.shippingCost ?? 0}
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
                                                tier.id || -(tierIndex + 1),
                                                'shippingCost',
                                                event.target.value
                                              )
                                            }
                                          />
                                        ) : (
                                          formatPrice(shippingCost, shippingCostCurrency)
                                        )}
                                      </TableCell>
                                      <TableCell align="right" sx={{ fontWeight: 700 }}>
                                        {formatPrice(totalPrice, totalPriceCurrency)}
                                      </TableCell>
                                    </TableRow>
                                  );
                                })}
                              </TableBody>
                            </Table>
                          </Stack>
                        </Box>
                      );
                    })
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      ยังไม่มีรายละเอียดราคา
                    </Typography>
                  )}

                  <Box>
                    <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
                      Additional Cost
                    </Typography>
                    {(isEditing ? quoteDraftAdditionalCosts : quote.additionalCosts)?.length ? (
                      <Stack spacing={0.75}>
                        {(isEditing ? quoteDraftAdditionalCosts : quote.additionalCosts).map(
                          (additionalCost, index) =>
                            isEditing ? (
                              <Grid
                                container
                                spacing={1}
                                key={additionalCost.id || `${additionalCost.description}-${index}`}>
                                <Grid item xs={12} md={5}>
                                  <TextField
                                    fullWidth
                                    size="small"
                                    label="Name"
                                    value={additionalCost.description}
                                    onChange={(event) =>
                                      onAdditionalCostChange(
                                        additionalCost.id || -(index + 1),
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
                                    value={additionalCost.value || ''}
                                    onChange={(event) =>
                                      onAdditionalCostChange(
                                        additionalCost.id || -(index + 1),
                                        'value',
                                        event.target.value
                                      )
                                    }
                                  />
                                </Grid>
                                <Grid item xs={12} md={3}>
                                  <TextField
                                    fullWidth
                                    size="small"
                                    label="Unit"
                                    value={additionalCost.unit || ''}
                                    onChange={(event) =>
                                      onAdditionalCostChange(
                                        additionalCost.id || -(index + 1),
                                        'unit',
                                        event.target.value
                                      )
                                    }
                                  />
                                </Grid>
                              </Grid>
                            ) : (
                              <Typography
                                key={additionalCost.id || `${additionalCost.description}-${index}`}
                                variant="body2">
                                {formatSupplierQuoteAdditionalCost(additionalCost) || '-'}
                              </Typography>
                            )
                        )}
                      </Stack>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        ไม่มี Additional Cost
                      </Typography>
                    )}
                  </Box>
                </Stack>
              </Box>
            );
          })
        ) : (
          <Box
            sx={{
              border: '1px dashed #cbd5e1',
              borderRadius: 3,
              py: 4,
              px: 2,
              textAlign: 'center',
              backgroundColor: '#f8fafc'
            }}>
            <Typography variant="body1" fontWeight={600}>
              ยังไม่มี supplier quote
            </Typography>
          </Box>
        )}
      </Stack>
    </Box>
  );
}
