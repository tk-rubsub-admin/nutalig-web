import { DisabledByDefault, Search } from '@mui/icons-material';
import { Button, CircularProgress, Grid, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography } from '@mui/material';
import { makeStyles } from '@mui/styles';
import PageTitle from 'components/PageTitle';
import Paginate from 'components/Paginate';
import { GridSearchSection, TextLineClamp, Wrapper } from 'components/Styled';
import { Page } from 'layout/LayoutRoute';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from 'react-query';
import { useHistory } from 'react-router-dom';
import { ROUTE_PATHS } from 'routes';
import { getEmployees } from 'services/Employee/employee-api';
import { EmployeeRecord } from 'services/Employee/employee-type';

function getEmployeeName(employee: EmployeeRecord): string {
  const name = [employee.firstNameTh, employee.lastNameTh].filter(Boolean).join(' ').trim();
  return name || '-';
}

export default function EmployeeManagement(): JSX.Element {
  const useStyles = makeStyles({
    noResultMessage: {
      textAlign: 'center',
      fontSize: '1.2em',
      fontWeight: 'bold',
      padding: '48px 0'
    },
    tableHeader: {
      border: '2px solid #e0e0e0',
      fontWeight: 'bold',
      paddingLeft: '10px',
      textAlign: 'center'
    }
  });

  const classes = useStyles();
  const { t } = useTranslation();
  const history = useHistory();
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [keyword, setKeyword] = useState('');
  const [searchKeyword, setSearchKeyword] = useState('');

  const { data, isFetching, refetch } = useQuery(
    ['employee-list', page, pageSize, searchKeyword],
    () => getEmployees(page, pageSize, searchKeyword),
    {
      refetchOnWindowFocus: false,
      keepPreviousData: true
    }
  );

  const employeeRows = useMemo(() => {
    if (!data?.data?.records?.length) {
      return (
        <TableRow>
          <TableCell colSpan={7}>
            <div className={classes.noResultMessage}>{t('warning.noResultList')}</div>
          </TableCell>
        </TableRow>
      );
    }

    return data.data.records.map((employee) => (
      <TableRow
        hover
        key={employee.employeeId}
        onClick={() =>
          history.push(ROUTE_PATHS.EMPLOYEE_DETAIL.replace(':id', employee.employeeId))
        }
        sx={{ cursor: 'pointer' }}>
        <TableCell align="left">
          <TextLineClamp>{employee.employeeId}</TextLineClamp>
        </TableCell>
        <TableCell align="left">
          <TextLineClamp>{getEmployeeName(employee)}</TextLineClamp>
        </TableCell>
        <TableCell align="left">
          <TextLineClamp>{employee.nickName || '-'}</TextLineClamp>
        </TableCell>
        <TableCell align="left">
          <TextLineClamp>{employee.position?.nameTh || '-'}</TextLineClamp>
        </TableCell>
        <TableCell align="left">
          <TextLineClamp>{employee.team?.nameTh || '-'}</TextLineClamp>
        </TableCell>
        <TableCell align="left">
          <TextLineClamp>{employee.phoneNumber || '-'}</TextLineClamp>
        </TableCell>
        <TableCell align="center">
          <TextLineClamp>{t(`userManagement.status.${employee.status}`)}</TextLineClamp>
        </TableCell>
      </TableRow>
    ));
  }, [classes.noResultMessage, data?.data?.records, history, t]);

  return (
    <Page>
      <PageTitle title={t('employeeManagement.title')} />
      <Wrapper>
        <Grid container spacing={1}>
          <Grid item xs={12} sm={6}>
            <Typography variant="h6" component="h2">
              {t('employeeManagement.searchPanel')}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6} style={{ textAlign: 'right' }}>
            <Button
              variant="contained"
              className="btn-indigo-blue"
              onClick={() => {
                setPage(1);
                setSearchKeyword(keyword);
              }}
              startIcon={<Search />}>
              {t('button.search')}
            </Button>
            &nbsp;&nbsp;
            <Button
              variant="contained"
              className="btn-amber-orange"
              onClick={() => {
                setKeyword('');
                setPage(1);
                setSearchKeyword('');
              }}
              startIcon={<DisabledByDefault />}>
              {t('button.clear')}
            </Button>
          </Grid>
        </Grid>

        <GridSearchSection container spacing={2}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label={t('employeeManagement.column.keyword')}
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  setPage(1);
                  setSearchKeyword(keyword);
                }
              }}
            />
          </Grid>
        </GridSearchSection>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell className={classes.tableHeader}>{t('employeeManagement.column.employeeId')}</TableCell>
                <TableCell className={classes.tableHeader}>{t('employeeManagement.column.name')}</TableCell>
                <TableCell className={classes.tableHeader}>{t('employeeManagement.column.nickName')}</TableCell>
                <TableCell className={classes.tableHeader}>{t('employeeManagement.column.position')}</TableCell>
                <TableCell className={classes.tableHeader}>{t('employeeManagement.column.team')}</TableCell>
                <TableCell className={classes.tableHeader}>{t('employeeManagement.column.phoneNumber')}</TableCell>
                <TableCell className={classes.tableHeader}>{t('employeeManagement.column.status')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isFetching ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : (
                employeeRows
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <GridSearchSection container>
          <Grid item xs={12}>
            <Paginate
              pagination={data?.data.pagination}
              page={page}
              pageSize={pageSize}
              setPage={setPage}
              setPageSize={setPageSize}
              refetch={refetch}
              totalRecords={data?.data.pagination.totalRecords}
              isShow={true}
            />
          </Grid>
        </GridSearchSection>
      </Wrapper>
    </Page>
  );
}
