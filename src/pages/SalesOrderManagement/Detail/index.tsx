import { ArrowBackIos } from '@mui/icons-material';
import {
  Button,
  Chip,
  CircularProgress,
  Grid,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography
} from '@mui/material';
import { makeStyles } from '@mui/styles';
import PageTitle from 'components/PageTitle';
import { GridSearchSection, Wrapper } from 'components/Styled';
import { Page } from 'layout/LayoutRoute';
import { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from 'react-query';
import { useHistory, useParams } from 'react-router-dom';
import { ROUTE_PATHS } from 'routes';
import { getSalesOrderV1 } from 'services/SaleOrder/sale-order-api';
import { SalesOrderV1 } from 'services/SaleOrder/sale-order-type';
import { formatNumber } from 'utils/utils';

interface SalesOrderDetailParams {
  id: string;
}

function getCustomerLabel(salesOrder?: SalesOrderV1): string {
  const customer = salesOrder?.customer as any;
  if (!customer) return '-';
  return [customer.id ? `(${customer.id})` : '', customer.customerName || customer.companyName || '']
    .filter(Boolean)
    .join(' ') || '-';
}

function getSalesLabel(salesOrder?: SalesOrderV1): string {
  const sales = salesOrder?.saleAccount as any;
  if (!sales) return '-';

  const name = [sales.firstNameTh || sales.firstName, sales.lastNameTh || sales.lastName]
    .filter(Boolean)
    .join(' ');

  return sales.nickName || sales.nickname || sales.displayName || name || sales.employeeId || '-';
}

export default function SalesOrderDetail(): ReactElement {
  const { id } = useParams<SalesOrderDetailParams>();
  const history = useHistory();
  const { t } = useTranslation();
  const useStyles = makeStyles({
    tableHeader: {
      border: '2px solid #e0e0e0',
      fontWeight: 'bold',
      paddingLeft: '10px',
      textAlign: 'center'
    }
  });
  const classes = useStyles();

  const { data: salesOrder, isFetching } = useQuery(
    ['sales-order-detail', id],
    () => getSalesOrderV1(id),
    {
      enabled: Boolean(id),
      refetchOnWindowFocus: false
    }
  );

  return (
    <Page>
      <PageTitle title={salesOrder?.salesOrderNo || 'ใบยืนยันสั่งซื้อ'} />
      <Wrapper>
        <Stack direction="row" justifyContent="flex-end" sx={{ mb: 2 }}>
          <Button
            variant="contained"
            className="btn-cool-grey"
            startIcon={<ArrowBackIos />}
            onClick={() => history.push(ROUTE_PATHS.SALE_ORDER_MANAGEMENT)}>
            {t('button.back')}
          </Button>
        </Stack>

        {isFetching ? (
          <Stack alignItems="center" sx={{ py: 6 }}>
            <CircularProgress />
          </Stack>
        ) : (
          <>
            <GridSearchSection container spacing={2}>
              <Grid item xs={12} sm={3}>
                <Typography color="text.secondary">เลขที่เอกสาร</Typography>
                <Typography fontWeight={700}>{salesOrder?.salesOrderNo || '-'}</Typography>
              </Grid>
              <Grid item xs={12} sm={3}>
                <Typography color="text.secondary">สถานะ</Typography>
                <Chip label={salesOrder?.status || '-'} size="small" />
              </Grid>
              <Grid item xs={12} sm={3}>
                <Typography color="text.secondary">วันที่เอกสาร</Typography>
                <Typography>{salesOrder?.docDate || '-'}</Typography>
              </Grid>
              <Grid item xs={12} sm={3}>
                <Typography color="text.secondary">วันที่หมดอายุ</Typography>
                <Typography>{salesOrder?.expireDate || '-'}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography color="text.secondary">ลูกค้า</Typography>
                <Typography>{getCustomerLabel(salesOrder)}</Typography>
              </Grid>
              <Grid item xs={12} sm={3}>
                <Typography color="text.secondary">เซลล์ที่ดูแล</Typography>
                <Typography>{getSalesLabel(salesOrder)}</Typography>
              </Grid>
              <Grid item xs={12} sm={3}>
                <Typography color="text.secondary">ยอดรวม</Typography>
                <Typography fontWeight={700}>{formatNumber(salesOrder?.grandTotal || 0)}</Typography>
              </Grid>
            </GridSearchSection>

            <GridSearchSection container>
              <TableContainer>
                <Table id="sales_order_detail_items___table">
                  <TableHead>
                    <TableRow>
                      <TableCell align="center" className={classes.tableHeader}>
                        ลำดับ
                      </TableCell>
                      <TableCell className={classes.tableHeader}>สินค้า</TableCell>
                      <TableCell align="center" className={classes.tableHeader}>
                        จำนวน
                      </TableCell>
                      <TableCell align="right" className={classes.tableHeader}>
                        ราคาต่อหน่วย
                      </TableCell>
                      <TableCell align="right" className={classes.tableHeader}>
                        รวม
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(salesOrder?.items || []).map((item: any, index: number) => (
                      <TableRow key={item.id || item.lineNo || index}>
                        <TableCell align="center">{item.lineNo || index + 1}</TableCell>
                        <TableCell>
                          <Stack spacing={0.5}>
                            <Typography>{item.name || '-'}</Typography>
                            {item.spec ? (
                              <Typography variant="body2" color="text.secondary">
                                {item.spec}
                              </Typography>
                            ) : null}
                          </Stack>
                        </TableCell>
                        <TableCell align="center">{formatNumber(item.quantity || 0)}</TableCell>
                        <TableCell align="right">{formatNumber(item.unitPrice || 0)}</TableCell>
                        <TableCell align="right">{formatNumber(item.amount || 0)}</TableCell>
                      </TableRow>
                    ))}
                    {!salesOrder?.items?.length ? (
                      <TableRow>
                        <TableCell colSpan={5} align="center">
                          {t('warning.noResultList')}
                        </TableCell>
                      </TableRow>
                    ) : null}
                  </TableBody>
                </Table>
              </TableContainer>
            </GridSearchSection>
          </>
        )}
      </Wrapper>
    </Page>
  );
}
