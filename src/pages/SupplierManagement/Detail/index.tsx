import { MapOutlined } from '@material-ui/icons';
import { ArrowBackIos, ContentCopy, LocalPhone, Person, PersonOff } from '@mui/icons-material';
import {
  Autocomplete,
  Avatar,
  Box,
  Button,
  Chip,
  Grid,
  IconButton,
  InputAdornment,
  Menu,
  MenuItem,
  Stack,
  TextField,
  Typography,
  useMediaQuery,
  useTheme
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import { makeStyles } from '@mui/styles';
import { APIProvider, Marker } from '@vis.gl/react-google-maps';
import { useAuth } from 'auth/AuthContext';
import AuditInfo from 'components/AuditInfo';
import ConfirmDialog from 'components/ConfirmDialog';
import LoadingDialog from 'components/LoadingDialog';
import PageTitle from 'components/PageTitle';
import { GridTextField, Wrapper } from 'components/Styled';
import { Page } from 'layout/LayoutRoute';
import React from 'react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from 'react-query';
import { useHistory, useParams } from 'react-router-dom';
import { ROUTE_PATHS } from 'routes';
import { getSupplierById } from 'services/Supplier/supplier-api';
import { Supplier, SupplierAccount, SupplierType } from 'services/Supplier/supplier-type';
import { DEFAULT_DATETIME_FORMAT_MONTH_TEXT, formatDateStringWithPattern } from 'utils';
import { dayColors, dayOfWeek } from 'utils/constant';
import { copyText } from 'utils/copyContent';

export interface SupplierParam {
  id: string;
}

export default function SupplierDetail(): JSX.Element {
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
  const history = useHistory();
  const params = useParams<SupplierParam>();
  const [canEdit, setCanEdit] = useState<boolean>(false);
  const [actionType, setActionType] = useState<string>('');
  const [title, setTitle] = useState<string>('');
  const [msg, setMsg] = useState<string>('');
  const [visibleConfirmationDialog, setVisibleConfirmationDialog] = useState(false);
  const [supplier, setSupplier] = useState<Supplier>();
  const [supplierType, setSupplierType] = useState<SupplierType[]>();
  const { t } = useTranslation();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const openMenu = Boolean(anchorEl);

  const handleOpenMenu = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
  };

  const { data: supplierData, isFetching: isSupplierFetching } = useQuery(
    'supplier',
    () => getSupplierById(params.id),
    {
      refetchOnWindowFocus: false
    }
  );

  const extractLatLng = (location: string | undefined) => {
    if (!location) return null;

    const loc = location.trim();

    // CASE 1: เป็นพิกัด lat,lng
    if (loc.includes(',') && !loc.startsWith('http')) {
      const [latStr, lngStr] = loc.split(',').map((s) => s.trim());
      const lat = Number(latStr);
      const lng = Number(lngStr);
      if (!isNaN(lat) && !isNaN(lng)) return { lat, lng };
    }

    // CASE 2: URL แบบ Google Maps
    if (loc.startsWith('http')) {
      // หา coordinate จาก URL (regex รองรับ 13.12345,100.12345)
      const match = loc.match(/@(-?\d+\.\d+),\s*(-?\d+\.\d+)/);
      if (match) {
        return { lat: Number(match[1]), lng: Number(match[2]) };
      }
    }

    return null;
  };

  const coords = extractLatLng(supplier?.location);

  useEffect(() => {
    console.log('Use effect with supplierData');
    setCanEdit(getRole() === 'SUPER_ADMIN' || getRole().startsWith('ADMIN'));
    setSupplier(supplierData);
    setSupplierType(supplierData?.types);
  }, [supplierData]);

  useEffect(() => {
    console.log('Use effect with supplierType');
    setSupplierType(supplierType);
  }, [supplierType]);

  return (
    <Page>
      <PageTitle
        title={
          supplier?.supplierName +
          ' ' +
          supplier?.types.map((type) => type.typeIcon + ' ' + type.typeName)
        }
      />
      <Wrapper>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={1}
          useFlexGap
          sx={{
            mt: 1,
            justifyContent: { sm: 'flex-end' }, // right-align when in row
            alignItems: { xs: 'flex-end', sm: 'center' } // right-align when stacked
          }}>
          <Button
            fullWidth={isDownSm}
            className="btn-cool-grey"
            variant="contained"
            onClick={() => {
              setActionType('back');
              setTitle(t('message.backTitle'));
              setMsg(t('message.backMsg'));
              setVisibleConfirmationDialog(true);
            }}
            startIcon={<ArrowBackIos />}>
            {t('button.back')}
          </Button>
          <Button
            fullWidth={isDownSm}
            variant="contained"
            className="btn-slate-grey"
            startIcon={<MenuIcon />}
            onClick={handleOpenMenu}>
            {t('button.menu')}
          </Button>
          <Menu
            anchorEl={anchorEl}
            open={openMenu}
            onClose={handleCloseMenu}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
            transformOrigin={{ vertical: 'top', horizontal: 'left' }}>
            {supplier?.status === 'ACTIVE' ? (
              <MenuItem
                disabled={!canEdit}
                onClick={() => {
                  setActionType('inactive');
                  setTitle(t('staffManagement.inactiveStaff'));
                  setMsg(t('staffManagement.confirmMsgInactiveStaff'));
                  setVisibleConfirmationDialog(true);
                }}>
                <PersonOff fontSize="small" style={{ marginRight: 8 }} />
                {t('staffManagement.action.inactive')}
              </MenuItem>
            ) : (
              <MenuItem
                disabled={!canEdit}
                onClick={() => {
                  setActionType('active');
                  setTitle(t('staffManagement.activeStaff'));
                  setMsg(t('staffManagement.confirmMsgActiveStaff'));
                  setVisibleConfirmationDialog(true);
                }}>
                <Person fontSize="small" style={{ marginRight: 8 }} />
                {t('staffManagement.action.active')}
              </MenuItem>
            )}
          </Menu>
        </Stack>
      </Wrapper>
      <Wrapper>
        <Grid container spacing={1}>
          <GridTextField item xs={12} sm={12}>
            <Typography variant="h3">{t('supplierManagement.detail')}</Typography>
          </GridTextField>
          <GridTextField item xs={12} sm={12}>
            <Box display="flex" flexDirection="column" alignItems="flex-start">
              <Box display="flex" justifyContent="center" width="100%">
                <Avatar
                  id={`supplier-profile-picture`}
                  variant="rounded"
                  src={supplier?.profileImage}
                  sx={{
                    width: 120,
                    height: 120
                  }}
                />
              </Box>
            </Box>
          </GridTextField>
          <GridTextField item xs={6} sm={6}>
            <TextField
              type="text"
              label={t('supplierManagement.column.status')}
              fullWidth
              disabled={!canEdit}
              variant="outlined"
              value={supplier?.status}
              InputLabelProps={{ shrink: true }}
            />
          </GridTextField>
          <GridTextField item xs={6} sm={6}>
            <TextField
              type="text"
              label={t('supplierManagement.column.rank')}
              fullWidth
              disabled={!canEdit}
              variant="outlined"
              value={supplier?.supplierRank?.nameTh}
              InputLabelProps={{ shrink: true }}
            />
          </GridTextField>
          <GridTextField item xs={12} sm={6}>
            <TextField
              type="text"
              label={t('supplierManagement.column.id')}
              fullWidth
              disabled
              variant="outlined"
              value={supplier?.supplierId}
              InputLabelProps={{ shrink: true }}
            />
          </GridTextField>
          <GridTextField item xs={12} sm={6}>
            <TextField
              type="text"
              label={t('supplierManagement.column.name')}
              fullWidth
              disabled={!canEdit}
              variant="outlined"
              value={supplier?.supplierName}
              InputLabelProps={{ shrink: true }}
            />
          </GridTextField>
          <GridTextField item xs={6} sm={6}>
            <TextField
              type="text"
              label={t('supplierManagement.column.shortName')}
              fullWidth
              disabled={!canEdit}
              variant="outlined"
              value={supplier?.supplierShortName}
              InputLabelProps={{ shrink: true }}
            />
          </GridTextField>
          <GridTextField item xs={6} sm={6}>
            <TextField
              type="text"
              label={t('supplierManagement.column.types.title')}
              fullWidth
              disabled={!canEdit}
              variant="outlined"
              value={supplier?.types[0].typeIcon + ' ' + supplier?.types[0].typeName}
              InputLabelProps={{ shrink: true }}
            />
          </GridTextField>
          <GridTextField item xs={12} sm={6}>
            <TextField
              type="text"
              label={t('supplierManagement.column.productType')}
              fullWidth
              disabled={!canEdit}
              variant="outlined"
              value={supplier?.supplierProductType?.nameTh}
              InputLabelProps={{ shrink: true }}
            />
          </GridTextField>
          <GridTextField item xs={12} sm={6}>
            <TextField
              type="text"
              label={t('supplierManagement.column.mainProduct')}
              fullWidth
              disabled={!canEdit}
              variant="outlined"
              value={supplier?.mainProduct}
              InputLabelProps={{ shrink: true }}
            />
          </GridTextField>
          <GridTextField item xs={12} sm={12}>
            {/* <Autocomplete
              multiple
              options={supplier?.sellProducts || []}
              getOptionLabel={(product: ProductDto) => product.productName}
              isOptionEqualToValue={(option, value) => option.productId === value.productId}
              renderOption={(props, option) => (
                <li {...props} key={option.productId}>
                  {option.productName}
                </li>
              )}
              value={supplier?.sellProducts}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label={t('supplierManagement.column.sellProduct') + '*'}
                  InputLabelProps={{ shrink: true }}
                />
              )}
            /> */}
            <Autocomplete
              multiple
              readOnly
              options={supplier?.sellProducts || []}
              getOptionLabel={(option) => option.productNameTh}
              isOptionEqualToValue={(option, value) => option.productId === value.productId}
              value={supplier?.sellProducts || []}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label={t('supplierManagement.column.sellProduct') + '*'}
                  InputLabelProps={{ shrink: true }}
                />
              )}
            />
          </GridTextField>
          <GridTextField item xs={6} sm={6}>
            <TextField
              type="text"
              label={t('supplierManagement.column.contactName')}
              fullWidth
              disabled={!canEdit}
              variant="outlined"
              value={supplier?.contactName}
              InputLabelProps={{ shrink: true }}
            />
          </GridTextField>
          <GridTextField item xs={6} sm={6}>
            <TextField
              type="text"
              label={t('supplierManagement.column.contactNumber')}
              fullWidth
              disabled={!canEdit}
              variant="outlined"
              value={supplier?.contactNumber}
              InputLabelProps={{ shrink: true }}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <a
                      href={`tel:${supplier?.contactNumber.replaceAll('-', '')}`}
                      style={{ textDecoration: 'none', color: 'inherit' }}
                      onClick={(event) => event.stopPropagation()}>
                      <LocalPhone style={{ verticalAlign: 'middle' }} />{' '}
                    </a>
                  </InputAdornment>
                )
              }}
            />
          </GridTextField>
          <GridTextField item xs={12} sm={12}>
            <TextField
              type="text"
              label={t('supplierManagement.column.phoneContactName')}
              fullWidth
              disabled
              variant="outlined"
              value={supplier?.phoneContactName}
              InputLabelProps={{ shrink: true }}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => copyText(`${supplier?.phoneContactName}`)}>
                      <ContentCopy />
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />
          </GridTextField>
          <GridTextField item xs={12} sm={12}>
            <TextField
              type="text"
              label={t('supplierManagement.column.lineContactName')}
              fullWidth
              disabled
              variant="outlined"
              value={supplier?.lineContactName}
              InputLabelProps={{ shrink: true }}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => copyText(`${supplier?.lineContactName}`)}>
                      <ContentCopy />
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />
          </GridTextField>
          <GridTextField item xs={12} sm={12}>
            <TextField
              type="text"
              label={t('supplierManagement.column.behavior')}
              fullWidth
              disabled={!canEdit}
              variant="outlined"
              value={supplier?.behavior}
              InputLabelProps={{ shrink: true }}
            />
          </GridTextField>
          <GridTextField item xs={12} sm={8}>
            <Autocomplete
              multiple
              readOnly
              options={dayOfWeek}
              value={supplier?.workingDays || []}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => (
                  <Chip
                    key={option}
                    label={t(`days.${option}`)}
                    {...getTagProps({ index })}
                    style={{
                      backgroundColor: dayColors[option] || '#e0e0e0',
                      color: '#000'
                    }}
                  />
                ))
              }
              renderInput={(params) => (
                <TextField
                  {...params}
                  label={t('supplierManagement.column.period')}
                  InputLabelProps={{ shrink: true }}
                />
              )}
            />
          </GridTextField>
          <GridTextField item xs={6} sm={2}>
            <TextField
              type="text"
              label={t('supplierManagement.column.startWorkingHour')}
              fullWidth
              disabled={!canEdit}
              variant="outlined"
              value={supplier?.startWorkingHour}
              InputLabelProps={{ shrink: true }}
            />
          </GridTextField>
          <GridTextField item xs={6} sm={2}>
            <TextField
              type="text"
              label={t('supplierManagement.column.endWorkingHour')}
              fullWidth
              disabled={!canEdit}
              variant="outlined"
              value={supplier?.endWorkingHour}
              InputLabelProps={{ shrink: true }}
            />
          </GridTextField>
          <GridTextField item xs={6} sm={6}>
            <TextField
              type="text"
              label={t('supplierManagement.column.orderMethod')}
              fullWidth
              disabled={!canEdit}
              variant="outlined"
              value={supplier?.orderMethod?.nameTh}
              InputLabelProps={{ shrink: true }}
            />
          </GridTextField>
          <GridTextField item xs={6} sm={6}>
            <TextField
              type="text"
              label={t('supplierManagement.column.sendingMethod')}
              fullWidth
              disabled={!canEdit}
              variant="outlined"
              value={supplier?.sendingMethod?.nameTh}
              InputLabelProps={{ shrink: true }}
            />
          </GridTextField>
          <GridTextField item xs={6} sm={6}>
            <TextField
              type="text"
              label={t('supplierManagement.column.creditTerm')}
              fullWidth
              disabled={!canEdit}
              variant="outlined"
              value={supplier?.creditTerm?.nameTh}
              InputLabelProps={{ shrink: true }}
            />
          </GridTextField>
          <GridTextField item xs={6} sm={6}>
            <TextField
              type="text"
              label={t('supplierManagement.column.transferMethod')}
              fullWidth
              disabled={!canEdit}
              variant="outlined"
              value={supplier?.paymentMethod?.nameTh}
              InputLabelProps={{ shrink: true }}
            />
          </GridTextField>
          <GridTextField item xs={6} sm={4}>
            {t('supplierManagement.column.account.title')}
          </GridTextField>
          <GridTextField item xs={6} sm={8} style={{ textAlign: 'right' }}></GridTextField>
          {supplier?.accounts?.length > 0 ? (
            supplier?.accounts.map((acct: SupplierAccount, index) => {
              return (
                <React.Fragment key={index}>
                  <GridTextField item xs={12} sm={12}>
                    {t('supplierManagement.column.account.subTitle', {
                      index: index + 1
                    })}
                  </GridTextField>
                  <GridTextField item xs={12} sm={6}>
                    <TextField
                      {...params}
                      fullWidth
                      label={t('supplierManagement.column.account.bankName') + ' *'}
                      InputLabelProps={{ shrink: true }}
                      value={acct.bankName}
                      InputProps={{
                        ...params.InputProps,
                        startAdornment: acct.bankCode ? (
                          <Box display="flex" alignItems="center" sx={{ pl: 1 }}>
                            <img
                              src={`/bank/${acct.bankCode}.png`}
                              alt={acct.bankName}
                              width={24}
                              height={24}
                              style={{ marginRight: 8 }}
                            />
                          </Box>
                        ) : null
                      }}
                    />
                  </GridTextField>
                  <GridTextField item xs={12} sm={6}>
                    <TextField
                      type="number"
                      InputLabelProps={{ shrink: true }}
                      label={t('supplierManagement.column.account.number') + ' *'}
                      sx={{ width: '100%' }}
                      value={acct?.accountNumber}
                      inputProps={{
                        inputMode: 'numeric',
                        pattern: '[0-9]*',
                        min: 1,
                        max: 15
                      }}
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton onClick={() => copyText(`${acct?.accountNumber}`)}>
                              <ContentCopy />
                            </IconButton>
                          </InputAdornment>
                        )
                      }}
                    />
                  </GridTextField>
                  <GridTextField item xs={12} sm={12}>
                    <TextField
                      fullWidth
                      label={t('supplierManagement.column.account.name') + ' *'}
                      value={acct?.accountName}
                      variant="outlined"
                      InputLabelProps={{ shrink: true }}
                    />
                  </GridTextField>
                </React.Fragment>
              );
            })
          ) : (
            <GridTextField item xs={12} style={{ textAlign: 'center' }}>
              {t('supplierManagement.column.account.noAccount')}
            </GridTextField>
          )}
          <GridTextField item xs={12} sm={12}>
            <TextField
              type="text"
              label={t('supplierManagement.column.address.title')}
              fullWidth
              disabled={!canEdit}
              variant="outlined"
              value={[
                supplier?.addressDetail || '',
                supplier?.addressTumbon?.nameTh || '',
                supplier?.addressAmphure?.nameTh || '',
                supplier?.addressProvince?.nameTh || ''
              ]
                .filter((v) => v && v.trim() !== '')
                .join(', ')}
              InputLabelProps={{ shrink: true }}
            />
          </GridTextField>
          {supplier && supplier.location ? (
            <>
              <GridTextField item xs={12} sm={12}>
                <TextField
                  type="text"
                  label={t('supplierManagement.column.address.location')}
                  fullWidth
                  disabled={!canEdit}
                  variant="outlined"
                  value={supplier?.location}
                  InputLabelProps={{ shrink: true }}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => {
                            // if (supplier?.location) {
                            //   const [lat, lng] = supplier.location.split(',').map(Number);
                            //   const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
                            //   window.open(url, '_blank');
                            // }
                            const loc = supplier?.location?.trim();
                            console.log('Location : ' + loc);
                            if (!loc) return;

                            let url = '';

                            // CASE 1: เป็นลิงก์ Google Maps อยู่แล้ว
                            if (loc.startsWith('http://') || loc.startsWith('https://')) {
                              url = loc;
                            }
                            // CASE 2: เป็นพิกัด lat,lng
                            else if (loc.includes(',')) {
                              const [latStr, lngStr] = loc.split(',').map((s) => s.trim());
                              const lat = Number(latStr);
                              const lng = Number(lngStr);

                              if (!isNaN(lat) && !isNaN(lng)) {
                                url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
                              }
                            }
                            console.log('URL : ' + url);

                            if (url) {
                              window.open(url, '_blank');
                            }
                          }}>
                          <MapOutlined />
                        </IconButton>
                      </InputAdornment>
                    )
                  }}
                />
              </GridTextField>
              <GridTextField item xs={12} sm={12} style={{ height: '300px' }}>
                {coords && (
                  <APIProvider
                    apiKey="AIzaSyA7t3pZu_Fc-l1l-R-e6CSyEVfT3heFlaA"
                    onLoad={() => console.log('Maps API has loaded.')}>
                    <Map
                      style={{ paddingTop: '10px', height: '100%', width: '100%' }}
                      defaultZoom={13}
                      center={coords}>
                      <Marker position={coords} />
                    </Map>
                  </APIProvider>
                )}
              </GridTextField>
            </>
          ) : (
            <></>
          )}
          <GridTextField item xs={12} sm={12}>
            <AuditInfo
              createdBy={supplier?.createdBy}
              createdDate={supplier?.createdDate}
              updatedBy={supplier?.updatedBy}
              updatedDate={supplier?.updatedDate}
              createdLabel={t('general.createdBy')}
              updatedLabel={t('general.updatedBy')}
              formatDate={(d) => formatDateStringWithPattern(d, DEFAULT_DATETIME_FORMAT_MONTH_TEXT)}
            />
          </GridTextField>
        </Grid>
      </Wrapper>
      <Wrapper>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={1}
          useFlexGap
          sx={{
            mt: 1,
            justifyContent: { sm: 'flex-end' }, // right-align when in row
            alignItems: { xs: 'flex-end', sm: 'center' } // right-align when stacked
          }}>
          <Button
            fullWidth={isDownSm}
            className="btn-cool-grey"
            variant="contained"
            onClick={() => {
              setActionType('back');
              setTitle(t('message.backTitle'));
              setMsg(t('message.backMsg'));
              setVisibleConfirmationDialog(true);
            }}
            startIcon={<ArrowBackIos />}>
            {t('button.back')}
          </Button>
          <Button
            fullWidth={isDownSm}
            variant="contained"
            className="btn-slate-grey"
            startIcon={<MenuIcon />}
            onClick={handleOpenMenu}>
            {t('button.menu')}
          </Button>
        </Stack>
      </Wrapper>
      <ConfirmDialog
        open={visibleConfirmationDialog}
        title={title}
        message={msg}
        confirmText={t('button.confirm')}
        cancelText={t('button.cancel')}
        onConfirm={() => {
          if (actionType === 'update') {
            // formik.handleSubmit();
          } else if (actionType === 'clear') {
            // formik.resetForm();
          } else if (actionType === 'back') {
            history.push(ROUTE_PATHS.SUPPLIER_MANAGEMENT);
          } else if (actionType === 'delete') {
            // handleDeleteStaff();
          } else if (actionType === 'active') {
            // handleActiveStaff();
          } else if (actionType === 'inactive') {
            // handleInactiveStaff();
          }
          setVisibleConfirmationDialog(false);
        }}
        onCancel={() => setVisibleConfirmationDialog(false)}
        isShowCancelButton={true}
        isShowConfirmButton={true}
      />
      <LoadingDialog open={isSupplierFetching} />
    </Page>
  );
}
