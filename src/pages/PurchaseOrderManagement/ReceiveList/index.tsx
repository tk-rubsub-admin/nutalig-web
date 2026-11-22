import { Inbox, OpenInNew, Refresh } from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography
} from '@mui/material';
import dayjs from 'dayjs';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from 'react-query';
import Paginate from 'components/Paginate';
import { ROUTE_PATHS } from 'routes';
import { searchPurchaseOrderDeliveries } from 'services/PurchaseOrder/purchase-order-delivery-api';
import { getShippingMethodLabel } from 'utils/shipping';

const formatDate = (value?: string | null) => (value ? dayjs(value).format('DD/MM/YYYY') : '-');

export default function PurchaseOrderReceiveList() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const { data, isLoading, isFetching, isError, refetch } = useQuery(
    ['purchase-order-receive-list', page, pageSize],
    () =>
      searchPurchaseOrderDeliveries(
        { status: 'IN_TRANSIT' },
        page,
        pageSize,
        'expectedWarehouseDate',
        'ASC'
      ),
    { keepPreviousData: true, refetchOnWindowFocus: false }
  );

  const records = data?.data.records || [];

  return (
    <Stack spacing={2}>
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" spacing={1}>
        <Stack direction="row" spacing={1} alignItems="center">
          <Inbox color="primary" />
          <Box>
            <Typography variant="h5" fontWeight={700}>รายการรับสินค้า</Typography>
            <Typography variant="body2" color="text.secondary">
              เที่ยวขนส่งที่อยู่ระหว่างขนส่ง เรียงตามวันที่คาดว่าจะถึงคลัง
            </Typography>
          </Box>
        </Stack>
        <Button variant="outlined" startIcon={<Refresh />} onClick={() => void refetch()}>
          รีเฟรช
        </Button>
      </Stack>

      {isError ? (
        <Alert severity="error" action={<Button onClick={() => void refetch()}>ลองอีกครั้ง</Button>}>
          ไม่สามารถโหลดรายการรับสินค้าได้
        </Alert>
      ) : null}

      <TableContainer component={Paper} variant="outlined" aria-busy={isFetching}>
        <Table sx={{ minWidth: 950 }} aria-label="รายการรับสินค้า">
          <TableHead>
            <TableRow>
              <TableCell>วันที่คาดว่าจะถึงคลัง</TableCell>
              <TableCell>เลขเที่ยวส่ง</TableCell>
              <TableCell>ใบสั่งซื้อ</TableCell>
              <TableCell>Supplier</TableCell>
              <TableCell>วิธีขนส่ง</TableCell>
              <TableCell>เส้นทาง</TableCell>
              <TableCell>สถานะ</TableCell>
              <TableCell align="center">ดำเนินการ</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading || isFetching ? (
              <TableRow><TableCell colSpan={8} align="center"><CircularProgress size={28} /></TableCell></TableRow>
            ) : null}
            {!isLoading && !isFetching && records.map((record) => (
              <TableRow hover key={record.id}>
                <TableCell>{formatDate(record.expectedWarehouseDate)}</TableCell>
                <TableCell>
                  <Typography fontWeight={600}>{record.deliveryNo || '-'}</Typography>
                  <Typography variant="caption" color="text.secondary">{record.trackingNumber || ''}</Typography>
                </TableCell>
                <TableCell>{record.purchaseOrderNo || '-'}</TableCell>
                <TableCell>{record.supplierName || '-'}</TableCell>
                <TableCell>{getShippingMethodLabel(record.shippingMethod)}</TableCell>
                <TableCell>{record.shippingRouteCode || `${record.originLocationName || '-'} → ${record.destinationLocationName || '-'}`}</TableCell>
                <TableCell><Chip size="small" color="info" label="อยู่ระหว่างขนส่ง" /></TableCell>
                <TableCell align="center">
                  <Button
                    size="small"
                    variant="contained"
                    startIcon={<OpenInNew />}
                    component={Link}
                    to={`${ROUTE_PATHS.PURCHASE_ORDER_DELIVERY_RECEIVE}?poNo=${encodeURIComponent(record.purchaseOrderNo || '')}&deliveryId=${record.id}`}>
                    รับสินค้า
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {!isLoading && !isFetching && !records.length ? (
              <TableRow><TableCell colSpan={8} align="center" sx={{ py: 5 }}>ไม่พบเที่ยวขนส่งที่อยู่ระหว่างขนส่ง</TableCell></TableRow>
            ) : null}
          </TableBody>
        </Table>
      </TableContainer>
      <Paginate
        pagination={data?.data.pagination}
        page={page}
        pageSize={pageSize}
        setPage={setPage}
        setPageSize={(next) => { setPage(1); setPageSize(next); }}
        refetch={() => void refetch()}
        totalRecords={data?.data.pagination.totalRecords}
        isShow
      />
    </Stack>
  );
}
