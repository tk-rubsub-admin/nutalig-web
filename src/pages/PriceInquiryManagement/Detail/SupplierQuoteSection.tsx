import {
  Add,
  ContentCopy,
  DeleteOutline,
  Edit,
  ExpandLess,
  ExpandMore,
  NotificationsActive
} from '@mui/icons-material';
import {
  Box,
  Button,
  Chip,
  Collapse,
  Grid,
  Divider,
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
  Typography
} from '@mui/material';
import { ReactElement, useEffect, useState } from 'react';
import {
  RFQSupplierQuote,
  RFQSupplierQuoteAdditionalCost,
  RFQSupplierQuoteLeadTime
} from 'services/RFQ/rfq-type';
import { LeadTimeConfig } from 'services/Supplier/supplier-type';
import { outlinedActionButtonSx } from './supplierQuoteDialogStyles';
import { SupplierQuoteDialogDetail } from './SupplierQuoteDialog';

interface SupplierQuoteDraftAdditionalCost {
  id: number;
  description: string;
  value: string;
  unit: string;
}

interface SupplierQuoteDraftPackage {
  id: number;
  packageName?: string;
  packageDimension?: string;
  packageWidth?: string;
  packageLength?: string;
  packageHeight?: string;
  packageWeight?: string;
  packageCapacity?: string;
  sortOrder: number;
}

interface SupplierQuoteDraftLeadTime {
  id: number;
  leadTimeCode: string;
  leadTimeDayMin: string;
  leadTimeDayMax: string;
  remark: string;
}

interface SupplierQuoteSectionProps {
  quotes: RFQSupplierQuote[];
  editingQuoteId: string | null;
  quoteDraftDetails: SupplierQuoteDialogDetail[];
  quoteDraftPackages: SupplierQuoteDraftPackage[];
  quoteDraftAdditionalCosts: SupplierQuoteDraftAdditionalCost[];
  quoteDraftLeadTimes: SupplierQuoteDraftLeadTime[];
  quoteDraftPackageError: string | null;
  quoteDraftErrors: Record<number, any>;
  quoteDraftLeadTimeErrors: Record<number, any>;
  isSubmitting: boolean;
  notifyingQuoteId: string | null;
  onEditQuote: (quote: RFQSupplierQuote) => void;
  onCreateRevision: (quote: RFQSupplierQuote) => void;
  onSendNotification: (quote: RFQSupplierQuote) => void;
  onCancelEditQuote: () => void;
  onSaveEditQuote: () => void;
  onCopyDetail: (detailId: number) => void;
  onDeleteDetail: (detailId: number) => void;
  onDetailChange: (
    detailId: number,
    field:
      | 'optionName'
      | 'spec'
      | 'remark',
    value: string
  ) => void;
  onAddPackage: () => void;
  onPackageChange: (
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
  onDeletePackage: (packageId: number) => void;
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
  onAddLeadTime: () => void;
  onLeadTimeChange: (
    leadTimeId: number,
    field: 'leadTimeCode' | 'leadTimeDayMin' | 'leadTimeDayMax' | 'remark',
    value: string
  ) => void;
  onDeleteLeadTime: (leadTimeId: number) => void;
  leadTimeOptions: LeadTimeConfig[];
  formatQuantity: (value?: number | null) => string;
  formatPrice: (value?: number | null, currency?: string | null) => string;
  formatSupplierQuoteAdditionalCost: (additionalCost: RFQSupplierQuoteAdditionalCost) => string;
  formatSupplierQuoteLeadTime: (leadTime: RFQSupplierQuoteLeadTime) => string;
  getSupplierDisplayName: (supplier?: RFQSupplierQuote['supplier'] | null) => string;
}

export function SupplierQuoteSection(props: SupplierQuoteSectionProps): ReactElement {
  const {
    quotes,
    editingQuoteId,
    quoteDraftDetails,
    quoteDraftPackages,
    quoteDraftAdditionalCosts,
    quoteDraftLeadTimes,
    quoteDraftPackageError,
    quoteDraftErrors,
    quoteDraftLeadTimeErrors,
    isSubmitting,
    notifyingQuoteId,
    onEditQuote,
    onCreateRevision,
    onSendNotification,
    onCancelEditQuote,
    onSaveEditQuote,
    onCopyDetail,
    onDeleteDetail,
    onDetailChange,
    onAddPackage,
    onPackageChange,
    onDeletePackage,
    onTierChange,
    onAdditionalCostChange,
    onAddLeadTime,
    onLeadTimeChange,
    onDeleteLeadTime,
    leadTimeOptions,
    formatQuantity,
    formatPrice,
    formatSupplierQuoteAdditionalCost,
    formatSupplierQuoteLeadTime,
    getSupplierDisplayName
  } = props;
  const [expandedQuoteIds, setExpandedQuoteIds] = useState<Record<string, boolean>>({});
  const getLeadTimeOptionLabel = (option: LeadTimeConfig) =>
    option.nameTh || option.nameEn || option.code;
  const isLeadTimeOptionDisabled = (optionCode: string, currentLeadTimeId: number) =>
    quoteDraftLeadTimes.some(
      (leadTime) => leadTime.id !== currentLeadTimeId && leadTime.leadTimeCode === optionCode
    );

  useEffect(() => {
    setExpandedQuoteIds((prev) => {
      const next = { ...prev };
      quotes.forEach((quote) => {
        if (next[quote.id] === undefined) {
          next[quote.id] = true;
        }
      });
      return next;
    });
  }, [quotes]);

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
            const isExpanded = expandedQuoteIds[quote.id] !== false;

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
                        <Chip
                          size="small"
                          label={`Rev. ${quote.revisionNo || 1}`}
                          sx={{
                            backgroundColor: '#eff6ff',
                            color: '#1d4ed8',
                            border: '1px solid #bfdbfe',
                            fontWeight: 700
                          }}
                        />
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
                      {!isEditing ? (
                        <Button
                          variant="contained"
                          size="small"
                          startIcon={<NotificationsActive />}
                          sx={outlinedActionButtonSx}
                          disabled={isSubmitting || notifyingQuoteId === quote.id}
                          onClick={() => onSendNotification(quote)}>
                          ส่งแจ้งเตือน
                        </Button>
                      ) : null}
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
                        <>
                          <Button
                            variant="contained"
                            size="small"
                            startIcon={<Add />}
                            sx={outlinedActionButtonSx}
                            disabled={isSubmitting}
                            onClick={() => onCreateRevision(quote)}>
                            สร้าง revision
                          </Button>
                          <Button
                            variant="contained"
                            size="small"
                            startIcon={<Edit />}
                            sx={outlinedActionButtonSx}
                            disabled={isSubmitting}
                            onClick={() => onEditQuote(quote)}>
                            แก้ไขราคา
                          </Button>
                        </>
                      )}
                      <Button
                        variant="text"
                        size="small"
                        endIcon={isExpanded ? <ExpandLess /> : <ExpandMore />}
                        onClick={() =>
                          setExpandedQuoteIds((prev) => ({
                            ...prev,
                            [quote.id]: !isExpanded
                          }))
                        } />
                    </Stack>
                  </Stack>
                  <Collapse in={isExpanded} timeout="auto" unmountOnExit={false}>
                    <Stack spacing={2}>
                      <Divider />
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
                                      <Grid item xs={12}>
                                        <Stack
                                          direction="row"
                                          justifyContent="space-between"
                                          alignItems="center">
                                          <Typography variant="subtitle2" fontWeight={700}>
                                            Option {detail.sortOrder || detailIndex + 1}
                                          </Typography>
                                          <Stack direction="row" spacing={0.5}>
                                            <IconButton
                                              size="small"
                                              onClick={() => onCopyDetail(detail.id)}
                                              sx={{ color: '#1565c0' }}>
                                              <ContentCopy fontSize="small" />
                                            </IconButton>
                                            {quoteDraftDetails.length > 1 ? (
                                              <IconButton
                                                size="small"
                                                onClick={() => onDeleteDetail(detail.id)}
                                                sx={{ color: '#c62828' }}>
                                                <DeleteOutline fontSize="small" />
                                              </IconButton>
                                            ) : null}
                                          </Stack>
                                        </Stack>
                                      </Grid>
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
                                          multiline
                                          minRows={3}
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
                        <Stack
                          direction="row"
                          justifyContent="space-between"
                          alignItems="center"
                          sx={{ mb: 1 }}>
                          <Typography variant="subtitle2" fontWeight={700}>
                            Packing List
                          </Typography>
                          {isEditing ? (
                            <Button
                              size="small"
                              variant="contained"
                              startIcon={<Add />}
                              sx={outlinedActionButtonSx}
                              onClick={onAddPackage}>
                              เพิ่ม Packing List
                            </Button>
                          ) : null}
                        </Stack>
                        {isEditing && quoteDraftPackageError ? (
                          <Typography variant="caption" color="error">
                            {quoteDraftPackageError}
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
                              {quoteDraftPackages.map((packageItem) => (
                                <TableRow key={packageItem.id}>
                                  <TableCell>
                                    <TextField
                                      fullWidth
                                      size="small"
                                      value={packageItem.packageName || ''}
                                      onChange={(event) =>
                                        onPackageChange(
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
                                      onClick={() => onDeletePackage(packageItem.id)}
                                      sx={{ color: '#c62828' }}>
                                      <DeleteOutline fontSize="small" />
                                    </IconButton>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        ) : quote.packages?.length ? (
                          <Stack spacing={0.75}>
                            {quote.packages.map((packageItem, index) => (
                              <Typography
                                key={packageItem.id || `${packageItem.packageName}-${index}`}
                                variant="body2">
                                {[
                                  packageItem.packageName,
                                  packageItem.packageDimension,
                                  packageItem.packageWeight,
                                  packageItem.packageCapacity
                                ]
                                  .filter(Boolean)
                                  .join(' ') || '-'}
                              </Typography>
                            ))}
                          </Stack>
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            ไม่มี Packing List
                          </Typography>
                        )}
                      </Box>

                      <Box>
                        <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
                          รายละเอียดเพิ่มเติม
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
                            ไม่มีรายละเอียดเพิ่มเติม
                          </Typography>
                        )}
                      </Box>

                      <Box>
                        <Stack
                          direction="row"
                          justifyContent="space-between"
                          alignItems="center"
                          sx={{ mb: 1 }}>
                          <Typography variant="subtitle2" fontWeight={700}>
                            Lead Time
                          </Typography>
                          {isEditing ? (
                            <Button
                              size="small"
                              variant="contained"
                              startIcon={<Add />}
                              sx={outlinedActionButtonSx}
                              onClick={onAddLeadTime}>
                              เพิ่ม Lead Time
                            </Button>
                          ) : null}
                        </Stack>
                        {(isEditing ? quoteDraftLeadTimes : quote.leadTimes)?.length ? (
                          <Stack spacing={0.75}>
                            {(isEditing ? quoteDraftLeadTimes : quote.leadTimes || []).map(
                              (leadTime, index) =>
                                isEditing ? (
                                  <Grid
                                    container
                                    spacing={1}
                                    key={leadTime.id || `${leadTime.leadTimeCode}-${index}`}>
                                    <Grid item xs={12} md={3}>
                                      <TextField
                                        fullWidth
                                        size="small"
                                        select
                                        label="Lead Time Code"
                                        value={leadTime.leadTimeCode}
                                        InputLabelProps={{ shrink: true }}
                                        error={Boolean(
                                          quoteDraftLeadTimeErrors[leadTime.id || -(index + 1)]
                                            ?.leadTimeCode
                                        )}
                                        helperText={
                                          quoteDraftLeadTimeErrors[leadTime.id || -(index + 1)]
                                            ?.leadTimeCode
                                        }
                                        onChange={(event) =>
                                          onLeadTimeChange(
                                            leadTime.id || -(index + 1),
                                            'leadTimeCode',
                                            event.target.value
                                          )
                                        }>
                                        {leadTimeOptions.map((option) => (
                                          <MenuItem
                                            key={option.code}
                                            value={option.code}
                                            disabled={isLeadTimeOptionDisabled(
                                              option.code,
                                              leadTime.id || -(index + 1)
                                            )}>
                                            {getLeadTimeOptionLabel(option)}
                                          </MenuItem>
                                        ))}
                                      </TextField>
                                    </Grid>
                                    <Grid item xs={12} md={2}>
                                      <TextField
                                        fullWidth
                                        size="small"
                                        type="number"
                                        label="วันเริ่มต้น"
                                        InputLabelProps={{ shrink: true }}
                                        value={leadTime.leadTimeDayMin || ''}
                                        error={Boolean(
                                          quoteDraftLeadTimeErrors[leadTime.id || -(index + 1)]
                                            ?.leadTimeDayMin
                                        )}
                                        helperText={
                                          quoteDraftLeadTimeErrors[leadTime.id || -(index + 1)]
                                            ?.leadTimeDayMin
                                        }
                                        onChange={(event) =>
                                          onLeadTimeChange(
                                            leadTime.id || -(index + 1),
                                            'leadTimeDayMin',
                                            event.target.value
                                          )
                                        }
                                      />
                                    </Grid>
                                    <Grid item xs={12} md={2}>
                                      <TextField
                                        fullWidth
                                        size="small"
                                        type="number"
                                        label="วันสิ้นสุด"
                                        InputLabelProps={{ shrink: true }}
                                        value={leadTime.leadTimeDayMax || ''}
                                        error={Boolean(
                                          quoteDraftLeadTimeErrors[leadTime.id || -(index + 1)]
                                            ?.leadTimeDayMax
                                        )}
                                        helperText={
                                          quoteDraftLeadTimeErrors[leadTime.id || -(index + 1)]
                                            ?.leadTimeDayMax
                                        }
                                        onChange={(event) =>
                                          onLeadTimeChange(
                                            leadTime.id || -(index + 1),
                                            'leadTimeDayMax',
                                            event.target.value
                                          )
                                        }
                                      />
                                    </Grid>
                                    <Grid item xs={12} md={4}>
                                      <TextField
                                        fullWidth
                                        size="small"
                                        label="Remark"
                                        InputLabelProps={{ shrink: true }}
                                        value={leadTime.remark || ''}
                                        onChange={(event) =>
                                          onLeadTimeChange(
                                            leadTime.id || -(index + 1),
                                            'remark',
                                            event.target.value
                                          )
                                        }
                                      />
                                    </Grid>
                                    <Grid item xs={12} md={1}>
                                      <IconButton
                                        size="small"
                                        onClick={() =>
                                          onDeleteLeadTime(leadTime.id || -(index + 1))
                                        }
                                        sx={{ color: '#c62828' }}>
                                        <DeleteOutline fontSize="small" />
                                      </IconButton>
                                    </Grid>
                                  </Grid>
                                ) : (
                                  <Typography
                                    key={leadTime.id || `${leadTime.leadTimeCode}-${index}`}
                                    variant="body2">
                                    {formatSupplierQuoteLeadTime(leadTime) || '-'}
                                  </Typography>
                                )
                            )}
                          </Stack>
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            ไม่มี Lead Time
                          </Typography>
                        )}
                      </Box>
                    </Stack>
                  </Collapse>
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
