import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography
} from '@mui/material';
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
  items
}: {
  box: PurchaseOrderDeliveryScrapBox;
  items: DeliveryDetail[];
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
              <TableCell align="right" rowSpan={items.length} sx={mergedCellStyle}>
                -
              </TableCell>
              <TableCell align="right" rowSpan={items.length} sx={mergedCellStyle}>
                {numberLabel(box.netWeightKg)}
              </TableCell>
              <TableCell align="right" rowSpan={items.length} sx={mergedCellStyle}>
                {numberLabel(box.grossWeightKg)}
              </TableCell>
              <TableCell rowSpan={items.length} sx={mergedCellStyle}>
                {dimensionLabel(box)}
              </TableCell>
              <TableCell align="right" rowSpan={items.length} sx={mergedCellStyle}>
                {numberLabel(box.cbmM3, 6)}
              </TableCell>
            </Fragment>
          ) : null}
        </TableRow>
      ))}
    </Fragment>
  );
}

export default function PurchaseOrderDeliveryItemsTable({
  delivery
}: {
  delivery: PurchaseOrderDeliveryRecord;
}) {
  const boxes = delivery.scrapBoxes || [];
  const boxIds = new Set(boxes.flatMap((box) => (box.id == null ? [] : [box.id])));
  const details = delivery.details || [];
  const normalDetails = details.filter(
    (detail) => detail.scrapBoxId == null || !boxIds.has(detail.scrapBoxId)
  );

  return (
    <TableContainer component={Paper} variant="outlined">
      <Table size="small" sx={{ minWidth: 980 }} aria-label="สินค้าและอะไหล่ในเที่ยวส่ง">
        <TableHead>
          <TableRow>
            <TableCell>สินค้า / อะไหล่หรือชิ้นส่วน</TableCell>
            <TableCell align="right">จำนวนชิ้น</TableCell>
            <TableCell align="right">กล่อง</TableCell>
            <TableCell align="right">ชิ้น/กล่อง</TableCell>
            <TableCell align="right">Net (kg)</TableCell>
            <TableCell align="right">Gross (kg)</TableCell>
            <TableCell>Dimension</TableCell>
            <TableCell align="right">CBM (m³)</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {normalDetails.map((detail, index) => (
            <TableRow key={detail.id ?? `normal-${index}`}>
              <ProductCell detail={detail} />
              <TableCell align="right">{numberLabel(detail.quantity)}</TableCell>
              <TableCell align="right">{numberLabel(detail.cartonCount)}</TableCell>
              <TableCell align="right">{numberLabel(detail.piecesPerCarton)}</TableCell>
              <TableCell align="right">{numberLabel(detail.netWeightKg)}</TableCell>
              <TableCell align="right">{numberLabel(detail.grossWeightKg)}</TableCell>
              <TableCell>{dimensionLabel(detail)}</TableCell>
              <TableCell align="right">{numberLabel(detail.cbmM3, 6)}</TableCell>
            </TableRow>
          ))}
          {boxes
            .filter((box) => box.id != null)
            .map((box) => (
              <ScrapBoxRows
                key={box.id}
                box={box}
                items={details.filter((detail) => detail.scrapBoxId === box.id)}
              />
            ))}
          {!details.length ? (
            <TableRow>
              <TableCell colSpan={8} align="center">
                ไม่มีรายการสินค้าในเที่ยวส่งนี้
              </TableCell>
            </TableRow>
          ) : null}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
