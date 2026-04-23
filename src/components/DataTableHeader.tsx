import { TableCell, TableHead, TableRow } from '@mui/material';
import styled from 'styled-components';

interface DataTableProps {
  headers: TableHeaderProps[];
}

export interface TableHeaderProps {
  text: string;
  style?: string;
  align?: string;
}

const TableHeaderColumn = styled.div`
  border-left: 2px solid #e0e0e0;
  font-weight: bold;
  padding-left: 10px;
`;

export default function DataTableHeader({ headers }: DataTableProps): JSX.Element {
  return (
    <TableHead>
      {headers && headers.length >= 1 ? (
        <TableRow>
          {headers.map((header) => {
            return (
              <TableCell align={header.align || 'center'} key={header.text}>
                <TableHeaderColumn className={header?.style}>{header.text}</TableHeaderColumn>
              </TableCell>
            );
          })}
        </TableRow>
      ) : (
        ''
      )}
    </TableHead>
  );
}
