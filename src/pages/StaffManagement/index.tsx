import {
  PersonAddAlt1,
  DisabledByDefault,
  PersonSearch,
  Circle,
  Person,
  AccessTime,
  CloudUpload,
  DownloadForOffline
} from '@mui/icons-material';
import { makeStyles } from '@mui/styles';
import {
  Button,
  Grid,
  TableContainer,
  TableCell,
  TableRow,
  TextField,
  Typography,
  CircularProgress,
  Table,
  TableBody,
  TableHead,
  Autocomplete,
  useTheme,
  useMediaQuery,
  Stack
} from '@mui/material';
import PageTitle from 'components/PageTitle';
import { GridSearchSection, GridTextField, TextLineClamp, Wrapper } from 'components/Styled';
import { useFormik } from 'formik';
import { Page } from 'layout/LayoutRoute';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from 'react-query';
import { useHistory } from 'react-router-dom';
import { ROUTE_PATHS } from 'routes';
import { exportStaff, getRoleList, searchStaff } from 'services/Staff/staff-api';
import { SearchStaffRequest, Staff } from 'services/Staff/staff-type';
import Paginate from 'components/Paginate';
import { getSystemConfig } from 'services/Config/config-api';
import { GROUP_CODE, SystemConfig } from 'services/Config/config-type';
import { Role } from 'services/User/user-type';
import { isMobileOnly } from 'react-device-detect';
import { statusList } from 'utils/constant';
import PhoneCallBox from 'components/PhoneCallBox';
import UploadStaffDialog from './Dialog/UploadStaffDialog';
import toast from 'react-hot-toast';

export default function StaffManagement(): JSX.Element {
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
  const history = useHistory();
  const [page, setPage] = useState<number>(1);
  const [pages, setPages] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [openUploadDialog, setOpenUploadDialog] = useState(false);

  const defaultFilter: SearchStaffRequest = {
    idEqual: '',
    roleEqual: '',
    companyIdEqual: '',
    statusEqual: '',
    typeEqual: '',
    nationalityEqual: '',
    workspaceEqual: '',
    startWorkingTime: '',
    endWorkingTime: ''
  };
  const [staffFilter, setStaffFilter] = useState<SearchStaffRequest>({
    ...defaultFilter
  });
  const formik = useFormik({
    initialValues: {
      idEqual: '',
      roleEqual: '',
      companyIdEqual: '',
      statusEqual: '',
      typeEqual: '',
      nationalityEqual: '',
      workspaceEqual: '',
      startWorkingTime: '',
      endWorkingTime: ''
    },
    enableReinitialize: false,
    onSubmit: (value) => {
      console.log(value);
      const updateObj = {
        idEqual: value.idEqual,
        roleEqual: value.roleEqual.roleCode,
        companyIdEqual: value.companyIdEqual.id,
        statusEqual: value.statusEqual,
        typeEqual: value.typeEqual.code,
        nationalityEqual: value.nationalityEqual.code,
        workspaceEqual: value.workspaceEqual.code,
        startWorkingTime: '',
        endWorkingTime: ''
      } as SearchStaffRequest;
      console.log(updateObj);
      setStaffFilter(updateObj);
      setPage(1);
    }
  });
  const {
    data: staffList,
    refetch: staffRefetch,
    isFetching: isStaffFetching
  } = useQuery(
    ['staff-list', staffFilter, page, pageSize],
    () => searchStaff(staffFilter, page, pageSize),
    {
      refetchOnWindowFocus: false,
      keepPreviousData: true,
      onSuccess: (data) => {
        if (data?.data?.pagination) {
          setPage(data.data.pagination.page);
          setPageSize(data.data.pagination.size);
          setPages(data.data.pagination.totalPage);
        }
      }
    }
  );
  const { data: staffRoleList, isFetching: isStaffRoleFetching } = useQuery(
    'staff-role-list',
    () => getRoleList(),
    { refetchOnWindowFocus: false }
  );
  const { data: nationalityList, isFetching: isNationalityFetching } = useQuery(
    'nationality',
    () => getSystemConfig(GROUP_CODE.NATIONALITY),
    { refetchOnWindowFocus: false }
  );
  const { data: workspaceList, isFetching: isWorkspaceFetching } = useQuery(
    'workspace',
    () => getSystemConfig(GROUP_CODE.WORKSPACE),
    { refetchOnWindowFocus: false }
  );

  const onAutoCompleteChange = (field: string, value: SystemConfig, reason: string) => {
    if (reason === 'clear') {
      formik.setFieldValue(field, '');
    } else {
      formik.setFieldValue(field, value);
    }
  };
  const staffData = (!isStaffFetching &&
    staffList &&
    staffList.data.staffs.length > 0 &&
    staffList.data.staffs.map((staff: Staff) => {
      return (
        <TableRow
          hover
          id={`staff__index-${staff.id}`}
          key={staff.id}
          onClick={() => {
            history.push(`/staff/${staff.id}`);
          }}>
          <TableCell align="left">
            <TextLineClamp>
              <Typography variant="body2">
                {staff.employeeId}
                &nbsp;
                {staff.status === 'ACTIVE' ? (
                  <Circle style={{ fontSize: '10px', color: 'green' }} />
                ) : (
                  <Circle style={{ fontSize: '10px', color: 'red' }} />
                )}
              </Typography>
              <Typography variant="caption">{'(' + staff.id + ')'}</Typography>
            </TextLineClamp>
          </TableCell>
          <TableCell align="left">
            <TextLineClamp>{staff.displayName}</TextLineClamp>
          </TableCell>
          <TableCell align="left">
            <TextLineClamp>{staff.company.nameTh}</TextLineClamp>
          </TableCell>
          <TableCell align="left">
            <TextLineClamp>{staff.role.roleNameTh}</TextLineClamp>
          </TableCell>
          <TableCell align="left">
            <TextLineClamp>{staff.staffType + ' / ' + staff.type?.nameTh}</TextLineClamp>
          </TableCell>
          <TableCell align="left">
            <TextLineClamp>{staff.nationality.nameTh}</TextLineClamp>
          </TableCell>
          <TableCell align="left">
            <TextLineClamp>{staff.workSpace.nameTh}</TextLineClamp>
          </TableCell>
        </TableRow>
      );
    })) || (
      <TableRow>
        <TableCell colSpan={7}>
          <div className={classes.noResultMessage}>{t('warning.noResultList')}</div>
        </TableCell>
      </TableRow>
    );

  const staffMobileViewData = (!isStaffFetching &&
    staffList &&
    staffList.data.staffs.length > 0 &&
    staffList.data.staffs.map((staff: Staff) => {
      return (
        <TableRow
          hover
          id={`staff__index-${staff.id}`}
          key={staff.id}
          onClick={() => {
            history.push(`/staff/${staff.id}`);
          }}>
          <TableCell align="left">
            <Person style={{ fontSize: '15px' }} /> <strong>{staff.nickname}</strong>
            <br />
            {t('staffManagement.column.role') + ' : ' + staff.role.roleNameTh}
            <br />
            <AccessTime style={{ fontSize: '15px' }} />{' '}
            {staff.startWorkingTime === 'null' ? '-' : staff.startWorkingTime}
            <br />
            {staff.telNo.replaceAll('-', '').trim() === '' ||
              staff.telNo.replaceAll('-', '').trim() === '-' ? (
              <></>
            ) : (
              <PhoneCallBox
                phoneNumber={staff.telNo}
                onClickLink={(event) => event.stopPropagation()}
              />
            )}
          </TableCell>
        </TableRow>
      );
    })) || (
      <TableRow>
        <TableCell colSpan={1}>
          <div className={classes.noResultMessage}>{t('warning.noResultList')}</div>
        </TableCell>
      </TableRow>
    );

  const handleExportStaff = async () => {
    toast.promise(exportStaff(staffFilter), {
      loading: t('toast.loading'),
      success: (response) => {
        // Create a temporary URL for the Blob
        const url = window.URL.createObjectURL(new Blob([response.data]));

        let filename = 'พนักงาน.xlsx'; // fallback

        // Create a temporary <a> element to trigger the download
        const tempLink = document.createElement('a');
        tempLink.href = url;
        tempLink.setAttribute('download', filename); // Set the desired filename for the downloaded file

        // Append the <a> element to the body and click it to trigger the download
        document.body.appendChild(tempLink);
        tempLink.click();

        // Clean up the temporary elements and URL
        document.body.removeChild(tempLink);
        window.URL.revokeObjectURL(url);
        return t('toast.success');
      },
      error: () => {
        return t('toast.failed');
      }
    });
  };

  return (
    <Page>
      <PageTitle title={t('staffManagement.title')} />
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
            variant="contained"
            className="btn-emerald-green"
            onClick={() => history.push(ROUTE_PATHS.STAFF_NEW)}
            startIcon={<PersonAddAlt1 />}>
            {t('staffManagement.action.create')}
          </Button>
          <Button
            fullWidth={isDownSm}
            variant="contained"
            className="btn-indigo-blue"
            onClick={() => formik.handleSubmit()}
            startIcon={<PersonSearch />}>
            {t('button.search')}
          </Button>
          <Button
            fullWidth={isDownSm}
            variant="contained"
            className="btn-amber-orange"
            onClick={() => {
              formik.resetForm();
              formik.handleSubmit();
            }}
            startIcon={<DisabledByDefault />}>
            {t('button.clear')}
          </Button>
          <Button
            fullWidth={isDownSm}
            variant="contained"
            className="btn-baby-blue"
            onClick={() => setOpenUploadDialog(true)}
            startIcon={<CloudUpload />}>
            {t('button.importStocks')}
          </Button>
          <Button
            fullWidth={isDownSm}
            variant="contained"
            className="btn-green-teal"
            onClick={() => handleExportStaff()}
            startIcon={<DownloadForOffline />}>
            {t('button.export')}
          </Button>
        </Stack>
      </Wrapper>
      <Wrapper>
        <GridSearchSection container spacing={1}>
          <Grid item xs={12} sm={12}>
            <Typography variant="h6" component="h2">
              {t('staffManagement.searchPanel')}
            </Typography>
          </Grid>
          <GridTextField item xs={6} sm={2}>
            <Autocomplete
              disabled={isStaffRoleFetching}
              disablePortal
              options={staffRoleList?.map((option) => option) || []}
              getOptionLabel={(option: Role) => option.roleNameTh}
              sx={{ width: '100%' }}
              value={formik.values.roleEqual || null}
              onChange={(_event, value, reason) => {
                onAutoCompleteChange('roleEqual', value, reason);
                formik.handleSubmit();
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label={t('staffManagement.column.role')}
                  InputLabelProps={{ shrink: true }}
                  inputProps={{
                    ...params.inputProps,
                    readOnly: true // 🔑 Prevents keyboard
                  }}
                />
              )}
            />
          </GridTextField>
          <GridTextField item xs={6} sm={2}>
            <Autocomplete
              disablePortal
              options={statusList?.map((option) => option) || []}
              getOptionLabel={(option) => t(`userManagement.status.${option}`)}
              sx={{ width: '100%' }}
              value={formik.values.statusEqual || null}
              onChange={(_event, value, reason) => {
                onAutoCompleteChange('statusEqual', value, reason);
                formik.handleSubmit();
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label={t('staffManagement.column.status')}
                  InputLabelProps={{ shrink: true }}
                  inputProps={{
                    ...params.inputProps,
                    readOnly: true // 🔑 Prevents keyboard
                  }}
                />
              )}
            />
          </GridTextField>
          <GridTextField item xs={6} sm={2}>
            <Autocomplete
              disabled={isNationalityFetching}
              disablePortal
              options={nationalityList?.map((option) => option) || []}
              getOptionLabel={(option: SystemConfig) => option.nameTh}
              sx={{ width: '100%' }}
              value={formik.values.nationalityEqual || null}
              onChange={(_event, value, reason) => {
                onAutoCompleteChange('nationalityEqual', value, reason);
                formik.handleSubmit();
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label={t('staffManagement.column.nationality')}
                  InputLabelProps={{ shrink: true }}
                  inputProps={{
                    ...params.inputProps,
                    readOnly: true // 🔑 Prevents keyboard
                  }}
                />
              )}
            />
          </GridTextField>
          <GridTextField item xs={6} sm={2}>
            <Autocomplete
              disabled={isWorkspaceFetching}
              disablePortal
              options={workspaceList?.map((option) => option) || []}
              getOptionLabel={(option: SystemConfig) => option.nameTh}
              sx={{ width: '100%' }}
              value={formik.values.workspaceEqual || null}
              onChange={(_event, value, reason) => {
                onAutoCompleteChange('workspaceEqual', value, reason);
                formik.handleSubmit();
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label={t('staffManagement.column.workingspace')}
                  InputLabelProps={{ shrink: true }}
                  inputProps={{
                    ...params.inputProps,
                    readOnly: true // 🔑 Prevents keyboard
                  }}
                />
              )}
            />
          </GridTextField>
        </GridSearchSection>
        {isMobileOnly ? (
          <>
            <GridSearchSection container>
              <TableContainer>
                <Table id="purchase-staff_list___table">
                  <TableHead>
                    <TableRow>
                      <TableCell align="center" key="staff" className={classes.tableHeader}>
                        {t('staffManagement.staff')}
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  {isStaffFetching ? (
                    <TableBody>
                      <TableRow>
                        <TableCell colSpan={1} align="center">
                          <CircularProgress />
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  ) : (
                    <TableBody>{staffMobileViewData}</TableBody>
                  )}
                </Table>
              </TableContainer>
            </GridSearchSection>
            <GridSearchSection container>
              <Grid item xs={12}>
                <Paginate
                  pagination={staffList?.data.pagination}
                  page={page}
                  pageSize={pageSize}
                  setPage={setPage}
                  setPageSize={setPageSize}
                  refetch={staffRefetch}
                  totalRecords={staffList?.data.pagination.totalRecords}
                  isShow={true}
                />
              </Grid>
            </GridSearchSection>
          </>
        ) : (
          <>
            <TableContainer>
              <Table id="staff_list___table">
                <TableHead>
                  <TableRow>
                    <TableCell align="center" key="staffId" className={classes.tableHeader}>
                      {t('staffManagement.column.id')}
                    </TableCell>
                    <TableCell align="center" key="staffName" className={classes.tableHeader}>
                      {t('staffManagement.column.name')}
                    </TableCell>
                    <TableCell align="center" key="company" className={classes.tableHeader}>
                      {t('staffManagement.column.company')}
                    </TableCell>
                    <TableCell align="center" key="role" className={classes.tableHeader}>
                      {t('staffManagement.column.role')}
                    </TableCell>
                    <TableCell align="center" key="type" className={classes.tableHeader}>
                      {t('staffManagement.column.type')}
                    </TableCell>
                    <TableCell align="center" key="nationality" className={classes.tableHeader}>
                      {t('staffManagement.column.nationality')}
                    </TableCell>
                    <TableCell align="center" key="workspace" className={classes.tableHeader}>
                      {t('staffManagement.column.workingspace')}
                    </TableCell>
                  </TableRow>
                </TableHead>
                {isStaffFetching ? (
                  <TableBody>
                    <TableRow>
                      <TableCell colSpan={7} align="center">
                        <CircularProgress />
                      </TableCell>
                    </TableRow>
                  </TableBody>
                ) : (
                  <TableBody>{staffData}</TableBody>
                )}
              </Table>
            </TableContainer>
            <GridSearchSection container>
              <Grid item xs={12}>
                <Paginate
                  pagination={staffList?.data.pagination}
                  page={page}
                  pageSize={pageSize}
                  setPage={setPage}
                  setPageSize={setPageSize}
                  refetch={staffRefetch}
                  totalRecords={staffList?.data.pagination.totalRecords}
                  isShow={true}
                />
              </Grid>
            </GridSearchSection>
          </>
        )}
      </Wrapper>
      <UploadStaffDialog
        open={openUploadDialog}
        onClose={() => {
          setOpenUploadDialog(false);
          staffRefetch();
        }}
      />
    </Page>
  );
}
