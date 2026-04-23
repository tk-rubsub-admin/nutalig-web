import { Search, DisabledByDefault, Circle, Add } from '@mui/icons-material';
import {
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  MenuItem,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  useMediaQuery,
  useTheme
} from '@mui/material';
import { makeStyles } from '@mui/styles';
import ConfirmDialog from 'components/ConfirmDialog';
import LoadingDialog from 'components/LoadingDialog';
import PageTitle from 'components/PageTitle';
import Paginate from 'components/Paginate';
import { GridSearchSection, TextLineClamp, Wrapper } from 'components/Styled';
import { useFormik } from 'formik';
import { Page } from 'layout/LayoutRoute';
import { useState } from 'react';
import { isMobileOnly } from 'react-device-detect';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { useQuery } from 'react-query';
import {
  createSystemConfig,
  getSystemConfigList,
  getSystemConstantList,
  updateSystemConfig
} from 'services/Config/config-api';
import {
  CreateSystemConfigRequest,
  SearchSystemConfigRequest,
  SystemConfig,
  UpdateSystemConfigRequest
} from 'services/Config/config-type';

export default function SystemConfigManagement(): JSX.Element {
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
  const { t } = useTranslation();
  const [page, setPage] = useState<number>(1);
  const [pages, setPages] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(20);
  const [selectedConfig, setSelectedConfig] = useState<SystemConfig | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [createConfirmDialogOpen, setCreateConfirmDialogOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [filters, setFilters] = useState<SearchSystemConfigRequest>({
    groupCode: '',
    code: '',
    keyword: ''
  });
  const [editValues, setEditValues] = useState<UpdateSystemConfigRequest>({
    nameTh: '',
    nameEn: '',
    sort: 1
  });
  const [createValues, setCreateValues] = useState<CreateSystemConfigRequest>({
    groupCode: '',
    code: '',
    nameTh: '',
    nameEn: '',
    sort: 1
  });

  const formik = useFormik<SearchSystemConfigRequest>({
    initialValues: {
      groupCode: '',
      code: '',
      keyword: ''
    },
    enableReinitialize: false,
    onSubmit: (values) => {
      setFilters({
        groupCode: values.groupCode.trim(),
        code: values.code.trim(),
        keyword: values.keyword.trim()
      });
      setPage(1);
    }
  });

  const {
    data: systemConfigResponse,
    refetch: systemConfigRefetch,
    isFetching: isSystemConfigFetching
  } = useQuery(
    ['system-config-list', page, pageSize, filters],
    () => getSystemConfigList(page, pageSize, filters),
    {
      refetchOnWindowFocus: false,
      keepPreviousData: true,
      onSuccess: (data) => {
        if (data?.pagination) {
          setPage(data.pagination.page);
          setPageSize(data.pagination.size);
          setPages(data.pagination.totalPage);
        }
      }
    }
  );
  const { data: systemConstantList, isFetching: isSystemConstantFetching } = useQuery(
    ['system-constant-list'],
    () => getSystemConstantList(),
    {
      refetchOnWindowFocus: false
    }
  );

  const systemConfigList = systemConfigResponse?.systemConfigList || [];
  const isEditChanged =
    !!selectedConfig &&
    (selectedConfig.nameTh !== editValues.nameTh ||
      selectedConfig.nameEn !== editValues.nameEn ||
      (selectedConfig.sort ?? 1) !== Number(editValues.sort));
  const isCreateValid =
    !!createValues.groupCode.trim() &&
    !!createValues.code.trim() &&
    !!createValues.nameTh.trim() &&
    Number(createValues.sort) >= 1;

  const openEditDialog = (config: SystemConfig) => {
    setSelectedConfig(config);
    setEditValues({
      nameTh: config.nameTh || '',
      nameEn: config.nameEn || '',
      sort: config.sort ?? 1
    });
    setEditDialogOpen(true);
  };

  const closeEditDialog = () => {
    setEditDialogOpen(false);
    setConfirmDialogOpen(false);
    setSelectedConfig(null);
  };

  const openCreateDialog = () => {
    setCreateValues({
      groupCode: '',
      code: '',
      nameTh: '',
      nameEn: '',
      sort: 1
    });
    setCreateDialogOpen(true);
  };

  const closeCreateDialog = () => {
    setCreateDialogOpen(false);
    setCreateConfirmDialogOpen(false);
  };

  const handleUpdate = async () => {
    if (!selectedConfig) return;

    setIsUpdating(true);

    try {
      await toast.promise(
        updateSystemConfig(selectedConfig.groupCode, selectedConfig.code, {
          nameTh: editValues.nameTh.trim(),
          nameEn: editValues.nameEn.trim(),
          sort: Number(editValues.sort)
        }),
        {
          loading: t('toast.loading'),
          success: t('toast.success'),
          error: t('toast.failed')
        }
      );

      setConfirmDialogOpen(false);
      setEditDialogOpen(false);
      setSelectedConfig(null);
      await systemConfigRefetch();
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCreate = async () => {
    setIsUpdating(true);

    try {
      await toast.promise(
        createSystemConfig({
          groupCode: createValues.groupCode.trim(),
          code: createValues.code.trim(),
          nameTh: createValues.nameTh.trim(),
          nameEn: createValues.nameEn.trim(),
          sort: Number(createValues.sort)
        }),
        {
          loading: t('toast.loading'),
          success: t('toast.success'),
          error: t('toast.failed')
        }
      );

      setCreateConfirmDialogOpen(false);
      setCreateDialogOpen(false);
      await systemConfigRefetch();
    } finally {
      setIsUpdating(false);
    }
  };

  const systemConfigRows =
    systemConfigList.length > 0 ? (
      systemConfigList.map((config: SystemConfig) => (
        <TableRow
          hover
          key={`${config.groupCode}-${config.code}`}
          onClick={() => openEditDialog(config)}
          sx={{ cursor: 'pointer' }}>
          <TableCell align="left">
            <TextLineClamp>{config.groupCode}</TextLineClamp>
          </TableCell>
          <TableCell>
            <TextLineClamp>{config.code}</TextLineClamp>
          </TableCell>
          <TableCell>
            <TextLineClamp>{config.nameTh || '-'}</TextLineClamp>
          </TableCell>
          <TableCell>
            <TextLineClamp>{config.nameEn || '-'}</TextLineClamp>
          </TableCell>
          <TableCell align="center">
            <TextLineClamp>{config.sort ?? '-'}</TextLineClamp>
          </TableCell>
        </TableRow>
      ))
    ) : (
      <TableRow>
        <TableCell colSpan={5}>
          <div className={classes.noResultMessage}>{t('warning.noResultList')}</div>
        </TableCell>
      </TableRow>
    );

  const systemConfigMobileRows =
    systemConfigList.length > 0 ? (
      systemConfigList.map((config: SystemConfig) => (
        <TableRow
          hover
          key={`${config.groupCode}-${config.code}`}
          onClick={() => openEditDialog(config)}
          sx={{ cursor: 'pointer' }}>
          <TableCell align="left">
            <Stack spacing={0.5}>
              <Typography variant="subtitle2" fontWeight={700}>
                {config.nameTh || '-'}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {config.groupCode}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {t('settingConfig.column.code')}: {config.code}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {t('settingConfig.column.nameEn')}: {config.nameEn || '-'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {t('settingConfig.column.sort')}: {config.sort ?? '-'}
              </Typography>
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
      <LoadingDialog open={isUpdating} />
      <PageTitle title={t('settingConfig.title')} />
      <Wrapper>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={1}
          useFlexGap
          sx={{
            mt: 1,
            justifyContent: { sm: 'flex-end' },
            alignItems: { xs: 'flex-end', sm: 'center' }
          }}>
          <Button
            fullWidth={isDownSm}
            variant="contained"
            className="btn-emerald-green"
            onClick={openCreateDialog}
            startIcon={<Add />}>
            {t('button.addNew')}
          </Button>
          <Button
            fullWidth={isDownSm}
            variant="contained"
            className="btn-indigo-blue"
            onClick={() => formik.handleSubmit()}
            startIcon={<Search />}>
            {t('button.search')}
          </Button>
          <Button
            fullWidth={isDownSm}
            variant="contained"
            className="btn-amber-orange"
            onClick={() => {
              formik.resetForm();
              setFilters({
                groupCode: '',
                code: '',
                keyword: ''
              });
              setPage(1);
            }}
            startIcon={<DisabledByDefault />}>
            {t('button.clear')}
          </Button>
        </Stack>

        <GridSearchSection container spacing={1}>
          <Grid item xs={12}>
            <Typography variant="h6" component="h2">
              {t('settingConfig.searchPanel')}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={2} style={{ paddingTop: '30px' }}>
            <TextField
              select
              fullWidth
              variant="outlined"
              label={t('settingConfig.column.groupCode')}
              disabled={isSystemConstantFetching}
              value={formik.values.groupCode}
              onChange={({ target }) => {
                formik.setFieldValue('groupCode', target.value);
                const nextValues = {
                  ...formik.values,
                  groupCode: target.value
                };
                setFilters({
                  groupCode: nextValues.groupCode.trim(),
                  code: nextValues.code.trim(),
                  keyword: nextValues.keyword.trim()
                });
                setPage(1);
              }}
              InputLabelProps={{ shrink: true }}>
              <MenuItem value="">{t('general.clearSelected')}</MenuItem>
              {(systemConstantList || []).map((groupCode) => (
                <MenuItem key={groupCode} value={groupCode}>
                  {groupCode}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={2} style={{ paddingTop: '30px', paddingLeft: '10px' }}>
            <TextField
              type="text"
              fullWidth
              variant="outlined"
              label={t('settingConfig.column.code')}
              value={formik.values.code}
              onChange={({ target }) => formik.setFieldValue('code', target.value)}
              onBlur={() => formik.handleSubmit()}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} sm={2} style={{ paddingTop: '30px', paddingLeft: '10px' }}>
            <TextField
              type="text"
              fullWidth
              variant="outlined"
              label={t('settingConfig.column.keyword')}
              value={formik.values.keyword}
              onChange={({ target }) => formik.setFieldValue('keyword', target.value)}
              onBlur={() => formik.handleSubmit()}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
        </GridSearchSection>

        {isMobileOnly ? (
          <GridSearchSection container>
            <TableContainer>
              <Table id="system_config_mobile___table">
                <TableHead>
                  <TableRow>
                    <TableCell align="center" className={classes.tableHeader}>
                      {t('settingConfig.mobileTitle')}
                    </TableCell>
                  </TableRow>
                </TableHead>
                {isSystemConfigFetching ? (
                  <TableBody>
                    <TableRow>
                      <TableCell colSpan={1} align="center">
                        <CircularProgress />
                      </TableCell>
                    </TableRow>
                  </TableBody>
                ) : (
                  <TableBody>{systemConfigMobileRows}</TableBody>
                )}
              </Table>
            </TableContainer>
          </GridSearchSection>
        ) : (
          <GridSearchSection container>
            <TableContainer>
              <Table id="system_config_list___table">
                <TableHead>
                  <TableRow>
                    <TableCell align="center" className={classes.tableHeader}>
                      {t('settingConfig.column.groupCode')}
                    </TableCell>
                    <TableCell align="center" className={classes.tableHeader}>
                      {t('settingConfig.column.code')}
                    </TableCell>
                    <TableCell align="center" className={classes.tableHeader}>
                      {t('settingConfig.column.nameTh')}
                    </TableCell>
                    <TableCell align="center" className={classes.tableHeader}>
                      {t('settingConfig.column.nameEn')}
                    </TableCell>
                    <TableCell align="center" className={classes.tableHeader}>
                      {t('settingConfig.column.sort')}
                    </TableCell>
                  </TableRow>
                </TableHead>
                {isSystemConfigFetching ? (
                  <TableBody>
                    <TableRow>
                      <TableCell colSpan={5} align="center">
                        <CircularProgress />
                      </TableCell>
                    </TableRow>
                  </TableBody>
                ) : (
                  <TableBody>{systemConfigRows}</TableBody>
                )}
              </Table>
            </TableContainer>
          </GridSearchSection>
        )}

        <GridSearchSection container>
          <Grid item xs={12}>
            {isSystemConfigFetching ? (
              ' '
            ) : (
              <Paginate
                pagination={systemConfigResponse?.pagination}
                page={page}
                pageSize={pageSize}
                setPage={setPage}
                setPageSize={setPageSize}
                refetch={systemConfigRefetch}
                totalRecords={systemConfigResponse?.pagination.totalRecords}
                isShow
              />
            )}
          </Grid>
        </GridSearchSection>
      </Wrapper>
      <Dialog open={editDialogOpen} onClose={closeEditDialog} fullWidth maxWidth="sm">
        <DialogTitle>{t('settingConfig.editDialogTitle')}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label={t('settingConfig.column.groupCode')}
                value={selectedConfig?.groupCode || ''}
                InputLabelProps={{ shrink: true }}
                InputProps={{ readOnly: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label={t('settingConfig.column.code')}
                value={selectedConfig?.code || ''}
                InputLabelProps={{ shrink: true }}
                InputProps={{ readOnly: true }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label={t('settingConfig.column.nameTh')}
                value={editValues.nameTh}
                onChange={({ target }) =>
                  setEditValues((prev) => ({
                    ...prev,
                    nameTh: target.value
                  }))
                }
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label={t('settingConfig.column.nameEn')}
                value={editValues.nameEn}
                onChange={({ target }) =>
                  setEditValues((prev) => ({
                    ...prev,
                    nameEn: target.value
                  }))
                }
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={6} sm={2}>
              <TextField
                fullWidth
                type="number"
                label={t('settingConfig.column.sort')}
                value={editValues.sort}
                inputProps={{ min: 1 }}
                onChange={({ target }) =>
                  setEditValues((prev) => ({
                    ...prev,
                    sort: Math.max(1, Number(target.value) || 1)
                  }))
                }
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button variant="contained" className="btn-crimson-red" onClick={closeEditDialog}>
            {t('button.close')}
          </Button>
          <Button
            variant="contained"
            className="btn-emerald-green"
            disabled={!isEditChanged}
            onClick={() => setConfirmDialogOpen(true)}>
            {t('button.update')}
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog open={createDialogOpen} onClose={closeCreateDialog} fullWidth maxWidth="sm">
        <DialogTitle>{t('settingConfig.createDialogTitle')}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12}>
              <TextField
                select
                fullWidth
                variant="outlined"
                label={t('settingConfig.column.groupCode')}
                disabled={isSystemConstantFetching}
                value={createValues.groupCode}
                onChange={({ target }) =>
                  setCreateValues((prev) => ({
                    ...prev,
                    groupCode: target.value
                  }))
                }
                InputLabelProps={{ shrink: true }}>
                <MenuItem value="">{t('general.clearSelected')}</MenuItem>
                {(systemConstantList || []).map((groupCode) => (
                  <MenuItem key={groupCode} value={groupCode}>
                    {groupCode}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label={t('settingConfig.column.code')}
                value={createValues.code}
                onChange={({ target }) =>
                  setCreateValues((prev) => ({
                    ...prev,
                    code: target.value
                  }))
                }
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label={t('settingConfig.column.nameTh')}
                value={createValues.nameTh}
                onChange={({ target }) =>
                  setCreateValues((prev) => ({
                    ...prev,
                    nameTh: target.value
                  }))
                }
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label={t('settingConfig.column.nameEn')}
                value={createValues.nameEn}
                onChange={({ target }) =>
                  setCreateValues((prev) => ({
                    ...prev,
                    nameEn: target.value
                  }))
                }
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                type="number"
                label={t('settingConfig.column.sort')}
                value={createValues.sort}
                inputProps={{ min: 1 }}
                onChange={({ target }) =>
                  setCreateValues((prev) => ({
                    ...prev,
                    sort: Math.max(1, Number(target.value) || 1)
                  }))
                }
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button variant="contained" className="btn-crimson-red" onClick={closeCreateDialog}>
            {t('button.cancel')}
          </Button>
          <Button
            variant="contained"
            className="btn-emerald-green"
            disabled={!isCreateValid}
            onClick={() => setCreateConfirmDialogOpen(true)}>
            {t('button.create')}
          </Button>
        </DialogActions>
      </Dialog>
      <ConfirmDialog
        open={confirmDialogOpen}
        title={t('settingConfig.confirmTitle')}
        message={t('settingConfig.confirmMessage')}
        confirmText={t('button.confirm')}
        cancelText={t('button.cancel')}
        isShowCancelButton
        isShowConfirmButton
        onCancel={() => setConfirmDialogOpen(false)}
        onConfirm={handleUpdate}
      />
      <ConfirmDialog
        open={createConfirmDialogOpen}
        title={t('settingConfig.createConfirmTitle')}
        message={t('settingConfig.createConfirmMessage')}
        confirmText={t('button.confirm')}
        cancelText={t('button.cancel')}
        isShowCancelButton
        isShowConfirmButton
        onCancel={() => setCreateConfirmDialogOpen(false)}
        onConfirm={handleCreate}
      />
    </Page>
  );
}
