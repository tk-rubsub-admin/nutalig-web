import styled from 'styled-components';
import {
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer as MUITableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import { isMobileOnly } from 'react-device-detect';

export interface TableColumn {
  key: string;
  name: string;
  hidden: boolean;
  width: string | 'auto';
}
interface TableContainerProps {
  columns: TableColumn[];
  isFetching?: boolean;
  data: JSX.Element | JSX.Element[];
}

const HeaderTableCell = styled.div`
  border-left: 2px solid #e0e0e0;
  font-weight: 500;
  padding-left: 16px;
`;

export default function TableContainer({
  columns,
  isFetching,
  data
}: TableContainerProps): JSX.Element {
  return (
    <MUITableContainer>
      <Table>
        <TableHead>
          <TableRow>
            {columns.map(({ key, name, hidden, width }) => (
              <TableCell
                key={key}
                hidden={hidden}
                width={width}>
                {isMobileOnly ? <div>{name}</div> : <HeaderTableCell>{name}</HeaderTableCell>}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        {isFetching ? (
          <TableBody>
            <TableRow>
              <TableCell colSpan={columns.length} align="center">
                <CircularProgress />
              </TableCell>
            </TableRow>
          </TableBody>
        ) : (
          <TableBody>{data}</TableBody>
        )}
      </Table>
    </MUITableContainer>
  );
}
