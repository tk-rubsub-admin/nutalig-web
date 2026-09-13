import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  TextField,
  Typography,
  useMediaQuery,
  useTheme
} from '@mui/material';
import { CheckCircleOutline, Close } from '@mui/icons-material';
import { makeStyles } from '@mui/styles';
import PageTitle from 'components/PageTitle';
import Paginate from 'components/Paginate';
import { TextLineClamp, Wrapper } from 'components/Styled';
import dayjs from 'dayjs';
import { ReactElement, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { useQuery } from 'react-query';
import { useHistory } from 'react-router-dom';
import { isMobileOnly } from 'react-device-detect';
import { ROUTE_PATHS } from 'routes';
import {
  approveUrgentRFQ,
  approveRFQCustomerTransfer,
  rejectUrgentRFQ,
  rejectRFQCustomerTransfer
} from 'services/RFQ/rfq-api';
import {
  getPendingRfqCustomerTransferApprovals,
  getPendingUrgentRfqApprovals
} from 'services/Approval/approval-api';
import {
  approveUrgentSalesOrder,
  rejectUrgentSalesOrder,
  searchSalesOrdersV1
} from 'services/SaleOrder/sale-order-api';
import { SalesOrderV1, SearchSalesOrderRequestV1 } from 'services/SaleOrder/sale-order-type';

type UrgentApprovalItemType = 'RFQ' | 'RFQ_CUSTOMER_TRANSFER' | 'SALES_ORDER';

interface UrgentApprovalItem {
  type: UrgentApprovalItemType;
  id: string;
  typeLabel: string;
  statusLabel: string;
  requestedAt: string | null;
  customerLabel: string;
  ownerLabel: string;
  reason: string;
  rowSx: any;
}

function getSalesOrderCustomerLabel(salesOrder?: SalesOrderV1 | null): string {
  return salesOrder?.customer?.customerName || '-';
}

function getSalesOrderOwnerLabel(salesOrder?: SalesOrderV1 | null): string {
  const sales = salesOrder?.saleAccount as any;
  if (!sales) {
    return '-';
  }

  const name = [sales.firstNameTh || sales.firstName, sales.lastNameTh || sales.lastName]
    .filter(Boolean)
    .join(' ');

  return sales.nickName || sales.nickname || sales.displayName || name || sales.employeeId || '-';
}

function getSalesOrderProcurementLabel(salesOrder?: SalesOrderV1 | null): string {
  switch (salesOrder?.procurementStatus) {
    case 'NOT_READY':
      return 'ยังไม่พร้อมสร้าง PO';
    case 'READY_FOR_PO':
      return 'พร้อมสร้าง PO';
    case 'READY_FOR_PO_OVERRIDE':
      return 'พร้อมสร้าง PO (Override)';
    case 'PO_CREATED':
      return 'สร้าง PO แล้ว';
    default:
      return salesOrder?.procurementStatus || '-';
  }
}

function getUrgentDateValue(value?: string | null): number {
  if (!value) {
    return 0;
  }

  const parsed = dayjs(value);
  return parsed.isValid() ? parsed.valueOf() : 0;
}

function buildUrgentApprovalItemLabel(type: UrgentApprovalItemType): string {
  return type === 'SALES_ORDER' ? 'ใบสั่งซื้อ' : 'คำขอราคา';
}

function buildUrgentApprovalStatusLabel(type: UrgentApprovalItemType): string {
  return type === 'RFQ_CUSTOMER_TRANSFER'
    ? 'รออนุมัติย้ายลูกค้า'
    : type === 'RFQ'
      ? 'รออนุมัติเร่งด่วน'
      : 'รออนุมัติสร้างใบสั่งซื้อ';
}

function buildUrgentApprovalRowSx(type: UrgentApprovalItemType) {
  return {
    cursor: 'pointer',
    backgroundColor: type === 'RFQ' ? '#f8fbff' : '#fffaf0',
    '&:hover': {
      backgroundColor: type === 'RFQ' ? '#eef6ff' : '#fff3df'
    }
  };
}

function buildUrgentApprovalTypeChipSx(type: UrgentApprovalItemType) {
  return {
    backgroundColor: type === 'RFQ' ? '#ecfeff' : '#eef2ff',
    color: type === 'RFQ' ? '#0f766e' : '#4338ca',
    fontWeight: 700
  };
}

function buildUrgentApprovalStatusChipSx(type: UrgentApprovalItemType) {
  return {
    backgroundColor: type === 'RFQ' ? '#e8f5e9' : '#e0f2fe',
    color: type === 'RFQ' ? '#2e7d32' : '#0369a1',
    fontWeight: 700
  };
}

export default function UrgentApprovalManagement(): ReactElement {
  const useStyles = makeStyles({
    noResultMessage: {
      textAlign: 'center',
      fontSize: '1.2em',
      fontWeight: 'bold',
      padding: '48px 0'
    },
    tableHeader: {
      border: '2px solid #e0e0e0',
      fontWeight: 'bold',
      paddingLeft: '10px',
      textAlign: 'center'
    }
  });

  const classes = useStyles();
  const theme = useTheme();
  const isDownSm = useMediaQuery(theme.breakpoints.down('sm'));
  const { t } = useTranslation();
  const history = useHistory();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(100);
  const [urgentDialogMode, setUrgentDialogMode] = useState<'APPROVE' | 'REJECT' | null>(null);
  const [urgentDialogTarget, setUrgentDialogTarget] = useState<UrgentApprovalItem | null>(null);
  const [urgentDialogReason, setUrgentDialogReason] = useState('');
  const fetchSize = page * pageSize;
  const salesOrderSearchRequest = useMemo<SearchSalesOrderRequestV1>(
    () => ({
      urgentRequestStatus: 'PENDING_APPROVAL'
    }),
    []
  );

  const {
    data: rfqApprovals = [],
    refetch: refetchRfq,
    isFetching: isRfqFetching
  } = useQuery(['urgent-approval-rfq-list'], getPendingUrgentRfqApprovals, {
    refetchOnWindowFocus: false,
    keepPreviousData: true
  });
  const { data: customerTransferApprovals = [], refetch: refetchCustomerTransfers } = useQuery(
    ['rfq-customer-transfer-approval-list'],
    getPendingRfqCustomerTransferApprovals,
    { refetchOnWindowFocus: false }
  );

  const {
    data: salesOrderResponse,
    refetch: refetchSalesOrders,
    isFetching: isSalesOrderFetching
  } = useQuery(
    ['urgent-approval-sales-order-list', fetchSize],
    () =>
      searchSalesOrdersV1(salesOrderSearchRequest, 1, fetchSize, {
        sortBy: 'urgentRequestedDate',
        sortDirection: 'DESC'
      }),
    { refetchOnWindowFocus: false, keepPreviousData: true }
  );

  const totalRecords = rfqApprovals.length + (salesOrderResponse?.pagination?.totalRecords || 0);
  const totalPage = Math.max(1, Math.ceil(totalRecords / pageSize));
  const isFetching = isRfqFetching || isSalesOrderFetching;

  useEffect(() => {
    if (page > totalPage) {
      setPage(totalPage);
    }
  }, [page, totalPage]);

  const handleOpenDetail = (item: UrgentApprovalItem) => {
    history.push({
      pathname:
        item.type === 'RFQ_CUSTOMER_TRANSFER'
          ? ROUTE_PATHS.RFQ_DETAIL.replace(':id', item.id)
          : item.type === 'RFQ'
            ? ROUTE_PATHS.PRICE_INQUIRY.replace(':id', item.id)
            : ROUTE_PATHS.SALE_ORDER_DETAIL.replace(':id', item.id),
      state: {
        returnToList: {
          page,
          pageSize
        }
      }
    });
  };

  const handleApproveUrgent = (item: UrgentApprovalItem) => {
    setUrgentDialogMode('APPROVE');
    setUrgentDialogTarget(item);
    setUrgentDialogReason('');
  };

  const handleRejectUrgent = (item: UrgentApprovalItem) => {
    setUrgentDialogMode('REJECT');
    setUrgentDialogTarget(item);
    setUrgentDialogReason('');
  };

  const handleCloseUrgentDialog = () => {
    setUrgentDialogMode(null);
    setUrgentDialogTarget(null);
    setUrgentDialogReason('');
  };

  const handleConfirmUrgentAction = async () => {
    if (!urgentDialogTarget || !urgentDialogMode) {
      return;
    }

    if (urgentDialogMode === 'REJECT' && !urgentDialogReason.trim()) {
      return;
    }

    const isRfq = urgentDialogTarget.type === 'RFQ';
    const isCustomerTransfer = urgentDialogTarget.type === 'RFQ_CUSTOMER_TRANSFER';
    if (urgentDialogMode === 'APPROVE') {
      await toast.promise(
        isCustomerTransfer
          ? approveRFQCustomerTransfer(urgentDialogTarget.id)
          : isRfq
            ? approveUrgentRFQ(urgentDialogTarget.id)
            : approveUrgentSalesOrder(urgentDialogTarget.id),
        {
          loading: isRfq ? 'กำลังอนุมัติเร่งด่วน' : 'กำลังอนุมัติคำขอสร้างใบสั่งซื้อ',
          success: isRfq ? 'อนุมัติเร่งด่วนแล้ว' : 'อนุมัติคำขอสร้างใบสั่งซื้อแล้ว',
          error: isRfq ? 'ไม่สามารถอนุมัติเร่งด่วนได้' : 'ไม่สามารถอนุมัติคำขอสร้างใบสั่งซื้อได้'
        }
      );
    } else {
      await toast.promise(
        isRfq
          ? rejectUrgentRFQ(urgentDialogTarget.id, {
            reason: urgentDialogReason.trim()
          })
          : isCustomerTransfer
            ? rejectRFQCustomerTransfer(urgentDialogTarget.id, { reason: urgentDialogReason.trim() })
            : rejectUrgentSalesOrder(urgentDialogTarget.id, {
              reason: urgentDialogReason.trim()
            }),
        {
          loading: isRfq ? 'กำลังไม่อนุมัติเร่งด่วน' : 'กำลังไม่อนุมัติคำขอสร้างใบสั่งซื้อ',
          success: isRfq ? 'ไม่อนุมัติเร่งด่วนแล้ว' : 'ไม่อนุมัติคำขอสร้างใบสั่งซื้อแล้ว',
          error: isRfq
            ? 'ไม่สามารถไม่อนุมัติเร่งด่วนได้'
            : 'ไม่สามารถไม่อนุมัติคำขอสร้างใบสั่งซื้อได้'
        }
      );
    }

    handleCloseUrgentDialog();
    await Promise.all([refetchRfq(), refetchCustomerTransfers(), refetchSalesOrders()]);
  };

  const renderActionButtons = (item: UrgentApprovalItem) => (
    <Stack
      direction="row"
      spacing={0.5}
      justifyContent="center"
      onClick={(event) => event.stopPropagation()}>
      <Tooltip title="อนุมัติเร่งด่วน">
        <IconButton
          size="small"
          color="success"
          onClick={() => {
            void handleApproveUrgent(item);
          }}>
          <CheckCircleOutline fontSize="small" />
        </IconButton>
      </Tooltip>
      <Tooltip title="ไม่อนุมัติเร่งด่วน">
        <IconButton
          size="small"
          color="error"
          onClick={() => {
            void handleRejectUrgent(item);
          }}>
          <Close fontSize="small" />
        </IconButton>
      </Tooltip>
    </Stack>
  );

  const rfqItems = useMemo<UrgentApprovalItem[]>(
    () =>
      rfqApprovals.map((approval) => ({
        type: 'RFQ',
        id: approval.referenceId,
        typeLabel: buildUrgentApprovalItemLabel('RFQ'),
        statusLabel: 'รออนุมัติเร่งด่วน',
        requestedAt: approval.requestedDate || null,
        customerLabel: approval.payload?.customerName || '-',
        ownerLabel: approval.requestedBy || approval.payload?.salesName || '-',
        reason: approval.requestReason || approval.payload?.urgentReason || '-',
        rowSx: buildUrgentApprovalRowSx('RFQ')
      })),
    [rfqApprovals]
  );

  const customerTransferItems = useMemo<UrgentApprovalItem[]>(
    () =>
      customerTransferApprovals.map((approval) => ({
        type: 'RFQ_CUSTOMER_TRANSFER',
        id: approval.referenceId,
        typeLabel: 'ย้ายลูกค้า RFQ',
        statusLabel: buildUrgentApprovalStatusLabel('RFQ_CUSTOMER_TRANSFER'),
        requestedAt: approval.requestedDate || null,
        customerLabel: `${approval.payload?.currentCustomerName || '-'} → ${approval.payload?.targetCustomerName || '-'
          }`,
        ownerLabel: approval.requestedBy || approval.payload?.requesterName || '-',
        reason: approval.requestReason || approval.payload?.reason || '-',
        rowSx: buildUrgentApprovalRowSx('RFQ_CUSTOMER_TRANSFER')
      })),
    [customerTransferApprovals]
  );

  const salesOrderItems = useMemo<UrgentApprovalItem[]>(
    () =>
      (salesOrderResponse?.records || []).map((salesOrder) => ({
        type: 'SALES_ORDER',
        id: salesOrder.salesOrderNo,
        typeLabel: buildUrgentApprovalItemLabel('SALES_ORDER'),
        statusLabel: getSalesOrderProcurementLabel(salesOrder),
        requestedAt: salesOrder.urgentRequestedDate || null,
        customerLabel: getSalesOrderCustomerLabel(salesOrder),
        ownerLabel: getSalesOrderOwnerLabel(salesOrder),
        reason: salesOrder.urgentRequestReason || '-',
        rowSx: buildUrgentApprovalRowSx('SALES_ORDER')
      })),
    [salesOrderResponse?.records]
  );

  const combinedItems = useMemo(() => {
    const items = [...rfqItems, ...customerTransferItems, ...salesOrderItems];
    return items.sort((left, right) => {
      const dateDiff = getUrgentDateValue(right.requestedAt) - getUrgentDateValue(left.requestedAt);
      if (dateDiff !== 0) {
        return dateDiff;
      }

      if (left.type !== right.type) {
        return left.type === 'RFQ' ? -1 : 1;
      }

      return left.id.localeCompare(right.id);
    });
  }, [rfqItems, customerTransferItems, salesOrderItems]);

  const displayItems = useMemo(() => {
    const startIndex = (page - 1) * pageSize;
    return combinedItems.slice(startIndex, startIndex + pageSize);
  }, [combinedItems, page, pageSize]);

  useEffect(() => {
    if (!combinedItems.length) {
      return;
    }

    const nextPage = Math.max(1, Math.min(page, totalPage));
    if (nextPage !== page) {
      setPage(nextPage);
    }
  }, [combinedItems.length, page, totalPage]);

  const pagination = useMemo(
    () => ({
      page,
      size: pageSize,
      totalPage,
      totalRecords
    }),
    [page, pageSize, totalPage, totalRecords]
  );

  const refetchCombined = () => {
    void Promise.all([refetchRfq(), refetchCustomerTransfers(), refetchSalesOrders()]);
  };

  const desktopRows =
    displayItems.length > 0 ? (
      displayItems.map((item) => (
        <TableRow
          hover
          key={`${item.type}-${item.id}`}
          onClick={() => handleOpenDetail(item)}
          sx={item.rowSx}>
          <TableCell align="left">
            <Stack direction="row" spacing={1} alignItems="center" sx={{ pl: 1.5 }}>
              <Typography variant="body2">{item.id}</Typography>
              <Chip
                label={buildUrgentApprovalStatusLabel(item.type)}
                size="small"
                sx={{
                  backgroundColor: '#fef3c7',
                  color: '#b45309',
                  fontWeight: 700
                }}
              />
            </Stack>
          </TableCell>
          <TableCell align="center">
            <TextLineClamp>
              {item.requestedAt ? dayjs(item.requestedAt).format('DD/MM/YYYY HH:mm') : '-'}
            </TextLineClamp>
          </TableCell>
          <TableCell align="center">
            <Chip
              label={item.typeLabel}
              size="small"
              sx={{
                backgroundColor: '#f1f5f9',
                color: '#334155',
                fontWeight: 700
              }}
            />
          </TableCell>
          <TableCell>
            <TextLineClamp>{item.ownerLabel}</TextLineClamp>
          </TableCell>
          <TableCell>
            <TextLineClamp>{item.reason}</TextLineClamp>
          </TableCell>
          <TableCell align="center">{renderActionButtons(item)}</TableCell>
        </TableRow>
      ))
    ) : (
      <TableRow>
        <TableCell colSpan={6}>
          <div className={classes.noResultMessage}>{t('warning.noResultList')}</div>
        </TableCell>
      </TableRow>
    );

  const mobileRows =
    displayItems.length > 0 ? (
      displayItems.map((item) => (
        <TableRow
          hover
          key={`${item.type}-${item.id}`}
          onClick={() => handleOpenDetail(item)}
          sx={item.rowSx}>
          <TableCell align="left">
            <Stack spacing={0.5}>
              <Stack direction="row" spacing={1} alignItems="center">
                <Typography variant="subtitle2" fontWeight={700}>
                  {item.id}
                </Typography>
                <Chip
                  label={item.typeLabel}
                  size="small"
                  sx={{
                    backgroundColor: '#f1f5f9',
                    color: '#334155',
                    fontWeight: 700
                  }}
                />
                <Chip
                  label={item.statusLabel}
                  size="small"
                  sx={buildUrgentApprovalStatusChipSx(item.type)}
                />
                <Chip
                  label={buildUrgentApprovalStatusLabel(item.type)}
                  size="small"
                  sx={{
                    backgroundColor: '#fef3c7',
                    color: '#b45309',
                    fontWeight: 700
                  }}
                />
              </Stack>
              <Typography variant="caption" color="text.secondary">
                {item.requestedAt ? dayjs(item.requestedAt).format('DD/MM/YYYY HH:mm') : '-'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                ลูกค้า: {item.customerLabel}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                เซลล์ / จัดซื้อ: {item.ownerLabel}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                เหตุผล: {item.reason}
              </Typography>
              {renderActionButtons(item)}
            </Stack>
          </TableCell>
        </TableRow>
      ))
    ) : (
      <TableRow>
        <TableCell colSpan={1}>
          <div className={classes.noResultMessage}>{t('warning.noResultList')}</div>
        </TableCell>
      </TableRow>
    );

  return (
    <>
      <PageTitle title="รายการรออนุมัติเร่งด่วน" />
      <Wrapper>
        <Stack spacing={2}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              รายการที่อยู่ระหว่างรออนุมัติคำขอเร่งด่วนของ RFQ และใบสั่งซื้อ
            </Typography>
          </Box>

          {isMobileOnly ? (
            <TableContainer>
              <Table id="urgent_approval_mobile___table">
                <TableHead>
                  <TableRow>
                    <TableCell align="center" className={classes.tableHeader}>
                      {t('priceInquiryManagement.mobileTitle')}
                    </TableCell>
                  </TableRow>
                </TableHead>
                {isFetching ? (
                  <TableBody>
                    <TableRow>
                      <TableCell colSpan={1} align="center">
                        <CircularProgress />
                      </TableCell>
                    </TableRow>
                  </TableBody>
                ) : (
                  <TableBody>{mobileRows}</TableBody>
                )}
              </Table>
            </TableContainer>
          ) : (
            <TableContainer>
              <Table id="urgent_approval_list___table">
                <TableHead>
                  <TableRow>
                    <TableCell align="center" className={classes.tableHeader}>
                      {t('rfqManagement.column.id')}
                    </TableCell>
                    <TableCell align="center" className={classes.tableHeader}>
                      {t('rfqManagement.column.requestedDate')}
                    </TableCell>
                    <TableCell align="center" className={classes.tableHeader}>
                      ประเภทรายการ
                    </TableCell>
                    <TableCell align="center" className={classes.tableHeader}>
                      ผู้ขอ
                    </TableCell>
                    <TableCell align="center" className={classes.tableHeader}>
                      เหตุผล
                    </TableCell>
                    <TableCell align="center" className={classes.tableHeader}>
                      Action
                    </TableCell>
                  </TableRow>
                </TableHead>
                {isFetching ? (
                  <TableBody>
                    <TableRow>
                      <TableCell colSpan={6} align="center">
                        <CircularProgress />
                      </TableCell>
                    </TableRow>
                  </TableBody>
                ) : (
                  <TableBody>{desktopRows}</TableBody>
                )}
              </Table>
            </TableContainer>
          )}

          <Paginate
            pagination={pagination}
            page={page}
            pageSize={pageSize}
            setPage={setPage}
            setPageSize={setPageSize}
            refetch={refetchCombined}
            totalRecords={totalRecords}
            isShow={!isDownSm}
          />
        </Stack>
      </Wrapper>

      <Dialog
        open={urgentDialogMode !== null}
        onClose={handleCloseUrgentDialog}
        maxWidth="sm"
        fullWidth>
        <DialogTitle>
          {urgentDialogMode === 'APPROVE' ? 'ยืนยันอนุมัติ' : 'ยืนยันไม่อนุมัติ'}
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              {urgentDialogTarget
                ? urgentDialogMode === 'APPROVE'
                  ? `คุณต้องการอนุมัติ ${buildUrgentApprovalItemLabel(urgentDialogTarget.type)} ${urgentDialogTarget.id
                  } ใช่หรือไม่`
                  : `คุณต้องการไม่อนุมัติ ${buildUrgentApprovalItemLabel(
                    urgentDialogTarget.type
                  )} ${urgentDialogTarget.id} ใช่หรือไม่`
                : '-'}
            </Typography>
            {urgentDialogMode === 'REJECT' ? (
              <TextField
                fullWidth
                multiline
                minRows={4}
                label="เหตุผลไม่อนุมัติ"
                placeholder="ระบุเหตุผลที่ชัดเจนสำหรับการไม่อนุมัติ"
                value={urgentDialogReason}
                onChange={(event) => setUrgentDialogReason(event.target.value)}
              />
            ) : null}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleCloseUrgentDialog}>ยกเลิก</Button>
          <Button
            variant="contained"
            color={urgentDialogMode === 'APPROVE' ? 'success' : 'error'}
            disabled={
              !urgentDialogTarget || (urgentDialogMode === 'REJECT' && !urgentDialogReason.trim())
            }
            onClick={() => void handleConfirmUrgentAction()}>
            {urgentDialogMode === 'APPROVE' ? 'ยืนยันอนุมัติ' : 'ยืนยันไม่อนุมัติ'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
