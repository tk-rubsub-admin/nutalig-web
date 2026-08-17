/* eslint-disable prettier/prettier */
import { Add, Close } from '@mui/icons-material';
import { Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, Grid, Radio, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField } from '@mui/material';
import { makeStyles } from '@mui/styles';
import Paginate from 'components/Paginate';
import { GridSearchSection, TextLineClamp } from 'components/Styled';
import { useFormik } from 'formik';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from 'react-query';
import { searchFreelanceSales } from 'services/FreelanceSale/freelance-sale-api';
import { FreelanceSaleRecord, SearchFreelanceSaleRequest } from 'services/FreelanceSale/freelance-sale-type';

export interface SearchFreelanceSalesDialogProps {
  open: boolean;
  onClose: () => void;
  onSelect: (payload: {
    freelanceSale: FreelanceSaleRecord;
  }) => void;
  onAddNew?: () => void;
  salesId?: string | null;
  initialFreelanceSale?: FreelanceSaleRecord | null;
}

export default function SearchFreelanceSalesDialog(props: SearchFreelanceSalesDialogProps): JSX.Element {
  const {
    open,
    onClose,
    onSelect,
    onAddNew,
    salesId = null,
    initialFreelanceSale = null,
  } = props;
  const { t } = useTranslation();

  const useStyles = makeStyles({
    noResultMessage: {
      textAlign: 'center',
      fontSize: '1.2em',
      fontWeight: 'bold',
    },
    tableHeader: {
      border: '2px solid #e0e0e0',
      fontWeight: 'bold',
      paddingLeft: '10px',
      textAlign: 'center'
    },
  });
  const classes = useStyles();
  const [freelanceSaleFilter, setFreelanceSaleFilter] = useState<SearchFreelanceSaleRequest>({});
  const [page, setPage] = useState<number>(1);
  const [pages, setPages] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [selectedFreelanceSale, setSelectedFreelanceSale] = useState<FreelanceSaleRecord | null>(null);

  const {
    data: freelanceSaleList,
    refetch: freelanceSaleRefetched,
    isFetching: isFreelanceSaleFetching
  } = useQuery(
    ['freelance-sale-search', freelanceSaleFilter, page, pageSize],
    () => searchFreelanceSales({
      ...freelanceSaleFilter,
      page,
      size: pageSize,
      sortBy: 'name',
      sortDirection: 'ASC'
    }),
    {
      enabled: open,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      cacheTime: Infinity,
    }
  );

  const searchFormik = useFormik({
    initialValues: {
      keyword: ''
    },
    enableReinitialize: false,
    onSubmit: (value) => {
      setPage(1);
      setFreelanceSaleFilter({
        keyword: value.keyword.trim()
      });
    }
  });

  const freelanceSales =
    (!isFreelanceSaleFetching &&
      freelanceSaleList?.records &&
      freelanceSaleList.records.length > 0 &&
      freelanceSaleList.records.map((item) => {
        const isSelected = selectedFreelanceSale?.id === item.id;
        const isDisabled = Boolean(
          item.saleCoverage &&
          salesId &&
          item.saleCoverage.trim() !== salesId.trim()
        );

        return (
          <TableRow
            hover
            id={`freelance-sale__index-${item.id}`}
            key={item.id}
            onClick={() => {
              if (isDisabled) return;
              setSelectedFreelanceSale(item);
            }}
            sx={{
              cursor: isDisabled ? 'not-allowed' : 'pointer',
              opacity: isDisabled ? 0.45 : 1,
              backgroundColor: isSelected ? 'rgba(25, 118, 210, 0.08)' : 'inherit',
              '& td': {
                fontWeight: isSelected ? 600 : 400
              },
              '&:hover': {
                backgroundColor: isSelected
                  ? 'rgba(25, 118, 210, 0.12)'
                  : 'rgba(0, 0, 0, 0.04)'
              }
            }}
          >
            <TableCell align="center">
              <Radio checked={isSelected} disabled={isDisabled} />
            </TableCell>

            <TableCell align="center">
              {item.id}
            </TableCell>

            <TableCell>
              <TextLineClamp>{item.name}</TextLineClamp>
            </TableCell>

            <TableCell align="center">
              {item.contactNumber || '-'}
            </TableCell>

            <TableCell>
              <TextLineClamp>{item.saleCoverage || '-'}</TextLineClamp>
            </TableCell>
          </TableRow>
        );
      })) || (
      <TableRow>
        <TableCell colSpan={5}>
          <div className={classes.noResultMessage}>{t('warning.noResultList')}</div>
        </TableCell>
      </TableRow>
    );

  useEffect(() => {
    if (open) {
      setSelectedFreelanceSale(initialFreelanceSale);
    }
  }, [open, initialFreelanceSale]);

  useEffect(() => {
    if (!isFreelanceSaleFetching && freelanceSaleList?.pagination) {
      setPage(freelanceSaleList.pagination.page);
      setPageSize(freelanceSaleList.pagination.size);
      setPages(freelanceSaleList.pagination.totalPage);
    }
  }, [freelanceSaleList]);

  useEffect(() => {
    freelanceSaleRefetched();
  }, [freelanceSaleFilter, pages, page, pageSize, freelanceSaleRefetched]);

  return (
    <Dialog open={open} maxWidth="lg" fullWidth aria-labelledby="search-freelance-sale-dialog">
      <DialogTitle id="search-freelance-sale-dialog">
        ค้นหาเซลล์นอก/เซลล์ฟรีแลนซ์
      </DialogTitle>
      <DialogContent>
        <GridSearchSection container spacing={1}>
          <Grid item xs={12}>
            <TextField
              type="text"
              name="keyword"
              label="ค้นหา"
              fullWidth
              variant="outlined"
              value={searchFormik.values.keyword}
              onChange={({ target }) => {
                searchFormik.setFieldValue('keyword', target.value);
              }}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  searchFormik.handleSubmit();
                }
              }}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
        </GridSearchSection>

        <GridSearchSection container>
          <TableContainer>
            <Table id="freelance_sale_list___table">
              <TableHead>
                <TableRow>
                  <TableCell align="center" className={classes.tableHeader} />
                  <TableCell align="center" className={classes.tableHeader}>
                    ID
                  </TableCell>
                  <TableCell align="center" className={classes.tableHeader}>
                    ชื่อ-นามสกุล
                  </TableCell>
                  <TableCell align="center" className={classes.tableHeader}>
                    เบอร์โทร
                  </TableCell>
                  <TableCell align="center" className={classes.tableHeader}>
                    เซลล์ที่ดูแล
                  </TableCell>
                </TableRow>
              </TableHead>
              {isFreelanceSaleFetching ? (
                <TableBody>
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      <CircularProgress />
                    </TableCell>
                  </TableRow>
                </TableBody>
              ) : (
                <TableBody>{freelanceSales}</TableBody>
              )}
            </Table>
          </TableContainer>
        </GridSearchSection>

        <GridSearchSection container>
          <Grid item xs={12}>
            {isFreelanceSaleFetching ? (
              ' '
            ) : (
              <Paginate
                pagination={freelanceSaleList?.pagination}
                page={page}
                pageSize={pageSize}
                setPage={setPage}
                setPageSize={setPageSize}
                refetch={freelanceSaleRefetched}
                totalRecords={freelanceSaleList?.pagination?.totalRecords}
                isShow={true}
              />
            )}
          </Grid>
        </GridSearchSection>
      </DialogContent>
      <DialogActions>
        <Button
          onClick={onAddNew}
          variant="contained"
          startIcon={<Add />}
          className="btn-indigo-blue"
          disabled={!onAddNew}
        >
          เพิ่มเซลล์นอก/เซลล์ฟรีแลนซ์
        </Button>
        <Button
          onClick={onClose}
          variant="contained"
          startIcon={<Close />}
          className="btn-cool-grey">
          {t('button.cancel')}
        </Button>
        <Button
          variant="contained"
          color="primary"
          disabled={!selectedFreelanceSale}
          onClick={() =>
            onSelect({
              freelanceSale: selectedFreelanceSale as FreelanceSaleRecord
            })
          }
        >
          เลือก
        </Button>
      </DialogActions>
    </Dialog>
  );
}
