import { Add, DeleteOutline, Save } from '@mui/icons-material';
import {
  Alert,
  Box,
  Paper,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  MenuItem,
  Stack,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  TextField,
  Typography
} from '@mui/material';
import { ReactNode, useEffect, useState } from 'react';
import { useQuery, useQueryClient } from 'react-query';
import { usePermissions } from 'auth/PermissionContext';
import { PERMISSIONS } from 'auth/permissions';
import ActivityHistoryTimeline from 'components/ActivityHistoryTimeline';
import { getActivityHistory } from 'services/ActivityHistory/activity-history-api';
import { getSupplierShippings } from 'services/Supplier/supplier-api';
import {
  actOnContainer,
  CONTAINER_ACTIONS,
  CONTAINER_STATUS,
  ContainerAction,
  ContainerMetadata,
  DraftContainerLoad,
  containerError,
  containerNumberLabel,
  createContainer,
  getContainer,
  removeContainerLoad,
  ShippingContainer,
  updateContainer
} from 'services/ShippingContainer/shipping-container-api';
import ContainerLoadPicker from './ContainerLoadPicker';
import DraftContainerLoads from './DraftContainerLoads';

type Form = {
  containerSize: '20GP' | '40HQ';
  trackingNo: string;
  containerNo: string;
  sealNo: string;
  supplierShippingId: string;
  destinationId: string;
  origin: string;
  plannedDepartureDate: string;
  plannedArrivalDate: string;
  capacityCbm: string;
  maxCargoWeightKg: string;
  remark: string;
};
const formOf = (value?: ShippingContainer | null): Form => ({
  containerSize: value?.containerSize || '20GP',
  trackingNo: value?.trackingNo || '',
  containerNo: value?.containerNo || '',
  sealNo: value?.sealNo || '',
  supplierShippingId: value?.supplierShippingId ? String(value.supplierShippingId) : '',
  destinationId: value?.destinationId ? String(value.destinationId) : '',
  origin: value?.origin || '',
  plannedDepartureDate: value?.plannedDepartureDate || '',
  plannedArrivalDate: value?.plannedArrivalDate || '',
  capacityCbm: value?.capacityCbm == null ? '' : String(value.capacityCbm),
  maxCargoWeightKg: value?.maxCargoWeightKg == null ? '' : String(value.maxCargoWeightKg),
  remark: value?.remark || ''
});
export interface ShippingContainerEditorProps {
  open: boolean;
  id: number | null;
  onClose: () => void;
  onUpdated: () => void;
  onCreated?: (id: number) => void;
  variant?: 'dialog' | 'page';
}
function EditorFrame({
  variant,
  open,
  onClose,
  children
}: {
  variant: 'dialog' | 'page';
  open: boolean;
  onClose: () => void;
  children: ReactNode;
}) {
  return variant === 'page' ? (
    <Paper variant="outlined">{children}</Paper>
  ) : (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth scroll="paper">
      {children}
    </Dialog>
  );
}

export default function ShippingContainerEditor({
  open,
  id,
  onClose,
  onUpdated,
  onCreated,
  variant = 'dialog'
}: ShippingContainerEditorProps) {
  const { has } = usePermissions();
  const client = useQueryClient();
  const [container, setContainer] = useState<ShippingContainer | null>(null);
  const [form, setForm] = useState<Form>(formOf());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [picker, setPicker] = useState(false);
  const [action, setAction] = useState<ContainerAction | null>(null);
  const [reason, setReason] = useState('');
  const [tab, setTab] = useState(0);
  const [pendingLoads, setPendingLoads] = useState<DraftContainerLoad[]>([]);
  const fetched = useQuery(['shipping-container', id], () => getContainer(id!), {
    enabled: open && id !== null,
    refetchOnWindowFocus: false
  });
  const shippings = useQuery(['container-shippings'], getSupplierShippings, {
    enabled: open,
    refetchOnWindowFocus: false
  });
  const history = useQuery(
    ['shipping-container-history', container?.id, container?.version],
    () => getActivityHistory('SHIPPING_CONTAINER', String(container!.id)),
    { enabled: open && !!container && tab === 1 }
  );
  useEffect(() => {
    if (open) {
      setError('');
      setPicker(false);
      setAction(null);
      setReason('');
      setTab(0);
      setPendingLoads([]);
      setContainer(null);
      setForm(formOf());
    }
  }, [open, id]);
  useEffect(() => {
    if (open && id && fetched.data) {
      setContainer(fetched.data);
      setForm(formOf(fetched.data));
    }
  }, [open, id, fetched.data]);
  const accept = (value: ShippingContainer) => {
    setContainer(value);
    setForm(formOf(value));
    client.setQueryData(['shipping-container', value.id], value);
    onUpdated();
    if (!container && id === null) onCreated?.(value.id);
  };
  const run = async (operation: () => Promise<ShippingContainer>) => {
    setBusy(true);
    setError('');
    try {
      accept(await operation());
      return true;
    } catch (e) {
      setError(containerError(e));
      return false;
    } finally {
      setBusy(false);
    }
  };
  const mutable = !container || ['DRAFT', 'LOADING'].includes(container.status);
  const canEdit =
    mutable &&
    (container
      ? has(PERMISSIONS.CONTAINER_EDIT)
      : id === null && has(PERMISSIONS.CONTAINER_CREATE));
  const disabled = busy || !canEdit || (id !== null && fetched.isFetching);
  const routeLocked = disabled || !!container?.loads.length || pendingLoads.length > 0;
  const dirty = JSON.stringify(form) !== JSON.stringify(formOf(container));
  const options = (shippings.data || []).filter(
    (shipping) => shipping.shippingMethod === 'SEA' && shipping.shippingMode === 'FCL'
  );
  const selectedShipping = options.find(
    (shipping) => String(shipping.id) === form.supplierShippingId
  );
  const update = (field: keyof Form, value: string) =>
    setForm((current) => ({ ...current, [field]: value }));
  const persist = () => {
    const metadata: ContainerMetadata = {
      ...form,
      version: container?.version,
      supplierShippingId: form.supplierShippingId ? Number(form.supplierShippingId) : null,
      destinationId: form.destinationId ? Number(form.destinationId) : null,
      plannedDepartureDate: form.plannedDepartureDate || null,
      plannedArrivalDate: form.plannedArrivalDate || null,
      capacityCbm: form.capacityCbm ? Number(form.capacityCbm) : null,
      maxCargoWeightKg: form.maxCargoWeightKg ? Number(form.maxCargoWeightKg) : null
    };
    if (
      [metadata.capacityCbm, metadata.maxCargoWeightKg].some(
        (value) => value != null && (!Number.isFinite(value) || value < 0)
      )
    ) {
      setError('ความจุและน้ำหนักต้องเป็นตัวเลขตั้งแต่ 0 ขึ้นไป');
      return;
    }
    if (!container && pendingLoads.length === 0) {
      setError('กรุณาเลือกกล่องอย่างน้อย 1 รายการก่อนยืนยันสร้างตู้');
      return;
    }
    void run(() =>
      container
        ? updateContainer(container.id, metadata)
        : createContainer({
          ...metadata,
          loads: pendingLoads.map((row) => row.request)
        })
    );
  };
  const actions: ContainerAction[] =
    container?.status === 'DRAFT'
      ? ['START_LOADING']
      : container?.status === 'LOADING'
        ? ['SEAL']
        : container?.status === 'SEALED'
          ? ['DEPART', 'REOPEN']
          : container?.status === 'IN_TRANSIT'
            ? ['RECEIVE']
            : [];
  const needsReason = action === 'CANCEL' || action === 'REOPEN';
  return (
    <>
      <EditorFrame
        variant={variant}
        open={open}
        onClose={() => {
          if (!busy) onClose();
        }}>
        <Box sx={{ px: 3, py: 2 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">
              {container?.containerJobNo || 'สร้างตู้คอนเทนเนอร์'}
            </Typography>
            {container ? <Chip label={CONTAINER_STATUS[container.status]} /> : null}
          </Stack>
        </Box>
        <Box sx={{ p: 3, borderTop: 1, borderBottom: 1, borderColor: 'divider', overflow: 'auto' }}>
          <Stack spacing={2}>
            {fetched.isError ? (
              <Alert severity="error">
                ไม่สามารถโหลดข้อมูลตู้ได้{' '}
                <Button onClick={() => void fetched.refetch()}>ลองอีกครั้ง</Button>
              </Alert>
            ) : null}
            {error ? (
              <Alert severity="error">
                {error}
                {id ? (
                  <Button disabled={busy} onClick={() => void fetched.refetch()}>
                    โหลดข้อมูลใหม่
                  </Button>
                ) : null}
              </Alert>
            ) : null}
            {id && fetched.isFetching && !container ? <CircularProgress /> : null}
            <Tabs value={tab} onChange={(_, next) => setTab(next)}>
              <Tab label="ข้อมูลและรายการจัดตู้" />
              <Tab label="ประวัติ" disabled={!container} />
            </Tabs>
            {tab === 1 ? (
              history.isError ? (
                <Alert severity="error">โหลดประวัติไม่สำเร็จ</Alert>
              ) : history.isFetching ? (
                <CircularProgress size={24} />
              ) : (
                <ActivityHistoryTimeline records={history.data || []} />
              )
            ) : (
              <>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      select
                      fullWidth
                      label="ขนาดตู้"
                      value={form.containerSize}
                      InputLabelProps={{ shrink: true }}
                      disabled={routeLocked}
                      onChange={(e) => update('containerSize', e.target.value)}>
                      <MenuItem value="20GP">20GP</MenuItem>
                      <MenuItem value="40HQ">40HQ</MenuItem>
                    </TextField>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="หมายเลข Tracking"
                      value={form.trackingNo}
                      InputLabelProps={{ shrink: true }}
                      disabled={disabled}
                      inputProps={{ maxLength: 50 }}
                      onChange={(e) => update('trackingNo', e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="หมายเลขตู้จริง"
                      value={form.containerNo}
                      InputLabelProps={{ shrink: true }}
                      disabled={disabled}
                      inputProps={{ maxLength: 50 }}
                      onChange={(e) => update('containerNo', e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="หมายเลขซีล"
                      value={form.sealNo}
                      InputLabelProps={{ shrink: true }}
                      disabled={disabled}
                      inputProps={{ maxLength: 100 }}
                      onChange={(e) => update('sealNo', e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      select
                      fullWidth
                      label="ผู้ให้บริการขนส่งปิดตู้"
                      InputLabelProps={{ shrink: true }}
                      value={form.supplierShippingId}
                      disabled={routeLocked || shippings.isFetching}
                      onChange={(e) =>
                        setForm((current) => ({
                          ...current,
                          supplierShippingId: e.target.value,
                          destinationId: ''
                        }))
                      }>
                      <MenuItem value="">ยังไม่ระบุ</MenuItem>
                      {options.map((shipping) => (
                        <MenuItem key={shipping.id} value={String(shipping.id)}>
                          {shipping.shippingName || shipping.carCode || `ขนส่ง #${shipping.id}`}
                        </MenuItem>
                      ))}
                      {form.supplierShippingId && !selectedShipping ? (
                        <MenuItem value={form.supplierShippingId}>
                          {container?.carrierName || form.supplierShippingId}
                        </MenuItem>
                      ) : null}
                    </TextField>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      select
                      fullWidth
                      label="ปลายทาง"
                      InputLabelProps={{ shrink: true }}
                      value={form.destinationId}
                      disabled={routeLocked || !selectedShipping}
                      onChange={(e) => update('destinationId', e.target.value)}>
                      <MenuItem value="">ยังไม่ระบุ</MenuItem>
                      {(selectedShipping?.destinations || []).map((destination) => (
                        <MenuItem key={destination.id} value={String(destination.id)}>
                          {destination.destinationName}
                        </MenuItem>
                      ))}
                      {form.destinationId &&
                        !(selectedShipping?.destinations || []).some(
                          (destination) => String(destination.id) === form.destinationId
                        ) ? (
                        <MenuItem value={form.destinationId}>
                          {container?.destinationName || form.destinationId}
                        </MenuItem>
                      ) : null}
                    </TextField>
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="ต้นทาง"
                      InputLabelProps={{ shrink: true }}
                      value={form.origin}
                      disabled={disabled}
                      inputProps={{ maxLength: 255 }}
                      onChange={(e) => update('origin', e.target.value)}
                    />
                  </Grid>
                  {(
                    [
                      ['plannedDepartureDate', 'กำหนดออกเดินทาง'],
                      ['plannedArrivalDate', 'กำหนดถึงปลายทาง']
                    ] as const
                  ).map(([field, label]) => (
                    <Grid item xs={12} sm={6} key={field}>
                      <TextField
                        type="date"
                        fullWidth
                        label={label}
                        InputLabelProps={{ shrink: true }}
                        value={form[field]}
                        disabled={disabled}
                        onChange={(e) => update(field, e.target.value)}
                      />
                    </Grid>
                  ))}
                  <Grid item xs={12}>
                    <TextField
                      multiline
                      minRows={2}
                      fullWidth
                      label="หมายเหตุ"
                      InputLabelProps={{ shrink: true }}
                      value={form.remark}
                      disabled={disabled}
                      inputProps={{ maxLength: 2000 }}
                      onChange={(e) => update('remark', e.target.value)}
                    />
                  </Grid>
                </Grid>
                {shippings.isError ? (
                  <Alert severity="error">
                    โหลดผู้ให้บริการขนส่งไม่สำเร็จ{' '}
                    <Button onClick={() => void shippings.refetch()}>ลองอีกครั้ง</Button>
                  </Alert>
                ) : null}
                {canEdit && container ? (
                  <Button
                    sx={{ alignSelf: 'flex-end' }}
                    variant="contained"
                    startIcon={<Save />}
                    disabled={disabled}
                    onClick={() => persist()}>
                    บันทึกข้อมูลตู้
                  </Button>
                ) : null}
                {!container && id === null ? (
                  <>
                    <DraftContainerLoads
                      route={{
                        containerSize: form.containerSize,
                        shippingMethod: `SEA_FCL_${form.containerSize}`,
                        supplierShippingId: form.supplierShippingId
                          ? Number(form.supplierShippingId)
                          : null,
                        destinationId: form.destinationId ? Number(form.destinationId) : null
                      }}
                      loads={pendingLoads}
                      busy={busy}
                      onChange={setPendingLoads}
                    />
                    {has(PERMISSIONS.CONTAINER_CREATE) ? (
                      <Button
                        variant="contained"
                        sx={{ alignSelf: 'flex-end' }}
                        disabled={busy || pendingLoads.length === 0}
                        onClick={persist}>
                        ยืนยันสร้างตู้
                      </Button>
                    ) : null}
                  </>
                ) : null}
                {container ? (
                  <>
                    <Stack
                      direction={{ xs: 'column', sm: 'row' }}
                      justifyContent="space-between"
                      spacing={1}>
                      <Typography>
                        รวม {containerNumberLabel(container.totalCartons)} กล่อง ·{' '}
                        {containerNumberLabel(container.totalCbm)} CBM · Gross{' '}
                        {containerNumberLabel(container.totalGrossWeightKg)} kg
                      </Typography>
                      {mutable && has(PERMISSIONS.CONTAINER_EDIT) ? (
                        <Button
                          startIcon={<Add />}
                          variant="outlined"
                          disabled={
                            busy ||
                            fetched.isFetching ||
                            dirty ||
                            !container.supplierShippingId ||
                            !container.destinationId
                          }
                          onClick={() => setPicker(true)}>
                          เพิ่มกล่องลงตู้
                        </Button>
                      ) : null}
                    </Stack>
                    {dirty ? (
                      <Alert severity="info">
                        บันทึกการแก้ไขข้อมูลก่อนเพิ่มกล่องหรือเปลี่ยนสถานะ
                      </Alert>
                    ) : null}
                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>PO / เที่ยวส่ง</TableCell>
                            <TableCell>รายการ</TableCell>
                            <TableCell align="right">กล่อง</TableCell>
                            <TableCell align="right">Net (kg)</TableCell>
                            <TableCell align="right">Gross (kg)</TableCell>
                            <TableCell align="right">CBM</TableCell>
                            <TableCell>จัดการ</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {container.loads.map((load) => (
                            <TableRow key={load.id}>
                              <TableCell>
                                {load.purchaseOrderNo}
                                <Typography variant="caption" display="block">
                                  {load.deliveryNo}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2">{load.componentName}</Typography>
                                {load.contents.map((item, index) => (
                                  <Typography key={index} variant="caption" display="block">
                                    {item.componentName || item.productName} ×{' '}
                                    {containerNumberLabel(item.quantity)}
                                  </Typography>
                                ))}
                              </TableCell>
                              <TableCell align="right">
                                {containerNumberLabel(load.cartonCount)}
                              </TableCell>
                              <TableCell align="right">
                                {containerNumberLabel(load.netWeightKg)}
                              </TableCell>
                              <TableCell align="right">
                                {containerNumberLabel(load.grossWeightKg)}
                              </TableCell>
                              <TableCell align="right">
                                {containerNumberLabel(load.cbmM3)}
                              </TableCell>
                              <TableCell>
                                {mutable && has(PERMISSIONS.CONTAINER_EDIT) ? (
                                  <Button
                                    color="error"
                                    startIcon={<DeleteOutline />}
                                    disabled={busy || fetched.isFetching || dirty}
                                    onClick={() =>
                                      void run(() =>
                                        removeContainerLoad(
                                          container.id,
                                          load.id,
                                          container.version
                                        )
                                      )
                                    }>
                                    นำออก
                                  </Button>
                                ) : null}
                              </TableCell>
                            </TableRow>
                          ))}
                          {!container.loads.length ? (
                            <TableRow>
                              <TableCell colSpan={7} align="center">
                                ยังไม่มีรายการจัดตู้
                              </TableCell>
                            </TableRow>
                          ) : null}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </>
                ) : null}
              </>
            )}
          </Stack>
        </Box>
        <Stack direction="row" justifyContent="flex-end" sx={{ p: 2, flexWrap: 'wrap', gap: 1 }}>
          {container && has(PERMISSIONS.CONTAINER_EDIT)
            ? actions.map((next) => (
              <Button
                key={next}
                variant="outlined"
                disabled={busy || fetched.isFetching || dirty}
                onClick={() => {
                  setAction(next);
                  setReason('');
                  setError('');
                }}>
                {CONTAINER_ACTIONS[next]}
              </Button>
            ))
            : null}
          {container &&
            ['DRAFT', 'LOADING', 'SEALED'].includes(container.status) &&
            has(PERMISSIONS.CONTAINER_DELETE) ? (
            <Button
              color="error"
              disabled={busy || fetched.isFetching || dirty}
              onClick={() => {
                setAction('CANCEL');
                setReason('');
                setError('');
              }}>
              ยกเลิกตู้
            </Button>
          ) : null}
          <Button disabled={busy} onClick={onClose}>
            {variant === 'page' ? 'กลับรายการตู้' : 'ปิด'}
          </Button>
        </Stack>
      </EditorFrame>
      {container && picker ? (
        <ContainerLoadPicker
          key={container.id}
          container={container}
          open={picker}
          onClose={() => setPicker(false)}
          onChanged={accept}
        />
      ) : null}
      <Dialog
        open={action !== null}
        onClose={() => !busy && setAction(null)}
        maxWidth="xs"
        fullWidth>
        <DialogTitle>{action ? CONTAINER_ACTIONS[action] : ''}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <Typography>ยืนยันดำเนินการกับตู้ {container?.containerJobNo}</Typography>
            {needsReason ? (
              <TextField
                multiline
                minRows={2}
                label="เหตุผล"
                value={reason}
                required
                disabled={busy}
                inputProps={{ maxLength: 2000 }}
                onChange={(e) => setReason(e.target.value)}
              />
            ) : null}
            {error ? <Alert severity="error">{error}</Alert> : null}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button disabled={busy} onClick={() => setAction(null)}>
            กลับ
          </Button>
          <Button
            variant="contained"
            disabled={busy || (needsReason && !reason.trim())}
            onClick={async () => {
              if (
                container &&
                action &&
                (await run(() => actOnContainer(container.id, action, container.version, reason)))
              )
                setAction(null);
            }}>
            ยืนยัน
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
