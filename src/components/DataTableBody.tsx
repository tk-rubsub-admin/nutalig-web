import { TableBody, TableRow, TableCell } from '@mui/material';
import { makeStyles } from '@mui/styles';
import { useTranslation } from 'react-i18next';
import { validateUserNoData } from 'utils/validate';

const useStyles = makeStyles({
  noResultMessage: {
    textAlign: 'center',
    fontSize: '1.2em',
    fontWeight: 'bold',
    padding: '48px 0'
  }
});

interface DataTableBodyProps {
  data: any;
  numberOfColumns: number;
}

export default function DataTableBody({ data, numberOfColumns }: DataTableBodyProps): JSX.Element {
  const classes = useStyles();
  const { t } = useTranslation();

  if (validateUserNoData(data)) {
    return <TableBody>{data}</TableBody>;
  }
  return (
    <TableBody>
      <TableRow>
        <TableCell colSpan={numberOfColumns}>
          <div className={classes.noResultMessage}>{t('warning.noResultList')}</div>
        </TableCell>
      </TableRow>
    </TableBody>
  );
}
