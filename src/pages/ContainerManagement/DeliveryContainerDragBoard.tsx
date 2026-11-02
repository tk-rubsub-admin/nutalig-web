import {
  DragEndEvent,
  DragOverlay,
  DndContext,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors
} from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import Inventory2Outlined from '@mui/icons-material/Inventory2Outlined';
import DeleteOutline from '@mui/icons-material/DeleteOutline';
import {
  Alert,
  Box,
  Chip,
  IconButton,
  LinearProgress,
  Paper,
  Stack,
  Typography
} from '@mui/material';
import { useMemo, useState } from 'react';
import { PurchaseOrderDeliverySearchRecord } from 'services/PurchaseOrder/purchase-order-type';
import {
  ContainerSize,
  getContainerCapacityCbm,
  getContainerCbmProgressBand,
  getContainerCbmWarning,
  getContainerCbmUsageRatio
} from 'utils/container-capacity';

const DROP_ZONE = 'container-drop-zone';
const MOCK_RECORD_COUNT = 10;

interface Props {
  records: PurchaseOrderDeliverySearchRecord[];
  containerSize?: ContainerSize | null;
}

function DeliveryCard({
  delivery,
  selected,
  onRemove
}: {
  delivery: PurchaseOrderDeliverySearchRecord;
  selected?: boolean;
  onRemove?: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `delivery-${delivery.id}`,
    data: { delivery }
  });
  return (
    <Paper
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      variant="outlined"
      sx={{
        p: 1.25,
        cursor: 'grab',
        opacity: isDragging ? 0.35 : 1,
        position: 'relative',
        overflow: 'hidden',
        borderColor: selected ? 'primary.main' : '#c89455',
        borderWidth: selected ? 2 : 1,
        bgcolor: '#f4e2c4',
        color: '#4e321d',
        boxShadow: '0 2px 5px rgba(113, 72, 27, 0.14)',
        transform: CSS.Transform.toString(transform),
        touchAction: 'none',
        '&::after': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 6,
          borderBottom: '1px dashed rgba(143, 91, 32, 0.35)',
          pointerEvents: 'none'
        },
        '&:hover': {
          boxShadow: '0 4px 10px rgba(113, 72, 27, 0.22)'
        }
      }}>
      <Stack direction="row" spacing={1} alignItems="flex-start" sx={{ position: 'relative' }}>
        <Inventory2Outlined sx={{ mt: 0.15, color: '#9a632c' }} />
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={0.5}>
            <Typography variant="body2" fontWeight={700} noWrap>
              {delivery.deliveryNo || `เที่ยวส่ง #${delivery.id}`}
            </Typography>
            {selected && onRemove ? (
              <IconButton
                size="small"
                color="error"
                aria-label={`นำ ${delivery.deliveryNo || `เที่ยวส่ง #${delivery.id}`} ออกจากตู้`}
                onPointerDown={(event) => event.stopPropagation()}
                onClick={(event) => {
                  event.stopPropagation();
                  onRemove();
                }}>
                <DeleteOutline fontSize="small" />
              </IconButton>
            ) : null}
          </Stack>
          <Typography variant="caption" display="block" noWrap>
            PO: {delivery.purchaseOrderNo || '-'}
          </Typography>
          <Stack direction="row" spacing={0.5} sx={{ mt: 0.75, flexWrap: 'wrap', rowGap: 0.5 }}>
            {delivery.shippingMethod?.trim().toUpperCase().startsWith('SEA_SHARE_FCL_') ? (
              <Chip size="small" label="แชร์ตู้" color="secondary" sx={{ fontWeight: 700 }} />
            ) : null}
            <Chip
              size="small"
              label={`CBM ${delivery.totalCbm ?? '-'}`}
              sx={{ bgcolor: 'rgba(255,255,255,0.58)', color: 'inherit' }}
            />
            <Chip
              size="small"
              label={`${delivery.totalCartons ?? '-'} กล่อง`}
              sx={{ bgcolor: 'rgba(255,255,255,0.58)', color: 'inherit' }}
            />
          </Stack>
        </Box>
      </Stack>
    </Paper>
  );
}

function ContainerDropZone({
  deliveries,
  totalCbm,
  containerSize,
  onRemove
}: {
  deliveries: PurchaseOrderDeliverySearchRecord[];
  totalCbm: number;
  containerSize?: ContainerSize | null;
  onRemove: (id: number) => void;
}) {
  const { isOver, setNodeRef } = useDroppable({ id: DROP_ZONE });
  const capacity = getContainerCapacityCbm(containerSize);
  const warning = getContainerCbmWarning(containerSize, totalCbm);
  const usageRatio = getContainerCbmUsageRatio(containerSize, totalCbm);
  const progressBand = getContainerCbmProgressBand(containerSize, totalCbm);
  const progressColor =
    progressBand === 'OVER_CAPACITY'
      ? '#d32f2f'
      : progressBand === 'NEAR_FULL'
      ? '#ed6c02'
      : progressBand === 'WARNING'
      ? '#edc02f'
      : undefined;
  return (
    <Paper
      ref={setNodeRef}
      variant="outlined"
      sx={{
        minHeight: 230,
        p: 2,
        borderStyle: 'dashed',
        borderColor: isOver ? 'primary.main' : 'divider',
        bgcolor: isOver ? 'rgba(227, 242, 253, 0.9)' : 'rgba(255, 255, 255, 0.88)',
        transition: 'background-color 120ms ease, border-color 120ms ease'
      }}>
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
        <Box>
          <Typography variant="subtitle1" fontWeight={700}>
            ตู้คอนเทนเนอร์
          </Typography>
          <Typography variant="caption" color="text.secondary">
            ลากเที่ยวส่งจากฝั่งซ้ายมาวางที่นี่
          </Typography>
        </Box>
        <Chip
          color="primary"
          size="medium"
          label={`รวม CBM ${totalCbm.toLocaleString('th-TH', { maximumFractionDigits: 6 })}`}
          sx={{
            height: 32,
            fontWeight: 800,
            fontSize: '0.9rem',
            boxShadow: 2,
            whiteSpace: 'nowrap'
          }}
        />
      </Stack>
      <Box sx={{ mt: 1.5 }}>
        <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
          <Typography variant="caption" color="text.secondary">
            การใช้พื้นที่ตู้
          </Typography>
          <Typography variant="caption" fontWeight={700}>
            {(usageRatio * 100).toFixed(0)}%
          </Typography>
        </Stack>
        <LinearProgress
          variant="determinate"
          value={Math.min(100, Math.max(0, usageRatio * 100))}
          sx={{
            height: 8,
            borderRadius: 4,
            ...(progressColor
              ? { '& .MuiLinearProgress-bar': { backgroundColor: progressColor } }
              : {})
          }}
        />
      </Box>
      {warning !== 'NONE' ? (
        <Alert severity={warning === 'OVER_CAPACITY' ? 'error' : 'warning'} sx={{ mt: 1.5 }}>
          {warning === 'OVER_CAPACITY'
            ? `CBM เกินความจุตู้ ${containerSize || ''} แล้ว ${(totalCbm - capacity).toLocaleString(
                'th-TH',
                { maximumFractionDigits: 6 }
              )} CBM`
            : `ใช้ความจุตู้แล้ว ${(usageRatio * 100).toFixed(0)}% (ใกล้เต็ม)`}
        </Alert>
      ) : null}
      <Box
        sx={{
          mt: 1.5,
          p: 1.5,
          minHeight: 240,
          borderRadius: 1,
          backgroundImage: 'url("/shipping_container.jpg")',
          backgroundSize: '100% 100%',
          backgroundPosition: 'center'
        }}>
        <Box
          sx={{
            display: 'grid',
            width: '100%',
            maxWidth: 720,
            mx: 'auto',
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))' },
            gridAutoRows: 'minmax(100px, auto)',
            gap: 1.5
          }}>
          {deliveries.map((delivery) => (
            <DeliveryCard
              key={delivery.id}
              delivery={delivery}
              selected
              onRemove={() => onRemove(delivery.id)}
            />
          ))}
          {!deliveries.length ? (
            <Typography
              color="text.secondary"
              sx={{ py: 5, textAlign: 'center', gridColumn: '1 / -1' }}>
              ยังไม่มีเที่ยวส่งในตู้นี้
            </Typography>
          ) : null}
        </Box>
      </Box>
    </Paper>
  );
}

export default function DeliveryContainerDragBoard({ records, containerSize }: Props) {
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [active, setActive] = useState<PurchaseOrderDeliverySearchRecord | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));
  const displayRecords = useMemo(() => {
    if (!import.meta.env.DEV || records.length >= MOCK_RECORD_COUNT || records.length === 0) {
      return records;
    }
    const baseId = Math.max(...records.map((record) => record.id), 0) + 100000;
    const template = records[0];
    return [
      ...records,
      ...Array.from({ length: MOCK_RECORD_COUNT - records.length }, (_, index) => ({
        ...template,
        id: baseId + index,
        deliveryNo: `${template.deliveryNo || `เที่ยวส่ง-${template.id}`}-MOCK-${index + 1}`,
        purchaseOrderNo: `${template.purchaseOrderNo || 'PO'}-MOCK-${index + 1}`
      }))
    ];
  }, [records]);
  const eligible = useMemo(
    () =>
      displayRecords.filter(
        (record) =>
          record.containerStatus === 'NOT_ASSIGNED' ||
          record.containerStatus === 'PARTIALLY_ASSIGNED'
      ),
    [displayRecords]
  );
  const selected = selectedIds
    .map((id) => eligible.find((record) => record.id === id))
    .filter((record): record is PurchaseOrderDeliverySearchRecord => !!record);
  const totalCbm = selected.reduce((sum, delivery) => sum + Number(delivery.totalCbm || 0), 0);
  const left = eligible.filter((record) => !selectedIds.includes(record.id));
  const onDragEnd = ({ active: activeItem, over }: DragEndEvent) => {
    setActive(null);
    if (over?.id !== DROP_ZONE) return;
    const delivery = activeItem.data.current?.delivery as
      | PurchaseOrderDeliverySearchRecord
      | undefined;
    if (delivery && !selectedIds.includes(delivery.id))
      setSelectedIds((ids) => [...ids, delivery.id]);
  };
  return (
    <DndContext
      sensors={sensors}
      onDragStart={({ active: item }) => setActive(item.data.current?.delivery || null)}
      onDragCancel={() => setActive(null)}
      onDragEnd={onDragEnd}>
      <Box sx={{ mt: 2 }}>
        <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1 }}>
          จัดเที่ยวส่งลงตู้
        </Typography>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
          <Paper variant="outlined" sx={{ p: 2, flex: 1, minHeight: 230 }}>
            <Typography variant="subtitle1" fontWeight={700}>
              เที่ยวส่งที่เลือกได้
            </Typography>
            <Typography variant="caption" color="text.secondary">
              เฉพาะเที่ยวส่งที่ยังจัดตู้ไม่ครบ
            </Typography>
            <Box
              sx={{
                mt: 1.5,
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))' },
                gap: 1
              }}>
              {left.map((delivery) => (
                <DeliveryCard key={delivery.id} delivery={delivery} />
              ))}
              {!left.length ? (
                <Typography
                  color="text.secondary"
                  sx={{ py: 5, textAlign: 'center', gridColumn: '1 / -1' }}>
                  ไม่มีเที่ยวส่งที่เลือกได้
                </Typography>
              ) : null}
            </Box>
          </Paper>
          <Box sx={{ flex: 1 }}>
            <ContainerDropZone
              deliveries={selected}
              totalCbm={totalCbm}
              containerSize={containerSize}
              onRemove={(id) => setSelectedIds((ids) => ids.filter((value) => value !== id))}
            />
          </Box>
        </Stack>
      </Box>
      <DragOverlay>{active ? <DeliveryCard delivery={active} /> : null}</DragOverlay>
    </DndContext>
  );
}
