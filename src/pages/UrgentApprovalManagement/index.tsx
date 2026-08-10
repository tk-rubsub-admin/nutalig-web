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
import { ReactElement, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { useQuery } from 'react-query';
import { useHistory } from 'react-router-dom';
import { isMobileOnly } from 'react-device-detect';
import { ROUTE_PATHS } from 'routes';
import { approveUrgentRFQ, getRFQList, rejectUrgentRFQ } from 'services/RFQ/rfq-api';
import { RFQEmployee, RFQRecord } from 'services/RFQ/rfq-type';

function getEmployeeLabel(employee?: RFQEmployee | null): string {
  if (!employee) {
    return '-';
  }

  const nickname = employee.nickName || employee.nickname || '';
  const name = [employee.firstNameTh, employee.lastNameTh].filter(Boolean).join(' ');

  return nickname || name || '-';
}

function getSalesProcurementLabel(rfq: RFQRecord): string {
  return `${getEmployeeLabel(rfq.sales)} / ${getEmployeeLabel(rfq.procurement)}`;
}

function getSLADayLeft(requestedDate?: string | null, slaDate?: string | null): number | null {
  if (!requestedDate || !slaDate) {
    return null;
  }

  const requestDay = dayjs(requestedDate).startOf('day');
  const targetDay = dayjs(slaDate).startOf('day');
  const today = dayjs().startOf('day');
  const referenceDay = today.isBefore(requestDay) ? requestDay : today;

  return targetDay.diff(referenceDay, 'day');
}

function getRFQRowSx(rfq: RFQRecord) {
  const dayLeft = getSLADayLeft(rfq.requestedDate, rfq.slaDate);
  const isSLAActiveStatus = ['NEW', 'IN_PROGRESS'].includes(rfq.status || '');

  if (!isSLAActiveStatus) {
    return { cursor: 'pointer' };
  }

  if (dayLeft === null || dayLeft === undefined) {
    return { cursor: 'pointer' };
  }

  if (dayLeft < 0) {
    return {
      cursor: 'pointer',
      backgroundColor: '#fff1f2',
      '&:hover': { backgroundColor: '#ffe4e6' }
    };
  }

  if (dayLeft === 0) {
    return {
      cursor: 'pointer',
      backgroundColor: '#fff7ed',
      '&:hover': { backgroundColor: '#ffedd5' }
    };
  }

  if (dayLeft === 1) {
    return {
      cursor: 'pointer',
      backgroundColor: '#fff8e1',
      '&:hover': { backgroundColor: '#ffefc2' }
    };
  }

  return {
    cursor: 'pointer',
    backgroundColor: '#e8f5e9',
    '&:hover': { backgroundColor: '#dff0e1' }
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
  const [pageSize, setPageSize] = useState(10);
  const [urgentDialogMode, setUrgentDialogMode] = useState<'APPROVE' | 'REJECT' | null>(null);
  const [urgentDialogRfqId, setUrgentDialogRfqId] = useState<string>('');
  const [urgentDialogReason, setUrgentDialogReason] = useState('');

  const {
    data: rfqResponse,
    refetch,
    isFetching
  } = useQuery(
    ['urgent-approval-rfq-list', page, pageSize],
    () =>
      getRFQList(page, pageSize, {
        urgentRequestStatus: 'PENDING_APPROVAL',
        status: 'NEW',
        sortBy: 'requestedDate',
        sortDirection: 'DESC'
      }),
    {
      refetchOnWindowFocus: false,
      keepPreviousData: true,
      onSuccess: (data) => {
        if (data?.pagination) {
          setPage(data.pagination.page);
          setPageSize(data.pagination.size);
        }
      }
    }
  );

  const rfqList = rfqResponse?.records || [];

  const handleOpenPriceInquiryDetail = (rfqId: string) => {
    history.push({
      pathname: ROUTE_PATHS.PRICE_INQUIRY.replace(':id', rfqId),
      state: {
        returnToList: {
          page,
          pageSize
        }
      }
    });
  };

  const handleApproveUrgent = async (rfqId: string) => {
    setUrgentDialogMode('APPROVE');
    setUrgentDialogRfqId(rfqId);
    setUrgentDialogReason('');
  };

  const handleRejectUrgent = async (rfqId: string) => {
    setUrgentDialogMode('REJECT');
    setUrgentDialogRfqId(rfqId);
    setUrgentDialogReason('');
  };

  const handleCloseUrgentDialog = () => {
    setUrgentDialogMode(null);
    setUrgentDialogRfqId('');
    setUrgentDialogReason('');
  };

  const handleConfirmUrgentAction = async () => {
    if (!urgentDialogRfqId || !urgentDialogMode) {
      return;
    }

    if (urgentDialogMode === 'REJECT' && !urgentDialogReason.trim()) {
      return;
    }

    if (urgentDialogMode === 'APPROVE') {
      await toast.promise(approveUrgentRFQ(urgentDialogRfqId), {
        loading: 'กำลังอนุมัติเร่งด่วน',
        success: 'อนุมัติเร่งด่วนแล้ว',
        error: 'ไม่สามารถอนุมัติเร่งด่วนได้'
      });
    } else {
      await toast.promise(
        rejectUrgentRFQ(urgentDialogRfqId, {
          reason: urgentDialogReason.trim()
        }),
        {
          loading: 'กำลังไม่อนุมัติเร่งด่วน',
          success: 'ไม่อนุมัติเร่งด่วนแล้ว',
          error: 'ไม่สามารถไม่อนุมัติเร่งด่วนได้'
        }
      );
    }

    handleCloseUrgentDialog();
    await refetch();
  };

  const renderActionButtons = (rfqId: string) => (
    <Stack direction="row" spacing={0.5} justifyContent="center" onClick={(event) => event.stopPropagation()}>
      <Tooltip title="อนุมัติเร่งด่วน">
        <IconButton
          size="small"
          color="success"
          onClick={() => {
            void handleApproveUrgent(rfqId);
          }}>
          <CheckCircleOutline fontSize="small" />
        </IconButton>
      </Tooltip>
      <Tooltip title="ไม่อนุมัติเร่งด่วน">
        <IconButton
          size="small"
          color="error"
          onClick={() => {
            void handleRejectUrgent(rfqId);
          }}>
          <Close fontSize="small" />
        </IconButton>
      </Tooltip>
    </Stack>
  );

  const desktopRows =
    rfqList.length > 0 ? (
      rfqList.map((rfq) => (
        <TableRow
          hover
          key={rfq.id}
          onClick={() => handleOpenPriceInquiryDetail(rfq.id)}
          sx={getRFQRowSx(rfq)}>
          <TableCell align="left">
            <Stack direction="row" spacing={1} alignItems="center" sx={{ pl: 1.5 }}>
              <Typography variant="body2">{rfq.id}</Typography>
              <Chip
                label={t(`rfqManagement.rfqsStatus.${rfq.status}`, rfq.status)}
                size="small"
                sx={{
                  backgroundColor: '#e8f5e9',
                  color: '#2e7d32',
                  fontWeight: 700
                }}
              />
              <Chip
                label="รออนุมัติเร่งด่วน"
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
              {rfq.requestedDate ? dayjs(rfq.requestedDate).format('DD/MM/YYYY HH:mm') : '-'}
            </TextLineClamp>
          </TableCell>
          <TableCell>
            <TextLineClamp>{rfq.contactName || '-'}</TextLineClamp>
          </TableCell>
          <TableCell>
            <TextLineClamp>{getSalesProcurementLabel(rfq)}</TextLineClamp>
          </TableCell>
          <TableCell>
            <TextLineClamp>{rfq.urgentRequestReason || '-'}</TextLineClamp>
          </TableCell>
          <TableCell align="center">{renderActionButtons(rfq.id)}</TableCell>
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
    rfqList.length > 0 ? (
      rfqList.map((rfq) => (
        <TableRow
          hover
          key={rfq.id}
          onClick={() => handleOpenPriceInquiryDetail(rfq.id)}
          sx={getRFQRowSx(rfq)}>
          <TableCell align="left">
            <Stack spacing={0.5}>
              <Stack direction="row" spacing={1} alignItems="center">
                <Typography variant="subtitle2" fontWeight={700}>
                  {rfq.id}
                </Typography>
                <Chip
                  label={t(`rfqManagement.rfqsStatus.${rfq.status}`, rfq.status)}
                  size="small"
                  sx={{
                    backgroundColor: '#e8f5e9',
                    color: '#2e7d32',
                    fontWeight: 700
                  }}
                />
                <Chip
                  label="รออนุมัติเร่งด่วน"
                  size="small"
                  sx={{
                    backgroundColor: '#fef3c7',
                    color: '#b45309',
                    fontWeight: 700
                  }}
                />
              </Stack>
              <Typography variant="caption" color="text.secondary">
                {rfq.requestedDate ? dayjs(rfq.requestedDate).format('DD/MM/YYYY HH:mm') : '-'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                ลูกค้า: {rfq.contactName || '-'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                เซลล์ / จัดซื้อ: {getSalesProcurementLabel(rfq)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                เหตุผล: {rfq.urgentRequestReason || '-'}
              </Typography>
              {renderActionButtons(rfq.id)}
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
              รายการที่อยู่ระหว่างรออนุมัติคำขอเร่งด่วน
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
                      {t('rfqManagement.column.contact')}
                    </TableCell>
                    <TableCell align="center" className={classes.tableHeader}>
                      {t('rfqManagement.column.sales')}
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
            pagination={rfqResponse?.pagination}
            page={page}
            pageSize={pageSize}
            setPage={setPage}
            setPageSize={setPageSize}
            refetch={refetch}
            totalRecords={rfqResponse?.pagination?.totalRecords}
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
          {urgentDialogMode === 'APPROVE' ? 'ยืนยันอนุมัติเร่งด่วน' : 'ยืนยันไม่อนุมัติเร่งด่วน'}
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              {urgentDialogMode === 'APPROVE'
                ? `คุณต้องการอนุมัติคำขอเร่งด่วน RFQ ${urgentDialogRfqId || '-'} ใช่หรือไม่`
                : `คุณต้องการไม่อนุมัติคำขอเร่งด่วน RFQ ${urgentDialogRfqId || '-'} ใช่หรือไม่`}
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
            disabled={urgentDialogMode === 'REJECT' && !urgentDialogReason.trim()}
            onClick={() => void handleConfirmUrgentAction()}>
            {urgentDialogMode === 'APPROVE' ? 'ยืนยันอนุมัติ' : 'ยืนยันไม่อนุมัติ'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
