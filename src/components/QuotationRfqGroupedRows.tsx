import { TableCell, TableRow, Typography } from '@mui/material';
import { Fragment, ReactNode } from 'react';

type QuotationRfqRow = {
  key: string;
  quotationItem: { sourceRfqId?: string | null };
};

type Props<T extends QuotationRfqRow> = {
  rows: T[];
  fallbackRfqId?: string | null;
  renderRow: (row: T, originalIndex: number) => ReactNode;
};

export default function QuotationRfqGroupedRows<T extends QuotationRfqRow>({
  rows,
  fallbackRfqId,
  renderRow
}: Props<T>): JSX.Element {
  const groups = new Map<string, { row: T; originalIndex: number }[]>();

  rows.forEach((row, originalIndex) => {
    const sourceRfqId = row.quotationItem.sourceRfqId?.trim() || fallbackRfqId?.trim() || '';
    const group = groups.get(sourceRfqId) || [];
    group.push({ row, originalIndex });
    groups.set(sourceRfqId, group);
  });

  return (
    <>
      {Array.from(groups.entries()).map(([sourceRfqId, group]) => (
        <Fragment key={sourceRfqId}>
          <TableRow>
            <TableCell
              colSpan={6}
              component="th"
              scope="rowgroup"
              sx={{ backgroundColor: '#eff6ff', py: 1 }}>
              <Typography variant="body2" fontWeight={700}>
                {sourceRfqId ? `RFQ: ${sourceRfqId}` : 'ไม่ระบุ RFQ'}
              </Typography>
            </TableCell>
          </TableRow>
          {group.map(({ row, originalIndex }) => (
            <Fragment key={row.key}>{renderRow(row, originalIndex)}</Fragment>
          ))}
        </Fragment>
      ))}
    </>
  );
}
