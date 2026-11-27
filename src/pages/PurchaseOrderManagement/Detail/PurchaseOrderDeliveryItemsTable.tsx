import {
  CircularProgress,
  Chip,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography
} from '@mui/material';
import { CameraAlt, Description } from '@mui/icons-material';
import { Fragment } from 'react';
import {
  PurchaseOrderDeliveryRecord,
  PurchaseOrderDeliveryScrapBox
} from 'services/PurchaseOrder/purchase-order-type';

type DeliveryDetail = PurchaseOrderDeliveryRecord['details'][number];
type Dimensions = Pick<PurchaseOrderDeliveryScrapBox, 'lengthCm' | 'widthCm' | 'heightCm'>;

function numberLabel(value?: number | null, precision = 3): string {
  return value == null
    ? '-'
    : Number(value).toLocaleString('th-TH', { maximumFractionDigits: precision });
}

function dimensionLabel(value: Dimensions): string {
  const dimensions = [value.lengthCm, value.widthCm, value.heightCm];
  return dimensions.every((dimension) => dimension == null)
    ? '-'
    : `${dimensions.map((dimension) => numberLabel(dimension)).join(' × ')} cm`;
}

function receiveStatusLabel(detail: DeliveryDetail): string {
  return detail.receiveStatus === 'RECEIVED_AT_WAREHOUSE' ? 'รับเข้าคลังแล้ว' : 'รอรับเข้าคลัง';
}

function canReceiveDetail(delivery: PurchaseOrderDeliveryRecord, detail: DeliveryDetail): boolean {
  return (
    (delivery.status === 'IN_TRANSIT' || delivery.status === 'PARTIALLY_RECEIVED') &&
    detail.receiveStatus === 'PENDING'
  );
}

function ProductCell({ detail, scrapBox = false }: { detail: DeliveryDetail; scrapBox?: boolean }) {
  return (
    <TableCell>
      <Typography variant="body2" fontWeight={600}>
        {scrapBox ? ' [กล่องเศษ] - ' : ''}
        {detail.componentName || '-'}
      </Typography>
    </TableCell>
  );
}

// One set of physical box measurements spans all of its component rows.
function ScrapBoxRows({
  box,
  items,
  delivery,
  generatingCartonLabelId,
  onGenerateCartonLabel,
  warehouseView = false,
  onReceive
}: {
  box: PurchaseOrderDeliveryScrapBox;
  items: DeliveryDetail[];
  delivery: PurchaseOrderDeliveryRecord;
  generatingCartonLabelId?: number | null;
  onGenerateCartonLabel?: (
    delivery: PurchaseOrderDeliveryRecord,
    detail: DeliveryDetail
  ) => void;
  warehouseView?: boolean;
  onReceive?: (delivery: PurchaseOrderDeliveryRecord, detail: DeliveryDetail) => void;
}) {
  const mergedCellStyle = { verticalAlign: 'middle' };
  return (
    <Fragment>
      {items.map((detail, index) => (
        <TableRow key={detail.id ?? `${detail.purchaseOrderDetailId}-${index}`}>
          <ProductCell detail={detail} scrapBox />
          <TableCell align="right">{numberLabel(detail.quantity)}</TableCell>
          {index === 0 ? (
            <TableCell align="right" rowSpan={items.length} sx={mergedCellStyle}>
              1
            </TableCell>
          ) : null}
          {index === 0 ? (
            <Fragment>
              {warehouseView ? (
                <>
                  <TableCell align="right" rowSpan={items.length} sx={mergedCellStyle}>-</TableCell>
                  <TableCell rowSpan={items.length} sx={mergedCellStyle}>
                    <Chip size="small" label={receiveStatusLabel(detail)} color={detail.receiveStatus === 'RECEIVED_AT_WAREHOUSE' ? 'success' : 'default'} />
                  </TableCell>
                </>
              ) : (
                <>
                  <TableCell align="right" rowSpan={items.length} sx={mergedCellStyle}>-</TableCell>
                  <TableCell align="right" rowSpan={items.length} sx={mergedCellStyle}>{numberLabel(box.netWeightKg)}</TableCell>
                  <TableCell align="right" rowSpan={items.length} sx={mergedCellStyle}>{numberLabel(box.grossWeightKg)}</TableCell>
                  <TableCell rowSpan={items.length} sx={mergedCellStyle}>{dimensionLabel(box)}</TableCell>
                  <TableCell align="right" rowSpan={items.length} sx={mergedCellStyle}>{numberLabel(box.cbmM3, 6)}</TableCell>
                </>
              )}
            </Fragment>
          ) : null}
          {!warehouseView ? <TableCell align="center">
            {detail.id && onGenerateCartonLabel ? (
              <Tooltip title="Generate ใบแปะข้างกล่อง">
                <span>
                  <IconButton
                    size="small"
                    color="primary"
                    disabled={generatingCartonLabelId === detail.id}
                    onClick={() => onGenerateCartonLabel(delivery, detail)}>
                    {generatingCartonLabelId === detail.id ? <CircularProgress size={20} /> : <Description fontSize="small" />}
                  </IconButton>
                </span>
              </Tooltip>
            ) : null}
          </TableCell> : null}
          {warehouseView ? (
            <TableCell align="center">
              {detail.id && onReceive ? (
                <IconButton
                  size="small"
                  color="primary"
                  disabled={!canReceiveDetail(delivery, detail)}
                  aria-label={`รับสินค้า ${detail.componentName || ''}`}
                  onClick={() => onReceive(delivery, detail)}>
                  <CameraAlt fontSize="small" />
                </IconButton>
              ) : null}
            </TableCell>
          ) : null}
        </TableRow>
      ))}
    </Fragment>
  );
}

export default function PurchaseOrderDeliveryItemsTable({
  delivery,
  generatingCartonLabelId,
  onGenerateCartonLabel,
  warehouseView = false,
  onReceive
}: {
  delivery: PurchaseOrderDeliveryRecord;
  generatingCartonLabelId?: number | null;
  onGenerateCartonLabel?: (
    delivery: PurchaseOrderDeliveryRecord,
    detail: DeliveryDetail
  ) => void;
  warehouseView?: boolean;
  onReceive?: (delivery: PurchaseOrderDeliveryRecord, detail: DeliveryDetail) => void;
}) {
  const boxes = delivery.scrapBoxes || [];
  const boxIds = new Set(boxes.flatMap((box) => (box.id == null ? [] : [box.id])));
  const details = delivery.details || [];
  const normalDetails = details.filter(
    (detail) => detail.scrapBoxId == null || !boxIds.has(detail.scrapBoxId)
  );

  return (
    <TableContainer component={Paper} variant="outlined">
      <Table size="small" sx={{ minWidth: warehouseView ? 720 : 980 }} aria-label="สินค้าและอะไหล่ในเที่ยวส่ง">
        <TableHead>
          <TableRow>
            <TableCell>สินค้า / อะไหล่หรือชิ้นส่วน</TableCell>
            <TableCell align="right">จำนวนชิ้น</TableCell>
            <TableCell align="right">กล่อง</TableCell>
            <TableCell align="right">ชิ้น/กล่อง</TableCell>
            {!warehouseView ? <TableCell align="right">Net (kg)</TableCell> : null}
            {!warehouseView ? <TableCell align="right">Gross (kg)</TableCell> : null}
            {!warehouseView ? <TableCell>Dimension</TableCell> : null}
            {!warehouseView ? <TableCell align="right">CBM (m³)</TableCell> : null}
            {warehouseView ? <TableCell>สถานะ</TableCell> : <TableCell align="center">ใบแปะ</TableCell>}
            {warehouseView ? <TableCell align="center">ดำเนินการ</TableCell> : null}
          </TableRow>
        </TableHead>
        <TableBody>
          {normalDetails.map((detail, index) => (
            <TableRow key={detail.id ?? `normal-${index}`}>
              <ProductCell detail={detail} />
              <TableCell align="right">{numberLabel(detail.quantity)}</TableCell>
              <TableCell align="right">{numberLabel(detail.cartonCount)}</TableCell>
              <TableCell align="right">{numberLabel(detail.piecesPerCarton)}</TableCell>
              {!warehouseView ? <TableCell align="right">{numberLabel(detail.netWeightKg)}</TableCell> : null}
              {!warehouseView ? <TableCell align="right">{numberLabel(detail.grossWeightKg)}</TableCell> : null}
              {!warehouseView ? <TableCell>{dimensionLabel(detail)}</TableCell> : null}
              {!warehouseView ? <TableCell align="right">{numberLabel(detail.cbmM3, 6)}</TableCell> : null}
              {warehouseView ? (
                <TableCell>
                  <Chip size="small" label={receiveStatusLabel(detail)} color={detail.receiveStatus === 'RECEIVED_AT_WAREHOUSE' ? 'success' : 'default'} />
                </TableCell>
              ) : <TableCell align="center">
                {detail.id && onGenerateCartonLabel ? (
                  <Tooltip title="Generate ใบแปะข้างกล่อง">
                    <span>
                      <IconButton
                        size="small"
                        color="primary"
                        disabled={generatingCartonLabelId === detail.id}
                        onClick={() => onGenerateCartonLabel(delivery, detail)}>
                        {generatingCartonLabelId === detail.id ? <CircularProgress size={20} /> : <Description fontSize="small" />}
                      </IconButton>
                    </span>
                  </Tooltip>
                ) : null}
              </TableCell>}
              {warehouseView ? (
                <TableCell align="center">
                  {detail.id && onReceive ? (
                    <IconButton
                      size="small"
                      color="primary"
                      disabled={!canReceiveDetail(delivery, detail)}
                      aria-label={`รับสินค้า ${detail.componentName || ''}`}
                      onClick={() => onReceive(delivery, detail)}>
                      <CameraAlt fontSize="small" />
                    </IconButton>
                  ) : null}
                </TableCell>
              ) : null}
            </TableRow>
          ))}
          {boxes
            .filter((box) => box.id != null)
            .map((box) => (
              <ScrapBoxRows
                key={box.id}
                box={box}
                items={details.filter((detail) => detail.scrapBoxId === box.id)}
                delivery={delivery}
                generatingCartonLabelId={generatingCartonLabelId}
                onGenerateCartonLabel={onGenerateCartonLabel}
                warehouseView={warehouseView}
                onReceive={onReceive}
              />
            ))}
          {!details.length ? (
            <TableRow>
              <TableCell colSpan={warehouseView ? 6 : 9} align="center">
                ไม่มีรายการสินค้าในเที่ยวส่งนี้
              </TableCell>
            </TableRow>
          ) : null}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
