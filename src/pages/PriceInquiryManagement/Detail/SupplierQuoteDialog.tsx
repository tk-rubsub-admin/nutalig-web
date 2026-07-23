import { Add, ContentCopy, DeleteOutline } from '@mui/icons-material';
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
import Paginate from 'components/Paginate';
import { ReactElement } from 'react';
import { SystemConfig } from 'services/Config/config-type';
import { LeadTimeConfig, Supplier } from 'services/Supplier/supplier-type';
import { RFQSupplierQuote } from 'services/RFQ/rfq-type';
import { blueActionButtonSx, outlinedActionButtonSx } from './supplierQuoteDialogStyles';

export interface SupplierQuoteDialogDetail {
  id: number;
  rfqDetailId?: number | null;
  optionName: string;
  spec: string;
  sortOrder: number;
  remark: string;
  packageName?: string;
  packageDimension?: string;
  packageWeight?: string;
  packageCapacity?: string;
  packages: SupplierQuoteDialogPackage[];
  tiers: Array<{
    id: number;
    quantity: number;
    productPrice: number;
    shippingCost: number;
    productPriceCurrency?: string | null;
    shippingCostCurrency?: string | null;
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

export interface SupplierQuoteDialogPackage {
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
  quoteSupplierSearchPagination?: {
    page: number;
    size: number;
    totalPage: number;
    totalRecords: number;
  };
  quoteSupplierSearchPage: number;
  quoteSupplierSearchPageSize: number;
  onQuoteSupplierSearchPageChange: (page: number) => void;
  onQuoteSupplierSearchPageSizeChange: (pageSize: number) => void;
  onQuoteSupplierSearchRefetch: () => void;
  onOpenNewSupplierDialog: () => void;
  onOpenExtractSupplierQuoteDialog: () => void;
  currencyOptions: SystemConfig[];
  leadTimeOptions: LeadTimeConfig[];
  latestSupplierQuoteBySupplierId: Record<string, RFQSupplierQuote | null>;
  supplierQuoteRevisionCountBySupplierId: Record<string, number>;
  onSelectSupplier: (supplier: Supplier) => void;
  onChangeSupplier: () => void;
  quoteDraftDetails: SupplierQuoteDialogDetail[];
  quoteDraftAdditionalCosts: Array<{
    id: number;
    description: string;
    value: string;
    unit: string;
  }>;
  quoteDraftPackages: SupplierQuoteDialogPackage[];
  quoteDraftLeadTimes: Array<{
    id: number;
    leadTimeCode: string;
    leadTimeDayMin: string;
    leadTimeDayMax: string;
    remark: string;
  }>;
  quoteDraftPackageError: string | null;
  quoteDraftErrors: Record<number, any>;
  quoteDraftLeadTimeErrors: Record<number, any>;
  onAddDetail: () => void;
  onCopyDetail: (detailId: number) => void;
  onDeleteDetail: (detailId: number) => void;
  onDetailChange: (
    detailId: number,
    field: 'optionName' | 'spec' | 'remark',
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
  onAddTier: (detailId: number) => void;
  onTierChange: (
    detailId: number,
    tierId: number,
    field:
      | 'quantity'
      | 'productPrice'
      | 'shippingCost'
      | 'productPriceCurrency'
      | 'shippingCostCurrency',
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
  onAddLeadTime: () => void;
  onLeadTimeChange: (
    leadTimeId: number,
    field: 'leadTimeCode' | 'leadTimeDayMin' | 'leadTimeDayMax' | 'remark',
    value: string
  ) => void;
  onDeleteLeadTime: (leadTimeId: number) => void;
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
    quoteSupplierSearchPagination,
    quoteSupplierSearchPage,
    quoteSupplierSearchPageSize,
    onQuoteSupplierSearchPageChange,
    onQuoteSupplierSearchPageSizeChange,
    onQuoteSupplierSearchRefetch,
    onOpenNewSupplierDialog,
    onOpenExtractSupplierQuoteDialog,
    currencyOptions,
    leadTimeOptions,
    latestSupplierQuoteBySupplierId,
    supplierQuoteRevisionCountBySupplierId,
    onSelectSupplier,
    onChangeSupplier,
    quoteDraftDetails,
    quoteDraftAdditionalCosts,
    quoteDraftPackages,
    quoteDraftLeadTimes,
    quoteDraftPackageError,
    quoteDraftErrors,
    quoteDraftLeadTimeErrors,
    onAddDetail,
    onCopyDetail,
    onDeleteDetail,
    onDetailChange,
    onAddPackage,
    onPackageChange,
    onDeletePackage,
    onAddTier,
    onTierChange,
    onDeleteTier,
    onAddAdditionalCost,
    onAdditionalCostChange,
    onDeleteAdditionalCost,
    onAddLeadTime,
    onLeadTimeChange,
    onDeleteLeadTime,
    onSave,
    onClose,
    isSubmitting,
    t
  } = props;
  const getLeadTimeOptionLabel = (option: LeadTimeConfig) =>
    option.nameTh || option.nameEn || option.code;
  const isLeadTimeOptionDisabled = (optionCode: string, currentLeadTimeId: number) =>
    quoteDraftLeadTimes.some(
      (leadTime) => leadTime.id !== currentLeadTimeId && leadTime.leadTimeCode === optionCode
    );

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
                    className="btn-indigo-blue"
                    onClick={onQuoteSupplierSearch}>
                    ค้นหา
                  </Button>
                  <Button
                    variant="contained"
                    className="btn-emerald-green"
                    sx={{ whiteSpace: 'nowrap', minWidth: 'fit-content', flexShrink: 0 }}
                    onClick={onOpenNewSupplierDialog}>
                    สร้างใหม่
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
                        ? latestSupplierQuoteBySupplierId[supplierId]
                        : null;
                      const revisionCount = supplierId
                        ? supplierQuoteRevisionCountBySupplierId[supplierId] || 0
                        : 0;

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
                              {existingQuote ? (
                                <Typography variant="caption" color="text.secondary">
                                  revision ล่าสุด: #{existingQuote.revisionNo || 1}
                                  {revisionCount > 1 ? ` (${revisionCount} revisions)` : ''}
                                </Typography>
                              ) : null}
                            </Box>
                            <Button
                              variant="contained"
                              sx={blueActionButtonSx}
                              onClick={() => onSelectSupplier(item)}>
                              {existingQuote ? 'สร้าง revision ใหม่' : 'เลือก'}
                            </Button>
                          </Stack>
                        </Box>
                      );
                    })}
                    {quoteSupplierSearchPagination ? (
                      <Paginate
                        pagination={quoteSupplierSearchPagination}
                        page={quoteSupplierSearchPage}
                        pageSize={quoteSupplierSearchPageSize}
                        setPage={onQuoteSupplierSearchPageChange}
                        setPageSize={onQuoteSupplierSearchPageSizeChange}
                        refetch={onQuoteSupplierSearchRefetch}
                        totalRecords={quoteSupplierSearchPagination.totalRecords}
                        isShow={true}
                      />
                    ) : null}
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
                      className="btn-pastel-green"
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
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                    <Button
                      variant="contained"
                      size="small"
                      className="btn-indigo-blue"
                      sx={{ whiteSpace: 'nowrap' }}
                      onClick={onOpenExtractSupplierQuoteDialog}>
                      แปลงจากข้อความ
                    </Button>
                    <Button
                      variant="contained"
                      size="small"
                      startIcon={<Add />}
                      sx={outlinedActionButtonSx}
                      onClick={onAddDetail}>
                      เพิ่มรายการ
                    </Button>
                  </Stack>
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
                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                          <Typography variant="subtitle1" fontWeight={700}>
                            Option {detail.sortOrder}
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
                              multiline
                              minRows={3}
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
                              <TableCell>สกุลเงิน</TableCell>
                              <TableCell>ค่าขนส่ง</TableCell>
                              <TableCell>สกุลเงิน</TableCell>
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
                                        select
                                        size="small"
                                        value={tier.productPriceCurrency || tier.currency || ''}
                                        onChange={(event) =>
                                          onTierChange(
                                            detail.id,
                                            tier.id,
                                            'productPriceCurrency',
                                            event.target.value
                                          )
                                        }>
                                        {currencyOptions.map((currencyOption) => (
                                          <MenuItem
                                            key={`product-${currencyOption.code}`}
                                            value={currencyOption.code}>
                                            {currencyOption.code}
                                          </MenuItem>
                                        ))}
                                      </TextField>
                                    </TableCell>
                                    <TableCell>
                                      <TextField
                                        fullWidth
                                        size="small"
                                        type="number"
                                        value={tier.shippingCost}
                                        error={Boolean(tierError.shippingCost)}
                                        helperText={tierError.shippingCost}
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
                                    <TableCell>
                                      <TextField
                                        fullWidth
                                        select
                                        size="small"
                                        value={tier.shippingCostCurrency || tier.currency || ''}
                                        onChange={(event) =>
                                          onTierChange(
                                            detail.id,
                                            tier.id,
                                            'shippingCostCurrency',
                                            event.target.value
                                          )
                                        }>
                                        {currencyOptions.map((currencyOption) => (
                                          <MenuItem
                                            key={`shipping-${currencyOption.code}`}
                                            value={currencyOption.code}>
                                            {currencyOption.code}
                                          </MenuItem>
                                        ))}
                                      </TextField>
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
                                <TableCell colSpan={6} align="center">
                                  <Typography variant="body2" color="text.secondary">
                                    ยังไม่มีข้อมูล Tier
                                  </Typography>
                                </TableCell>
                              </TableRow>
                            )}
                          </TableBody>
                        </Table>
                      </Stack>
                    </Box>
                  );
                })}
              </Stack>

              <Stack spacing={1.5}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="subtitle1" fontWeight={700}>
                    Packing List
                  </Typography>
                  <Button
                    size="small"
                    variant="contained"
                    startIcon={<Add />}
                    sx={outlinedActionButtonSx}
                    onClick={onAddPackage}>
                    เพิ่ม Packing List
                  </Button>
                </Stack>
                {quoteDraftPackageError ? (
                  <Typography variant="caption" color="error">
                    {quoteDraftPackageError}
                  </Typography>
                ) : null}
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>ชื่อ Package</TableCell>
                      <TableCell>กว้าง</TableCell>
                      <TableCell>ยาว</TableCell>
                      <TableCell>สูง</TableCell>
                      <TableCell>1 กล่อง ขนาดกี่ kg</TableCell>
                      <TableCell>1 กล่องบรรจุจำนวนกี่ชิ้น</TableCell>
                      <TableCell align="center">จัดการ</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {quoteDraftPackages.length ? (
                      quoteDraftPackages.map((packageItem) => (
                        <TableRow key={packageItem.id}>
                          <TableCell>
                            <TextField
                              fullWidth
                              size="small"
                              value={packageItem.packageName || ''}
                              InputLabelProps={{ shrink: true }}
                              onChange={(event) =>
                                onPackageChange(packageItem.id, 'packageName', event.target.value)
                              }
                            />
                          </TableCell>
                          <TableCell>
                            <TextField
                              fullWidth
                              size="small"
                              value={packageItem.packageWidth || ''}
                              InputLabelProps={{ shrink: true }}
                              InputProps={{
                                endAdornment: <InputAdornment position="end">cm</InputAdornment>
                              }}
                              onChange={(event) =>
                                onPackageChange(packageItem.id, 'packageWidth', event.target.value)
                              }
                            />
                          </TableCell>
                          <TableCell>
                            <TextField
                              fullWidth
                              size="small"
                              value={packageItem.packageLength || ''}
                              InputLabelProps={{ shrink: true }}
                              InputProps={{
                                endAdornment: <InputAdornment position="end">cm</InputAdornment>
                              }}
                              onChange={(event) =>
                                onPackageChange(packageItem.id, 'packageLength', event.target.value)
                              }
                            />
                          </TableCell>
                          <TableCell>
                            <TextField
                              fullWidth
                              size="small"
                              value={packageItem.packageHeight || ''}
                              InputLabelProps={{ shrink: true }}
                              InputProps={{
                                endAdornment: <InputAdornment position="end">cm</InputAdornment>
                              }}
                              onChange={(event) =>
                                onPackageChange(packageItem.id, 'packageHeight', event.target.value)
                              }
                            />
                          </TableCell>
                          <TableCell>
                            <TextField
                              fullWidth
                              size="small"
                              value={packageItem.packageWeight || ''}
                              InputLabelProps={{ shrink: true }}
                              InputProps={{
                                endAdornment: <InputAdornment position="end">kg</InputAdornment>
                              }}
                              onChange={(event) =>
                                onPackageChange(packageItem.id, 'packageWeight', event.target.value)
                              }
                            />
                          </TableCell>
                          <TableCell>
                            <TextField
                              fullWidth
                              size="small"
                              value={packageItem.packageCapacity || ''}
                              InputLabelProps={{ shrink: true }}
                              InputProps={{
                                endAdornment: <InputAdornment position="end">ชิ้น</InputAdornment>
                              }}
                              onChange={(event) =>
                                onPackageChange(packageItem.id, 'packageCapacity', event.target.value)
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
              </Stack>

              <Stack spacing={2}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="subtitle1" fontWeight={700}>
                    รายละเอียดเพิ่มเติม
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

              <Stack spacing={2}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="subtitle1" fontWeight={700}>
                    Lead Time
                  </Typography>
                  <Button
                    variant="contained"
                    size="small"
                    startIcon={<Add />}
                    sx={outlinedActionButtonSx}
                    onClick={onAddLeadTime}>
                    เพิ่ม Lead Time
                  </Button>
                </Stack>
                {quoteDraftLeadTimes.map((leadTime) => {
                  const leadTimeError = quoteDraftLeadTimeErrors[leadTime.id] || {};
                  return (
                    <Box
                      key={leadTime.id}
                      sx={{
                        border: '1px solid #dce4ee',
                        borderRadius: 2,
                        p: 1.5,
                        backgroundColor: '#fff'
                      }}>
                      <Grid container spacing={1}>
                        <Grid item xs={12} md={3}>
                          <TextField
                            fullWidth
                            size="small"
                            select
                            label="Lead Time Code"
                            value={leadTime.leadTimeCode}
                            error={Boolean(leadTimeError.leadTimeCode)}
                            helperText={leadTimeError.leadTimeCode}
                            InputLabelProps={{ shrink: true }}
                            onChange={(event) =>
                              onLeadTimeChange(leadTime.id, 'leadTimeCode', event.target.value)
                            }>
                            {leadTimeOptions.map((option) => (
                              <MenuItem
                                key={option.code}
                                value={option.code}
                                disabled={isLeadTimeOptionDisabled(option.code, leadTime.id)}>
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
                            value={leadTime.leadTimeDayMin}
                            error={Boolean(leadTimeError.leadTimeDayMin)}
                            helperText={leadTimeError.leadTimeDayMin}
                            InputLabelProps={{ shrink: true }}
                            onChange={(event) =>
                              onLeadTimeChange(leadTime.id, 'leadTimeDayMin', event.target.value)
                            }
                          />
                        </Grid>
                        <Grid item xs={12} md={2}>
                          <TextField
                            fullWidth
                            size="small"
                            type="number"
                            label="วันสิ้นสุด"
                            value={leadTime.leadTimeDayMax}
                            error={Boolean(leadTimeError.leadTimeDayMax)}
                            helperText={leadTimeError.leadTimeDayMax}
                            InputLabelProps={{ shrink: true }}
                            onChange={(event) =>
                              onLeadTimeChange(leadTime.id, 'leadTimeDayMax', event.target.value)
                            }
                          />
                        </Grid>
                        <Grid item xs={12} md={4}>
                          <TextField
                            fullWidth
                            size="small"
                            label="Remark"
                            value={leadTime.remark}
                            InputLabelProps={{ shrink: true }}
                            onChange={(event) =>
                              onLeadTimeChange(leadTime.id, 'remark', event.target.value)
                            }
                          />
                        </Grid>
                        <Grid item xs={12} md={1}>
                          <Stack alignItems={{ xs: 'flex-start', md: 'center' }} sx={{ pt: { md: 0.5 } }}>
                            <IconButton
                              size="small"
                              onClick={() => onDeleteLeadTime(leadTime.id)}
                              sx={{ color: '#c62828' }}>
                              <DeleteOutline fontSize="small" />
                            </IconButton>
                          </Stack>
                        </Grid>
                      </Grid>
                    </Box>
                  );
                })}
              </Stack>
            </>
          ) : null}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button className="btn-crimson-red" variant="contained" onClick={onClose}>
          {t('button.close')}
        </Button>
        <Button
          variant="contained"
          className="btn-emerald-green"
          disabled={isSubmitting || !supplier}
          onClick={onSave}>
          {t('button.save')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
