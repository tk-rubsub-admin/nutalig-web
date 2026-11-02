import {
  Alert,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography
} from '@mui/material';
import { useState } from 'react';
import { useQuery } from 'react-query';
import { searchPurchaseOrderDeliveries } from 'services/PurchaseOrder/purchase-order-delivery-api';
import {
  addContainerLoad,
  containerError,
  containerNumberLabel,
  ContainerSource,
  getContainerSources,
  previewContainerSources,
  ContainerRoute,
  DraftContainerLoad,
  ShippingContainer
} from 'services/ShippingContainer/shipping-container-api';
interface Props {
  container: ContainerRoute;
  open: boolean;
  onClose: () => void;
  onChanged?: (container: ShippingContainer) => void;
  pendingLoads?: DraftContainerLoad[];
  onSelected?: (load: DraftContainerLoad) => void;
}
export default function ContainerLoadPicker({
  container,
  open,
  onClose,
  onChanged,
  pendingLoads = [],
  onSelected
}: Props) {
  const [page, setPage] = useState(1);
  const [deliveryId, setDeliveryId] = useState<number | null>(null);
  const [selected, setSelected] = useState<ContainerSource | null>(null);
  const [count, setCount] = useState('');
  const [uniform, setUniform] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const search = useQuery(
    ['container-source-deliveries', container.id, container.version, page],
    () =>
      searchPurchaseOrderDeliveries(
        { containerStatuses: ['NOT_ASSIGNED', 'PARTIALLY_ASSIGNED'] },
        page,
        10
      ),
    {
      enabled: open,
      keepPreviousData: true
    }
  );
  const sources = useQuery(
    [
      'container-source-boxes',
      container.id,
      container.version,
      container.containerSize,
      container.supplierShippingId,
      container.destinationId,
      deliveryId
    ],
    () =>
      container.id
        ? getContainerSources(container.id, deliveryId!)
        : previewContainerSources(container, deliveryId!),
    { enabled: open && deliveryId !== null }
  );
  const availableSources = (sources.data || []).map((source) => {
    const reserved = pendingLoads
      .filter(
        (row) =>
          row.request.deliveryId === source.deliveryId &&
          (source.scrapBoxId
            ? row.request.scrapBoxId === source.scrapBoxId
            : row.request.deliveryDetailId === source.deliveryDetailId)
      )
      .reduce((sum, row) => sum + row.request.cartonCount, 0);
    return {
      ...source,
      availableCartons:
        source.availableCartons == null ? null : Math.max(0, source.availableCartons - reserved)
    };
  });
  const choose = (source: ContainerSource) => {
    setSelected(source);
    setCount(String(source.availableCartons || ''));
    setUniform(false);
    setError('');
  };
  const partial =
    !!selected && !selected.scrapBoxId && Number(count) < Number(selected.totalCartons);
  const add = async () => {
    if (
      !selected ||
      !Number.isInteger(Number(count)) ||
      Number(count) <= 0 ||
      Number(count) > Number(selected.availableCartons)
    ) {
      setError('จำนวนกล่องต้องเป็นจำนวนเต็มและไม่เกินยอดคงเหลือ');
      return;
    }
    if (partial && (!selected.canSplit || !uniform)) {
      setError('กรุณายืนยันข้อมูลบรรจุต่อกล่องก่อนแบ่งกล่อง');
      return;
    }
    if (!container.id) {
      const delivery = search.data?.data.records.find((row) => row.id === selected.deliveryId);
      onSelected?.({
        source: selected,
        request: {
          deliveryId: selected.deliveryId,
          deliveryDetailId: selected.deliveryDetailId,
          scrapBoxId: selected.scrapBoxId,
          cartonCount: Number(count),
          confirmUniformPackaging: uniform
        },
        deliveryNo: delivery?.deliveryNo || String(selected.deliveryId),
        purchaseOrderNo: delivery?.purchaseOrderNo || ''
      });
      setSelected(null);
      return;
    }
    setBusy(true);
    setError('');
    try {
      const updated = await addContainerLoad(container.id, {
        version: container.version!,
        deliveryId: selected.deliveryId,
        deliveryDetailId: selected.deliveryDetailId,
        scrapBoxId: selected.scrapBoxId,
        cartonCount: Number(count),
        confirmUniformPackaging: uniform
      });
      onChanged?.(updated);
      setSelected(null);
    } catch (e) {
      setError(containerError(e));
      void sources.refetch();
    } finally {
      setBusy(false);
    }
  };
  return (
    <Dialog open={open} onClose={() => !busy && onClose()} maxWidth="md" fullWidth>
      <DialogTitle>เลือกกล่องลงตู้</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2}>
          <Typography variant="body2">
            แสดงเที่ยวส่งที่มีขนาดตู้ ผู้ให้บริการ และปลายทางตรงกับตู้
          </Typography>
          {search.isError || sources.isError ? (
            <Alert severity="error">
              ไม่สามารถโหลดข้อมูลได้{' '}
              <Button
                onClick={() => {
                  void search.refetch();
                  if (deliveryId) void sources.refetch();
                }}>
                ลองอีกครั้ง
              </Button>
            </Alert>
          ) : null}
          {error ? <Alert severity="error">{error}</Alert> : null}
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>เที่ยวส่ง</TableCell>
                  <TableCell>PO / Supplier</TableCell>
                  <TableCell>เลือก</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {search.isFetching ? (
                  <TableRow>
                    <TableCell colSpan={3}>กำลังโหลด...</TableCell>
                  </TableRow>
                ) : (
                  (search.data?.data.records || []).map((d) => (
                    <TableRow key={d.id} selected={deliveryId === d.id}>
                      <TableCell>{d.deliveryNo}</TableCell>
                      <TableCell>
                        {d.purchaseOrderNo}
                        <Typography variant="caption" display="block">
                          {d.supplierName}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Button
                          disabled={busy}
                          onClick={() => {
                            setDeliveryId(d.id);
                            setSelected(null);
                          }}>
                          ดูกล่อง
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
                {!search.isFetching && !search.data?.data.records.length ? (
                  <TableRow>
                    <TableCell colSpan={3}>ไม่พบเที่ยวส่งที่ตรงกับตู้</TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </TableContainer>
          <Stack direction="row" justifyContent="space-between">
            <Button
              disabled={busy || page <= 1}
              onClick={() => {
                setPage(page - 1);
                setDeliveryId(null);
                setSelected(null);
              }}>
              ก่อนหน้า
            </Button>
            <Typography>หน้า {page}</Typography>
            <Button
              disabled={busy || page >= (search.data?.data.pagination.totalPage || 1)}
              onClick={() => {
                setPage(page + 1);
                setDeliveryId(null);
                setSelected(null);
              }}>
              ถัดไป
            </Button>
          </Stack>
          {deliveryId ? (
            <Stack spacing={1}>
              <Typography fontWeight={700}>กล่องที่ยังจัดลงตู้ได้</Typography>
              {sources.isFetching ? (
                <Typography>กำลังโหลดกล่อง...</Typography>
              ) : (
                availableSources.map((source) => (
                  <Stack
                    key={
                      source.scrapBoxId
                        ? `scrap-${source.scrapBoxId}`
                        : `normal-${source.deliveryDetailId}`
                    }
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center">
                    <Stack>
                      <Typography>
                        {source.name} · เหลือ {containerNumberLabel(source.availableCartons)} กล่อง
                      </Typography>
                      {source.scrapBoxId && source.contents?.length ? (
                        <Typography variant="caption" color="text.secondary">
                          {source.contents
                            .map(
                              (item) =>
                                `${item.componentName || item.productName} × ${containerNumberLabel(
                                  item.quantity
                                )}`
                            )
                            .join(', ')}
                        </Typography>
                      ) : null}
                    </Stack>
                    <Button
                      disabled={busy || !source.availableCartons || source.availableCartons <= 0}
                      onClick={() => choose(source)}>
                      เลือกกล่องนี้
                    </Button>
                  </Stack>
                ))
              )}
            </Stack>
          ) : null}
          {selected ? (
            <Stack spacing={1} sx={{ border: '1px solid', borderColor: 'divider', p: 2 }}>
              <Typography fontWeight={700}>{selected.name}</Typography>
              <TextField
                size="small"
                type="number"
                label="จำนวนกล่องที่จัดลงตู้"
                value={count}
                disabled={busy || !!selected.scrapBoxId}
                onChange={(e) => setCount(e.target.value)}
                inputProps={{ min: 1, max: selected.availableCartons, step: 1 }}
              />
              {partial ? (
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={uniform}
                      disabled={busy || !selected.canSplit}
                      onChange={(e) => setUniform(e.target.checked)}
                    />
                  }
                  label="ยืนยันว่าจำนวนชิ้น น้ำหนัก และขนาดเท่ากันทุกกล่อง"
                />
              ) : null}
              {partial && !selected.canSplit ? (
                <Alert severity="warning">ข้อมูลต่อกล่องไม่ครบ ไม่สามารถแบ่งบางกล่องได้</Alert>
              ) : null}
              <Button variant="contained" disabled={busy} onClick={() => void add()}>
                จัดลงตู้
              </Button>
            </Stack>
          ) : null}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button disabled={busy} onClick={onClose}>
          ปิด
        </Button>
      </DialogActions>
    </Dialog>
  );
}
