import { OpenInNew, ReceiptLong, Refresh } from '@mui/icons-material';
import {
  Box,
  Button,
  Chip,
  IconButton,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  useMediaQuery,
  useTheme
} from '@mui/material';
import dayjs from 'dayjs';
import { useQuery } from 'react-query';
import { Link } from 'react-router-dom';
import Paginate from 'components/Paginate';
import { ListEmptyState, ListErrorState, ListLoadingState } from 'components/ManagementList';
import { useUrlListState } from 'hooks/useUrlListState';
import { ROUTE_PATHS } from 'routes';
import { searchGoodReceipts } from 'services/PurchaseOrder/good-receipt-api';

const formatDate = (value?: string | null) => value ? dayjs(value).format('DD/MM/YYYY') : '-';

const statusLabel = (status?: string | null) => status === 'CANCELLED' ? 'ยกเลิก' : 'ยืนยันแล้ว';

export default function GoodReceiptList() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { page, pageSize, setPage, setPageSize } = useUrlListState({
    defaultFilter: {},
    parseFilter: (_search, defaultFilter) => defaultFilter,
    serializeFilter: () => undefined,
    defaultPageSize: 10
  });
  const { data, isLoading, isFetching, isError, refetch } = useQuery(
    ['good-receipt-list', page, pageSize],
    () => searchGoodReceipts(page, pageSize),
    { keepPreviousData: true, refetchOnWindowFocus: false }
  );
  const records = data?.data.records || [];
  const openLink = (record: any) => `${ROUTE_PATHS.GOOD_RECEIPT_CREATE}?poNo=${encodeURIComponent(
    record.purchaseOrderNo || ''
  )}&deliveryId=${record.deliveryId || ''}`;

  return (
    <Stack spacing={2}>
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" spacing={1}>
        <Stack direction="row" spacing={1} alignItems="center">
          <ReceiptLong color="primary" />
          <Box>
            <Typography variant="h5" fontWeight={700}>รายการ Good Receipt</Typography>
            <Typography variant="body2" color="text.secondary">รายการเอกสารรับสินค้า</Typography>
          </Box>
        </Stack>
        <Button variant="outlined" startIcon={<Refresh />} onClick={() => void refetch()}>
          รีเฟรช
        </Button>
      </Stack>

      {isError ? <ListErrorState message="ไม่สามารถโหลดรายการ Good Receipt ได้" onRetry={() => void refetch()} /> : null}

      {isMobile ? (
        <Stack spacing={1.5} aria-busy={isFetching}>
          {isLoading ? <Paper variant="outlined" sx={{ p: 2 }}>กำลังโหลดรายการ...</Paper> : null}
          {!isLoading && !records.length ? <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>ไม่พบรายการ Good Receipt</Paper> : null}
          {records.map((record) => (
            <Paper key={record.receiptNo} variant="outlined" sx={{ p: 1.5 }}>
              <Stack spacing={1}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography fontWeight={700}>{record.receiptNo || '-'}</Typography>
                  <Chip size="small" label={statusLabel(record.status)} color={record.status === 'CANCELLED' ? 'default' : 'success'} />
                </Stack>
                <Typography variant="body2">PO: {record.purchaseOrderNo || '-'}</Typography>
                <Typography variant="body2">เที่ยวส่ง: {record.deliveryNo || '-'}</Typography>
                <Typography variant="body2">วันที่รับ: {formatDate(record.receivedDate)}</Typography>
                <Typography variant="body2">รับโดย: {record.receivedBy || '-'}</Typography>
                <IconButton component={Link} to={openLink(record)} sx={{ alignSelf: 'flex-end' }}>
                  <OpenInNew />
                </IconButton>
              </Stack>
            </Paper>
          ))}
        </Stack>
      ) : (
        <TableContainer component={Paper} variant="outlined" aria-busy={isFetching}>
          <Table>
            <TableHead><TableRow>
              <TableCell>เลขที่ Good Receipt</TableCell>
              <TableCell>เลขที่ PO</TableCell>
              <TableCell>เลขเที่ยวส่ง</TableCell>
              <TableCell>วันที่รับสินค้า</TableCell>
              <TableCell>รับโดย</TableCell>
              <TableCell>สถานะ</TableCell>
              <TableCell align="center">ดำเนินการ</TableCell>
            </TableRow></TableHead>
            <TableBody>
              {isLoading ? <ListLoadingState colSpan={7} /> : null}
              {!isLoading && records.map((record) => (
                <TableRow hover key={record.receiptNo}>
                  <TableCell>{record.receiptNo || '-'}</TableCell>
                  <TableCell>{record.purchaseOrderNo || '-'}</TableCell>
                  <TableCell>{record.deliveryNo || '-'}</TableCell>
                  <TableCell>{formatDate(record.receivedDate)}</TableCell>
                  <TableCell>{record.receivedBy || '-'}</TableCell>
                  <TableCell><Chip size="small" label={statusLabel(record.status)} color={record.status === 'CANCELLED' ? 'default' : 'success'} /></TableCell>
                  <TableCell align="center"><IconButton component={Link} to={openLink(record)}><OpenInNew /></IconButton></TableCell>
                </TableRow>
              ))}
              {!isLoading && !records.length ? <ListEmptyState colSpan={7} message="ไม่พบรายการ Good Receipt" /> : null}
            </TableBody>
          </Table>
        </TableContainer>
      )}
      <Paginate pagination={data?.data.pagination} page={page} pageSize={pageSize} setPage={setPage}
        setPageSize={(next) => { setPage(1); setPageSize(next); }} refetch={() => void refetch()}
        totalRecords={data?.data.pagination.totalRecords} isShow />
    </Stack>
  );
}
