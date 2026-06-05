import { ArrowBackIos, Person } from '@mui/icons-material';
import {
  Button,
  Chip,
  CircularProgress,
  Grid,
  IconButton,
  Paper,
  Stack,
  TextField,
  useMediaQuery,
  useTheme,
  Typography
} from '@mui/material';
import LoadingDialog from 'components/LoadingDialog';
import PageTitle from 'components/PageTitle';
import { GridTextField, Wrapper } from 'components/Styled';
import { Page } from 'layout/LayoutRoute';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from 'react-query';
import { useHistory, useParams } from 'react-router-dom';
import { ROUTE_PATHS } from 'routes';
import { getSupplierById } from 'services/Supplier/supplier-api';
import { Supplier, SupplierCapability, SupplierCapabilityMaterial } from 'services/Supplier/supplier-type';

function getFamilyDisplayName(capability?: SupplierCapability): string {
  const nameTh = capability?.productFamily?.nameTh;
  const nameEn = capability?.productFamily?.nameEn;
  const code = capability?.productFamilyCode;

  if (nameTh && nameEn) {
    return `${nameTh} (${nameEn})`;
  }

  return nameTh || nameEn || code || '-';
}

function getMaterialDisplayName(material?: SupplierCapabilityMaterial): string {
  const nameTh = material?.productMaterial?.nameTh;
  const nameEn = material?.productMaterial?.nameEn;
  const code = material?.productMaterialCode;

  if (nameTh && nameEn) {
    return `${nameTh} (${nameEn})`;
  }

  return nameTh || nameEn || code || '-';
}

export default function SupplierManagementDetail(): JSX.Element {
  const theme = useTheme();
  const isDownSm = useMediaQuery(theme.breakpoints.down('sm'));
  const { t } = useTranslation();
  const history = useHistory();
  const { id } = useParams<{ id: string }>();
  const [supplier, setSupplier] = useState<Supplier | undefined>();

  const { data: supplierData, isFetching } = useQuery(['supplier', id], () => getSupplierById(id), {
    refetchOnWindowFocus: false
  });

  useEffect(() => {
    if (!supplierData) {
      return;
    }

    setSupplier(supplierData);
  }, [supplierData]);

  const defaultContact = useMemo(
    () => supplier?.contacts?.find((contact) => contact.isDefault) || supplier?.contacts?.[0],
    [supplier]
  );

  const renderReadOnlyField = (label: string, value?: string | null, multiline = false) => (
    <TextField
      fullWidth
      variant="outlined"
      label={label}
      value={value || '-'}
      InputLabelProps={{ shrink: true }}
      multiline={multiline}
      minRows={multiline ? 3 : undefined}
      disabled
    />
  );

  return (
    <Page>
      <LoadingDialog open={isFetching} />
      <PageTitle title={supplier?.supplierName || t('supplierManagement.action.view')} />
      <Wrapper>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={1}
          useFlexGap
          sx={{
            mt: 1,
            justifyContent: { sm: 'flex-end' },
            alignItems: { xs: 'flex-end', sm: 'center' }
          }}
        >
          <Button
            fullWidth={isDownSm}
            variant="contained"
            className="btn-cool-grey"
            startIcon={<ArrowBackIos />}
            onClick={() => history.push(ROUTE_PATHS.SUPPLIER_MANAGEMENT)}
          >
            {t('button.back')}
          </Button>
        </Stack>
      </Wrapper>

      {isFetching ? (
        <Wrapper>
          <Stack alignItems="center" py={6}>
            <CircularProgress />
          </Stack>
        </Wrapper>
      ) : (
        <>
          <Wrapper>
            <Grid container spacing={1}>
              <GridTextField item xs={12} sm={12}>
                <Typography variant="subtitle1" fontWeight={600}>
                  {t('supplierManagement.detail.generalInfo')}
                </Typography>
              </GridTextField>

              <GridTextField item xs={12} sm={6}>
                {renderReadOnlyField(t('supplierManagement.column.id'), supplier?.id)}
              </GridTextField>
              <GridTextField item xs={12} sm={6}>
                {renderReadOnlyField(t('supplierManagement.column.name'), supplier?.supplierName)}
              </GridTextField>
              <GridTextField item xs={12} sm={6}>
                {renderReadOnlyField(t('supplierManagement.column.code'), supplier?.supplierCode)}
              </GridTextField>
              <GridTextField item xs={12} sm={6}>
                {renderReadOnlyField(t('supplierManagement.column.email'), supplier?.supplierEmail)}
              </GridTextField>
              <GridTextField item xs={12} sm={6}>
                {renderReadOnlyField(t('supplierManagement.column.countryCode'), supplier?.countryCode)}
              </GridTextField>
              <GridTextField item xs={12} sm={6}>
                {renderReadOnlyField(t('supplierManagement.column.status'), supplier?.status)}
              </GridTextField>
              <GridTextField item xs={12} sm={6}>
                <TextField
                  fullWidth
                  variant="outlined"
                  label={t('supplierManagement.column.additional')}
                  value={supplier?.additional || '-'}
                  InputLabelProps={{ shrink: true }}
                  InputProps={{ readOnly: true }}
                />
              </GridTextField>

              <GridTextField item xs={12}>
                <Typography variant="subtitle1" fontWeight={600} sx={{ mt: 1 }}>
                  Supplier Capabilities
                </Typography>
              </GridTextField>

              <GridTextField item xs={12}>
                {(supplier?.capabilities || []).length > 0 ? (
                  <Stack spacing={1.5}>
                    {(supplier?.capabilities || []).map((capability) => (
                      <Paper
                        key={capability.productFamilyCode}
                        elevation={0}
                        sx={{
                          p: 2,
                          border: '1px solid',
                          borderColor: 'divider',
                          borderRadius: 2
                        }}
                      >
                        <Stack spacing={1}>
                          <Typography variant="body1" fontWeight={600}>
                            {getFamilyDisplayName(capability)}
                          </Typography>

                          <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }}>
                            {capability.coversAllMaterials ? (
                              <Chip label="All Materials" color="primary" variant="outlined" />
                            ) : null}
                            {!capability.coversAllMaterials && capability.materials.length > 0
                              ? capability.materials.map((material) => (
                                <Chip
                                  key={`${capability.productFamilyCode}-${material.productMaterialCode}`}
                                  label={getMaterialDisplayName(material)}
                                  size="small"
                                  variant="outlined"
                                />
                              ))
                              : null}
                            {!capability.coversAllMaterials && capability.materials.length === 0 ? (
                              <Typography variant="body2" color="text.secondary">
                                -
                              </Typography>
                            ) : null}
                          </Stack>
                        </Stack>
                      </Paper>
                    ))}
                  </Stack>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    -
                  </Typography>
                )}
              </GridTextField>
            </Grid>
          </Wrapper>

          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Wrapper>
                <Grid container spacing={2}>
                  <Grid
                    item
                    xs={12}
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: 1,
                      minHeight: 40
                    }}
                  >
                    <Typography variant="h6">{t('supplierManagement.column.address.title')}</Typography>
                    <Chip
                      label={supplier?.status || '-'}
                      size="small"
                      color={supplier?.status === 'ACTIVE' ? 'success' : 'default'}
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <Paper
                      elevation={0}
                      sx={{
                        p: 2,
                        borderBottom: '1px solid #eee'
                      }}
                    >
                      <Stack spacing={1}>
                        <Typography variant="subtitle2" sx={{ color: '#888', fontWeight: 500 }}>
                          {supplier?.fullAddressEn || t('supplierManagement.column.fullAddress')}
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#555' }}>
                          {supplier?.fullAddress || '-'}
                        </Typography>
                        <Stack direction="row" spacing={1} sx={{ mt: 1, flexWrap: 'wrap' }} useFlexGap>
                          <Chip label={`${t('supplierManagement.column.address.province')}: ${supplier?.province || '-'}`} size="small" />
                          <Chip label={`${t('supplierManagement.column.city')}: ${supplier?.city || '-'}`} size="small" />
                          <Chip label={`${t('supplierManagement.column.address.amphure')}: ${supplier?.district || '-'}`} size="small" />
                          <Chip label={`${t('supplierManagement.column.address.tumbon')}: ${supplier?.town || '-'}`} size="small" />
                        </Stack>
                      </Stack>
                    </Paper>
                  </Grid>

                  <Grid item xs={12}>
                    {renderReadOnlyField(
                      t('supplierManagement.column.fullAddressEn'),
                      supplier?.fullAddressEn,
                      true
                    )}
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    {renderReadOnlyField(t('supplierManagement.column.street'), supplier?.street)}
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    {renderReadOnlyField(
                      t('supplierManagement.column.detailAddress'),
                      supplier?.detailAddress
                    )}
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    {renderReadOnlyField(
                      t('supplierManagement.column.address.postalCode'),
                      supplier?.postalCode
                    )}
                  </Grid>
                </Grid>
              </Wrapper>
            </Grid>

            <Grid item xs={12} sm={6}>
              <Wrapper>
                <Grid container spacing={2}>
                  <Grid
                    item
                    xs={12}
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: 1,
                      minHeight: 40
                    }}
                  >
                    <Typography variant="h6">{t('supplierManagement.detail.contactInfo')}</Typography>
                    <Chip
                      label={`${supplier?.contacts?.length || 0} ${t('supplierManagement.detail.allContacts')}`}
                      size="small"
                    />
                  </Grid>

                  {(supplier?.contacts || []).length > 0 ? (
                    supplier?.contacts.map((contact, index) => (
                      <Grid item xs={12} key={contact.id || index}>
                        <Paper
                          elevation={0}
                          sx={{
                            p: 2,
                            borderBottom: '1px solid #eee'
                          }}
                        >
                          <Stack direction="row" spacing={1} alignItems="flex-start">
                            <Stack
                              direction="row"
                              spacing={2}
                              alignItems="center"
                              sx={{ flex: 1, minWidth: 0 }}
                            >
                              <IconButton size="small" disabled>
                                <Person />
                              </IconButton>
                              <Stack spacing={0.5} sx={{ flex: 1, minWidth: 0 }}>
                                <Typography variant="body1" fontWeight={600}>
                                  {contact.contactName || '-'}
                                </Typography>
                                <Typography variant="body2" sx={{ color: '#666' }}>
                                  {'Tel: ' + contact.contactNumber || '-'}
                                </Typography>
                                <Typography variant="body2" sx={{ color: '#666' }}>
                                  {'Wechat: ' + contact.wechat != null ? contact.wechat : '-'}
                                </Typography>
                              </Stack>
                            </Stack>
                            {contact.isDefault && <Chip label="Default" size="small" color="primary" />}
                          </Stack>
                        </Paper>
                      </Grid>
                    ))
                  ) : (
                    <Grid item xs={12}>
                      <Typography variant="body2" color="text.secondary">
                        -
                      </Typography>
                    </Grid>
                  )}
                </Grid>
              </Wrapper>
            </Grid>
          </Grid>

          <Wrapper>
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={1}
              useFlexGap
              sx={{
                mt: 1,
                justifyContent: { sm: 'flex-end' },
                alignItems: { xs: 'flex-end', sm: 'center' }
              }}
            >
              <Button
                fullWidth={isDownSm}
                variant="contained"
                className="btn-cool-grey"
                onClick={() => history.push(ROUTE_PATHS.SUPPLIER_MANAGEMENT)}
                startIcon={<ArrowBackIos />}
              >
                {t('button.back')}
              </Button>
            </Stack>
          </Wrapper>
        </>
      )}
    </Page>
  );
}
