import { TableCell, TableRow } from '@mui/material';
import { useTranslation } from 'react-i18next';

interface TableRowNoDataProps {
  colSpan: number;
}

export default function TableRowNoData({ colSpan }: TableRowNoDataProps): JSX.Element {
  const { t } = useTranslation();
  return (
    <TableRow>
      <TableCell colSpan={colSpan} align="center">
        {t('warning.noData')}
      </TableCell>
    </TableRow>
  );
}
