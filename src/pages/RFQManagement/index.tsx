import { Add } from '@mui/icons-material';
import {
  Button,
  Box,
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
  Typography,
  useMediaQuery,
  useTheme
} from '@mui/material';
import { makeStyles } from '@mui/styles';
import { useAuth } from 'auth/AuthContext';
import { ROLES } from 'auth/roles';
import PageTitle from 'components/PageTitle';
import Paginate from 'components/Paginate';
import { GridSearchSection, TextLineClamp, Wrapper } from 'components/Styled';
import { Page } from 'layout/LayoutRoute';
import { ReactElement, useState } from 'react';
import { isMobileOnly } from 'react-device-detect';
import { useTranslation } from 'react-i18next';
import { useQuery } from 'react-query';
import { useHistory } from 'react-router-dom';
import dayjs from 'dayjs';
import { ROUTE_PATHS } from 'routes';
import { getRFQList } from 'services/RFQ/rfq-api';
import { RFQEmployee, RFQFileResource, RFQRecord } from 'services/RFQ/rfq-type';

function getProductFamilyLabel(productFamily: RFQRecord['productFamily']): string {
  if (!productFamily) {
    return '-';
  }

  if (typeof productFamily === 'string') {
    return productFamily;
  }

  return productFamily.nameTh || productFamily.nameEn || productFamily.code || '-';
}

function getEmployeeLabel(employee?: RFQEmployee | null): string {
  if (!employee) {
    return '-';
  }

  const nickname = employee.nickName || employee.nickname || '';
  const name = [employee.firstNameTh, employee.lastNameTh].filter(Boolean).join(' ');

  return nickname || name || '-';
}

function getSalesProcurementLabel(rfq: RFQRecord): string {
  return `${getEmployeeLabel(rfq.sales)} / ${getEmployeeLabel(rfq.procurement)}`;
}

function getCustomerLabel(rfq: RFQRecord): string | null {
  return rfq.customer?.customerName || rfq.customer?.companyName || null;
}

function getRFQFileUrl(file?: RFQFileResource | null): string {
  return file?.pictureUrl || file?.fileUrl || '';
}

function getPictureResources(rfq: RFQRecord): { id: number; pictureUrl: string }[] {
  if (Array.isArray(rfq.pictures) && rfq.pictures.length > 0) {
    return rfq.pictures
      .filter((file) => (file.fileType || '').toUpperCase() === 'PICTURE')
      .map((file) => ({
        id: file.id,
        pictureUrl: getRFQFileUrl(file)
      }))
      .filter((file) => Boolean(file.pictureUrl));
  }

  return (rfq.pictures || [])
    .map((picture) => ({
      id: picture.id,
      pictureUrl: picture.pictureUrl
    }))
    .filter((picture) => Boolean(picture.pictureUrl));
}

function getSLADayLeft(requestedDate?: string | null, slaDate?: string | null): number | null {
  if (!requestedDate || !slaDate) {
    return null;
  }

  const requestDay = dayjs(requestedDate).startOf('day');
  const targetDay = dayjs(slaDate).startOf('day');
  const today = dayjs().startOf('day');
  const referenceDay = today.isBefore(requestDay) ? requestDay : today;

  return targetDay.diff(referenceDay, 'day');
}

function getRFQRowSx(rfq: RFQRecord) {
  const dayLeft = getSLADayLeft(rfq.requestedDate, rfq.slaDate);
  const isSLAActiveStatus = ['NEW', 'IN_PROGRESS'].includes(rfq.status || '');

  if (!isSLAActiveStatus) {
    return {
      cursor: 'pointer'
    };
  }

  if (dayLeft === null || dayLeft === undefined) {
    return {
      cursor: 'pointer'
    };
  }

  if (dayLeft < 0) {
    return {
      cursor: 'pointer',
      backgroundColor: '#fff1f2',
      '&:hover': {
        backgroundColor: '#ffe4e6'
      }
    };
  }

  if (dayLeft === 0) {
    return {
      cursor: 'pointer',
      backgroundColor: '#fff7ed',
      '&:hover': {
        backgroundColor: '#ffedd5'
      }
    };
  }

  if (dayLeft === 1) {
    return {
      cursor: 'pointer',
      backgroundColor: '#fff8e1',
      '&:hover': {
        backgroundColor: '#ffefc2'
      }
    };
  }

  return {
    cursor: 'pointer',
    backgroundColor: '#e8f5e9',
    '&:hover': {
      backgroundColor: '#dff0e1'
    }
  };
}

function RFQPictureGrid({
  pictures
}: {
  pictures: { id: number; pictureUrl: string }[];
}): ReactElement {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  if (!pictures.length) {
    return (
      <Box
        sx={{
          width: 56,
          height: 56,
          borderRadius: 2,
          border: '1px dashed #d7dce2',
          backgroundColor: '#f8fafb'
        }}
      />
    );
  }

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 0.75,
        width: 180
      }}>
      {pictures.slice(0, 5).map((picture) => (
        <Box
          key={picture.id}
          onClick={(event) => {
            event.stopPropagation();
            setPreviewUrl(picture.pictureUrl);
          }}
          sx={{
            width: 56,
            height: 56,
            borderRadius: 2,
            overflow: 'hidden',
            border: '1px solid #e3e8ee',
            backgroundColor: '#f8fafb',
            boxShadow: '0 2px 8px rgba(15, 23, 42, 0.06)',
            cursor: 'pointer'
          }}>
          <Box
            component="img"
            src={picture.pictureUrl}
            alt={String(picture.id)}
            loading="lazy"
            sx={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              display: 'block'
            }}
          />
        </Box>
      ))}
      {previewUrl && (
        <Box
          onClick={(event) => {
            event.stopPropagation();
            setPreviewUrl(null);
          }}
          sx={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.68)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 9999,
            p: 3
          }}>
          <Box
            component="img"
            src={previewUrl}
            alt="RFQ preview"
            sx={{
              maxWidth: '90vw',
              maxHeight: '90vh',
              borderRadius: 3,
              boxShadow: '0 18px 50px rgba(0, 0, 0, 0.35)'
            }}
          />
        </Box>
      )}
    </Box>
  );
}

export default function RFQManagement(): ReactElement {
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
  const theme = useTheme();
  const isDownSm = useMediaQuery(theme.breakpoints.down('sm'));
  const { getRole } = useAuth();
  const { t } = useTranslation();
  const history = useHistory();
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const canCreateRFQ = [ROLES.SUPER_ADMIN, ROLES.SALES, ROLES.ADMIN].includes(getRole());

  const {
    data: rfqResponse,
    refetch: rfqRefetch,
    isFetching: isRFQFetching
  } = useQuery(
    ['rfq-list', page, pageSize, 'slaDate', 'ASC'],
    () =>
      getRFQList(page, pageSize, {
        sortBy: 'slaDate',
        sortDirection: 'ASC'
      }),
    {
      refetchOnWindowFocus: false,
      keepPreviousData: true,
      onSuccess: (data) => {
        if (data?.pagination) {
          setPage(data.pagination.page);
          setPageSize(data.pagination.size);
        }
      }
    }
  );

  const rfqList = rfqResponse?.records || [];

  const rfqRows =
    rfqList.length > 0 ? (
      rfqList.map((rfq: RFQRecord) => (
        <TableRow
          hover
          key={rfq.id}
          onClick={() => history.push(ROUTE_PATHS.RFQ_DETAIL.replace(':id', rfq.id))}
          sx={getRFQRowSx(rfq)}>
          <TableCell align="left">
            <Stack direction="row" spacing={1} alignItems="center" sx={{ pl: 1.5 }}>
              <Typography variant="body2">{rfq.id}</Typography>
              <Chip
                label={t(`rfqManagement.rfqsStatus.${rfq.status}`)}
                size="small"
                sx={{
                  backgroundColor: '#e8f5e9',
                  color: '#2e7d32',
                  fontWeight: 700
                }}
              />
            </Stack>
          </TableCell>
          <TableCell align="center">
            <TextLineClamp>
              {rfq.requestedDate ? dayjs(rfq.requestedDate).format('DD/MM/YYYY HH:mm') : '-'}
            </TextLineClamp>
          </TableCell>
          <TableCell>
            <TextLineClamp>
              {rfq.contactName || '-'}
            </TextLineClamp>
          </TableCell>
          <TableCell>
            <TextLineClamp>{getSalesProcurementLabel(rfq)}</TextLineClamp>
          </TableCell>
          <TableCell>
            <TextLineClamp>{rfq.orderType?.nameTh || '-'}</TextLineClamp>
          </TableCell>
          <TableCell>
            <TextLineClamp>{getProductFamilyLabel(rfq.productFamily)}</TextLineClamp>
          </TableCell>
          <TableCell>
            <TextLineClamp>{rfq.capacity || '-'}</TextLineClamp>
          </TableCell>
          <TableCell>
            <RFQPictureGrid pictures={getPictureResources(rfq)} />
          </TableCell>
        </TableRow>
      ))
    ) : (
      <TableRow>
        <TableCell colSpan={8}>
          <div className={classes.noResultMessage}>{t('warning.noResultList')}</div>
        </TableCell>
      </TableRow>
    );

  const rfqMobileRows =
    rfqList.length > 0 ? (
      rfqList.map((rfq: RFQRecord) => (
        <TableRow
          hover
          key={rfq.id}
          onClick={() => history.push(ROUTE_PATHS.RFQ_DETAIL.replace(':id', rfq.id))}
          sx={getRFQRowSx(rfq)}>
          <TableCell align="left">
            <Stack spacing={0.5}>
              <Stack direction="row" spacing={1} alignItems="center">
                <Typography variant="subtitle2" fontWeight={700}>
                  {rfq.id}
                </Typography>
                <Chip
                  label={t(`rfqManagement.status.${rfq.status}`)}
                  size="small"
                  sx={{
                    backgroundColor: '#e8f5e9',
                    color: '#2e7d32',
                    fontWeight: 700
                  }}
                />
              </Stack>
              <Typography variant="caption" color="text.secondary">
                {rfq.requestedDate ? dayjs(rfq.requestedDate).format('DD/MM/YYYY HH:mm') : '-'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {t('rfqManagement.column.contact')}: {rfq.contactName || '-'}
              </Typography>
              {getCustomerLabel(rfq) ? (
                <Typography variant="body2" color="text.secondary">
                  ลูกค้า: {getCustomerLabel(rfq)}
                </Typography>
              ) : null}
              <Typography variant="body2" color="text.secondary">
                {t('rfqManagement.column.sales')}: {getSalesProcurementLabel(rfq)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {t('rfqManagement.column.orderType')}: {rfq.orderType?.nameTh || '-'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {t('rfqManagement.column.productFamily')}:{' '}
                {getProductFamilyLabel(rfq.productFamily)}
              </Typography>
              <RFQPictureGrid pictures={getPictureResources(rfq)} />
            </Stack>
          </TableCell>
        </TableRow>
      ))
    ) : (
      <TableRow>
        <TableCell colSpan={1}>
          <div className={classes.noResultMessage}>{t('warning.noResultList')}</div>
        </TableCell>
      </TableRow>
    );

  return (
    <Page>
      <PageTitle title={t('rfqManagement.title')} />
      <Wrapper>
        <GridSearchSection container spacing={1}>
          <Grid item xs={12}>
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={1}
              useFlexGap
              justifyContent="space-between"
              alignItems={{ xs: 'stretch', sm: 'center' }}>
              <Typography variant="h6" component="h2">
                {t('rfqManagement.listTitle')}
              </Typography>
              {canCreateRFQ ? (
                <Button
                  variant="contained"
                  className="btn-emerald-green"
                  startIcon={<Add />}
                  onClick={() => history.push(ROUTE_PATHS.RFQ_CREATE)}>
                  {t('rfqManagement.action.create')}
                </Button>
              ) : null}
            </Stack>
          </Grid>
        </GridSearchSection>

        {isMobileOnly ? (
          <GridSearchSection container>
            <TableContainer>
              <Table id="rfq_mobile___table">
                <TableHead>
                  <TableRow>
                    <TableCell align="center" className={classes.tableHeader}>
                      {t('rfqManagement.mobileTitle')}
                    </TableCell>
                  </TableRow>
                </TableHead>
                {isRFQFetching ? (
                  <TableBody>
                    <TableRow>
                      <TableCell colSpan={1} align="center">
                        <CircularProgress />
                      </TableCell>
                    </TableRow>
                  </TableBody>
                ) : (
                  <TableBody>{rfqMobileRows}</TableBody>
                )}
              </Table>
            </TableContainer>
          </GridSearchSection>
        ) : (
          <GridSearchSection container>
            <TableContainer>
              <Table id="rfq_list___table">
                <TableHead>
                  <TableRow>
                    <TableCell align="center" className={classes.tableHeader}>
                      {t('rfqManagement.column.id')}
                    </TableCell>
                    <TableCell align="center" className={classes.tableHeader}>
                      {t('rfqManagement.column.requestedDate')}
                    </TableCell>
                    <TableCell align="center" className={classes.tableHeader}>
                      {t('rfqManagement.column.contact')}
                    </TableCell>
                    <TableCell align="center" className={classes.tableHeader}>
                      {t('rfqManagement.column.sales')}
                    </TableCell>
                    <TableCell align="center" className={classes.tableHeader}>
                      {t('rfqManagement.column.orderType')}
                    </TableCell>
                    <TableCell align="center" className={classes.tableHeader}>
                      {t('rfqManagement.column.productFamily')}
                    </TableCell>
                    <TableCell align="center" className={classes.tableHeader}>
                      {t('rfqManagement.column.capacity')}
                    </TableCell>
                    <TableCell align="center" className={classes.tableHeader}>
                      {t('rfqManagement.column.pictures')}
                    </TableCell>
                  </TableRow>
                </TableHead>
                {isRFQFetching ? (
                  <TableBody>
                    <TableRow>
                      <TableCell colSpan={8} align="center">
                        <CircularProgress />
                      </TableCell>
                    </TableRow>
                  </TableBody>
                ) : (
                  <TableBody>{rfqRows}</TableBody>
                )}
              </Table>
            </TableContainer>
          </GridSearchSection>
        )}

        <GridSearchSection container>
          <Grid item xs={12}>
            {isRFQFetching ? (
              ' '
            ) : (
              <Paginate
                pagination={rfqResponse?.pagination}
                page={page}
                pageSize={pageSize}
                setPage={setPage}
                setPageSize={setPageSize}
                refetch={rfqRefetch}
                totalRecords={rfqResponse?.pagination.totalRecords}
                isShow={!isDownSm}
              />
            )}
          </Grid>
        </GridSearchSection>
      </Wrapper>
    </Page>
  );
}
