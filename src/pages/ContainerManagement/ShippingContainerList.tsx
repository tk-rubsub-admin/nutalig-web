import { Add, Search } from '@mui/icons-material';
import {
  Alert,
  Button,
  Chip,
  CircularProgress,
  Grid,
  MenuItem,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField
} from '@mui/material';
import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ROUTE_PATHS } from 'routes';
import { useQuery } from 'react-query';
import { usePermissions } from 'auth/PermissionContext';
import { PERMISSIONS } from 'auth/permissions';
import Paginate from 'components/Paginate';
import {
  CONTAINER_STATUS,
  ContainerStatus,
  containerNumberLabel,
  searchContainers
} from 'services/ShippingContainer/shipping-container-api';
import ShippingContainerDialog from './ShippingContainerDialog';

export default function ShippingContainerList() {
  const { has } = usePermissions();
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(10);
  const [draft, setDraft] = useState<{
    keyword: string;
    status: ContainerStatus | '';
    containerSize: string;
  }>({ keyword: '', status: '', containerSize: '' });
  const [filter, setFilter] = useState(draft);
  const [dialog, setDialog] = useState<{ open: boolean; id: number | null }>({
    open: false,
    id: null
  });
  const location = useLocation();
  useEffect(() => {
    const id = Number(new URLSearchParams(location.search).get('containerId'));
    if (Number.isSafeInteger(id) && id > 0) setDialog({ open: true, id });
  }, [location.search]);
  const query = useQuery(
    ['shipping-containers', filter, page, size],
    () => searchContainers(filter, page, size),
    { keepPreviousData: true, refetchOnWindowFocus: false }
  );
  return (
    <Stack spacing={2}>
      <Paper variant="outlined" sx={{ p: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={5}>
            <TextField
              fullWidth
              label="ค้นหาเลขงาน / หมายเลขตู้ / ซีล / ปลายทาง"
              InputLabelProps={{ shrink: true }}
              value={draft.keyword}
              onChange={(e) => setDraft({ ...draft, keyword: e.target.value })}
            />
          </Grid>
          <Grid item xs={6} md={2}>
            <TextField
              select
              fullWidth
              label="สถานะตู้"
              InputLabelProps={{ shrink: true }}
              value={draft.status}
              onChange={(e) =>
                setDraft({ ...draft, status: e.target.value as ContainerStatus | '' })
              }>
              <MenuItem value="">ทั้งหมด</MenuItem>
              {Object.entries(CONTAINER_STATUS).map(([value, label]) => (
                <MenuItem key={value} value={value}>
                  {label}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={6} md={2}>
            <TextField
              select
              fullWidth
              label="ขนาดตู้"
              InputLabelProps={{ shrink: true }}
              value={draft.containerSize}
              onChange={(e) => setDraft({ ...draft, containerSize: e.target.value })}>
              <MenuItem value="">ทั้งหมด</MenuItem>
              <MenuItem value="20GP">20GP</MenuItem>
              <MenuItem value="40HQ">40HQ</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12} md={3}>
            <Stack direction="row" spacing={1}>
              <Button
                variant="contained"
                startIcon={<Search />}
                onClick={() => {
                  setPage(1);
                  if (page === 1 && JSON.stringify(filter) === JSON.stringify(draft))
                    void query.refetch();
                  else setFilter({ ...draft });
                }}>
                ค้นหา
              </Button>
              <Button
                onClick={() => {
                  const empty = { keyword: '', status: '' as const, containerSize: '' };
                  setDraft(empty);
                  setFilter(empty);
                  setPage(1);
                  if (page === 1 && JSON.stringify(filter) === JSON.stringify(empty))
                    void query.refetch();
                }}>
                ล้าง
              </Button>
              {has(PERMISSIONS.CONTAINER_CREATE) ? (
                <Button
                  variant="contained"
                  startIcon={<Add />}
                  sx={{ alignSelf: 'flex-end' }}
                  component={Link}
                  to={ROUTE_PATHS.CONTAINER_CREATE}>
                  สร้างตู้คอนเทนเนอร์
                </Button>
              ) : null}
            </Stack>
          </Grid>
        </Grid>
      </Paper>
      {query.isError ? (
        <Alert severity="error">
          ไม่สามารถโหลดรายการตู้ได้{' '}
          <Button onClick={() => void query.refetch()}>ลองอีกครั้ง</Button>
        </Alert>
      ) : null}
      <TableContainer component={Paper} variant="outlined">
        <Table sx={{ minWidth: 950 }} aria-label="ตู้คอนเทนเนอร์">
          <TableHead>
            <TableRow>
              <TableCell>เลขงานจัดตู้</TableCell>
              <TableCell>หมายเลขตู้ / ซีล</TableCell>
              <TableCell>ขนาด</TableCell>
              <TableCell>ผู้ขนส่ง / ปลายทาง</TableCell>
              <TableCell align="right">กล่อง</TableCell>
              <TableCell align="right">CBM / ความจุ</TableCell>
              <TableCell align="right">Gross / สูงสุด (kg)</TableCell>
              <TableCell>สถานะ</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {query.isFetching ? (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  <CircularProgress size={24} />
                </TableCell>
              </TableRow>
            ) : !query.isError ? (
              (query.data?.records || []).map((container) => (
                <TableRow key={container.id} hover>
                  <TableCell>
                    <Button onClick={() => setDialog({ open: true, id: container.id })}>
                      {container.containerJobNo}
                    </Button>
                  </TableCell>
                  <TableCell>
                    {container.containerNo || '-'} / {container.sealNo || '-'}
                  </TableCell>
                  <TableCell>{container.containerSize}</TableCell>
                  <TableCell>
                    {container.carrierName || '-'} / {container.destinationName || '-'}
                  </TableCell>
                  <TableCell align="right">
                    {containerNumberLabel(container.totalCartons)}
                  </TableCell>
                  <TableCell align="right">
                    {containerNumberLabel(container.totalCbm)} /{' '}
                    {containerNumberLabel(container.capacityCbm)}
                  </TableCell>
                  <TableCell align="right">
                    {containerNumberLabel(container.totalGrossWeightKg)} /{' '}
                    {containerNumberLabel(container.maxCargoWeightKg)}
                  </TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      color={
                        container.status === 'CANCELLED'
                          ? 'default'
                          : container.status === 'RECEIVED'
                            ? 'success'
                            : 'info'
                      }
                      label={CONTAINER_STATUS[container.status]}
                    />
                  </TableCell>
                </TableRow>
              ))
            ) : null}
            {!query.isFetching && !query.isError && !query.data?.records.length ? (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  ไม่พบตู้คอนเทนเนอร์ตามเงื่อนไข
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </TableContainer>
      <Paginate
        pagination={query.data?.pagination}
        page={page}
        pageSize={size}
        setPage={setPage}
        setPageSize={(value) => {
          setPage(1);
          setSize(value);
        }}
        refetch={() => void query.refetch()}
        totalRecords={query.data?.pagination.totalRecords}
        isShow
      />
      <ShippingContainerDialog
        open={dialog.open}
        id={dialog.id}
        onClose={() => setDialog({ open: false, id: null })}
        onUpdated={() => void query.refetch()}
      />
    </Stack>
  );
}
