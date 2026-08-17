/* eslint-disable prettier/prettier */
import { Close } from '@mui/icons-material';
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Radio,
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
import Paginate from 'components/Paginate';
import { GridSearchSection, TextLineClamp } from 'components/Styled';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from 'react-query';
import { getRFQList } from 'services/RFQ/rfq-api';
import { RFQRecord } from 'services/RFQ/rfq-type';

const FALLBACK_RFQ_IMAGE_URL =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120"><rect width="120" height="120" fill="%23f8fafb"/><path d="M30 78l18-18 12 12 18-18 12 12v12H30z" fill="%23cfd8e3"/><circle cx="48" cy="48" r="8" fill="%23cfd8e3"/></svg>';

interface SearchRfqDialogProps {
  open: boolean;
  onClose: () => void;
  customerId: string;
  onSelect: (rfq: RFQRecord) => void;
}

export default function SearchRfqDialog({
  open,
  onClose,
  customerId,
  onSelect
}: SearchRfqDialogProps): JSX.Element {
  const { t } = useTranslation();

  const useStyles = makeStyles({
    noResultMessage: {
      textAlign: 'center',
      fontSize: '1.2em',
      fontWeight: 'bold'
    },
    tableHeader: {
      border: '2px solid #e0e0e0',
      fontWeight: 'bold',
      paddingLeft: '10px',
      textAlign: 'center'
    }
  });
  const classes = useStyles();
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [selectedRfq, setSelectedRfq] = useState<RFQRecord | null>(null);

  const {
    data: rfqResponse,
    refetch: rfqRefetch,
    isFetching: isRfqFetching
  } = useQuery(
    ['quotation-rfq-search', open, customerId, page, pageSize],
    () =>
      getRFQList(page, pageSize, {
        customerId,
        status: 'QUOTED'
      }),
    {
      enabled: open && Boolean(customerId),
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

  useEffect(() => {
    if (!open) {
      return;
    }

    setPage(1);
    setPageSize(10);
    setSelectedRfq(null);
  }, [open, customerId]);

  const rfqList = rfqResponse?.records || [];
  const getProductLabel = (rfq: RFQRecord): string => {
    const productFamily =
      typeof rfq.productFamily === 'string'
        ? rfq.productFamily
        : rfq.productFamily?.nameTh || rfq.productFamily?.nameEn || rfq.productFamily?.code || '';
    const productUsage = rfq.productUsage || rfq.productSubtype1?.nameTh || rfq.productSubtype1?.nameEn || rfq.productSubtype1?.code || '';
    const material =
      typeof rfq.material === 'string'
        ? rfq.material
        : rfq.material?.nameTh || rfq.material?.nameEn || rfq.material?.code || '';

    return [productFamily, productUsage, material].filter(Boolean).join(' / ') || '-';
  };

  const getPictureResources = (rfq: RFQRecord): { id: number; pictureUrl: string }[] => {
    if (Array.isArray(rfq.pictures) && rfq.pictures.length > 0) {
      return rfq.pictures
        .filter((file) => (file.fileType || '').toUpperCase() === 'PICTURE' || !file.fileType)
        .map((file) => ({
          id: file.id,
          pictureUrl: file.pictureUrl || file.fileUrl || ''
        }))
        .filter((file) => Boolean(file.pictureUrl));
    }

    return [];
  };

  return (
    <Dialog open={open} maxWidth="lg" fullWidth aria-labelledby="search-rfq-dialog">
      <DialogTitle id="search-rfq-dialog">
        <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2}>
          <Typography fontWeight={700}>เลือกรายการ RFQ</Typography>
          <Typography variant="body2" color="text.secondary">
            {customerId ? `ลูกค้า: ${customerId}` : 'กรุณาเลือกลูกค้าก่อน'}
          </Typography>
        </Stack>
      </DialogTitle>
      <DialogContent>
        <GridSearchSection container>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell align="center" className={classes.tableHeader} width={70} />
                  <TableCell align="center" className={classes.tableHeader} width={160}>
                    เลข RFQ
                  </TableCell>
                  <TableCell align="center" className={classes.tableHeader}>
                    สินค้า
                  </TableCell>
                  <TableCell align="center" className={classes.tableHeader} width={180}>
                    ความจุ
                  </TableCell>
                  <TableCell align="center" className={classes.tableHeader} width={240}>
                    รูปภาพอ้างอิง
                  </TableCell>
                </TableRow>
              </TableHead>
              {isRfqFetching ? (
                <TableBody>
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      <CircularProgress />
                    </TableCell>
                  </TableRow>
                </TableBody>
              ) : (
                <TableBody>
                  {rfqList.length > 0 ? (
                    rfqList.map((rfq) => {
                      const isSelected = selectedRfq?.id === rfq.id;

                      return (
                        <TableRow
                          key={rfq.id}
                          hover
                          onClick={() => setSelectedRfq(rfq)}
                          sx={{
                            cursor: 'pointer',
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
                            <Radio checked={isSelected} />
                          </TableCell>
                          <TableCell align="center">{rfq.id}</TableCell>
                          <TableCell>
                            <TextLineClamp>{getProductLabel(rfq)}</TextLineClamp>
                          </TableCell>
                          <TableCell align="center">
                            <TextLineClamp>{rfq.capacity || '-'}</TextLineClamp>
                          </TableCell>
                          <TableCell align="center">
                            <Box
                              sx={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(3, 1fr)',
                                gap: 0.75,
                                width: 180,
                                mx: 'auto'
                              }}
                            >
                              {getPictureResources(rfq).slice(0, 3).length > 0 ? (
                                getPictureResources(rfq).slice(0, 3).map((picture) => (
                                  <Box
                                    key={picture.id}
                                    sx={{
                                      width: 56,
                                      height: 56,
                                      borderRadius: 2,
                                      overflow: 'hidden',
                                      border: '1px solid #e3e8ee',
                                      backgroundColor: '#f8fafb',
                                      boxShadow: '0 2px 8px rgba(15, 23, 42, 0.06)'
                                    }}
                                  >
                                    <Box
                                      component="img"
                                      src={picture.pictureUrl}
                                      alt={String(picture.id)}
                                      loading="lazy"
                                      onError={(event) => {
                                        const image = event.currentTarget as HTMLImageElement;
                                        if (image.getAttribute('src') === FALLBACK_RFQ_IMAGE_URL) {
                                          return;
                                        }
                                        image.src = FALLBACK_RFQ_IMAGE_URL;
                                      }}
                                      sx={{
                                        width: '100%',
                                        height: '100%',
                                        objectFit: 'cover',
                                        display: 'block'
                                      }}
                                    />
                                  </Box>
                                ))
                              ) : (
                                <Box
                                  sx={{
                                    width: 56,
                                    height: 56,
                                    borderRadius: 2,
                                    border: '1px dashed #d7dce2',
                                    backgroundColor: '#f8fafb',
                                    mx: 'auto'
                                  }}
                                />
                              )}
                            </Box>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5}>
                        <div className={classes.noResultMessage}>
                          {customerId ? 'ไม่พบรายการ RFQ' : 'กรุณาเลือกลูกค้าก่อน'}
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              )}
            </Table>
          </TableContainer>
        </GridSearchSection>
        <GridSearchSection container>
          <Stack direction="row" justifyContent="flex-end" sx={{ width: '100%' }}>
            <Paginate
              pagination={rfqResponse?.pagination}
              page={page}
              pageSize={pageSize}
              setPage={setPage}
              setPageSize={setPageSize}
              refetch={rfqRefetch}
              totalRecords={rfqResponse?.pagination.totalRecords}
              isShow
            />
          </Stack>
        </GridSearchSection>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} variant="contained" startIcon={<Close />} className="btn-cool-grey">
          {t('button.cancel')}
        </Button>
        <Button
          variant="contained"
          color="primary"
          disabled={!selectedRfq}
          onClick={() => {
            if (!selectedRfq) {
              return;
            }

            onSelect(selectedRfq);
          }}
        >
          เลือกรายการ RFQ
        </Button>
      </DialogActions>
    </Dialog>
  );
}
