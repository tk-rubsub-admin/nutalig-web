/* eslint-disable prettier/prettier */
import {
  Cancel,
  Check,
  CheckCircle,
  ContentCopy,
  DeleteForever,
  DisabledByDefault,
  Edit,
  Password,
  PersonOff,
  Search
} from '@mui/icons-material';
import styled from 'styled-components';
import { makeStyles } from '@mui/styles';
import {
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Grid,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography
} from '@mui/material';
import PageTitle from 'components/PageTitle';
import { GridSearchSection, TextLineClamp, Wrapper } from 'components/Styled';
import { Page } from 'layout/LayoutRoute';
import { useTranslation } from 'react-i18next';
import { useQuery } from 'react-query';
import { useEffect, useState } from 'react';
import { SearchUserRequest, UserProfileResponse } from 'services/User/user-type';
import { useAuth } from 'auth/AuthContext';
import { copyText } from 'utils/copyContent';
import { useFormik } from 'formik';
import LoadingDialog from 'components/LoadingDialog';
import { deleteUser, getAllUserRole, resetUserPassword, searchUser, updateActiveInactiveUser } from 'services/User/user-api';
import Paginate from 'components/Paginate';
import toast from 'react-hot-toast';
import ConfirmDialog from 'components/ConfirmDialog';

const TableHeaderColumn = styled.div`
  border-left: 2px solid #e0e0e0;
  font-weight: bold;
  padding-left: 10px;
`;

export default function AdminManagement(): JSX.Element {
  const useStyles = makeStyles({
    noResultMessage: {
      textAlign: 'center',
      fontSize: '1.2em',
      fontWeight: 'bold',
      padding: '48px 0'
    }
  });
  const classes = useStyles();
  const { getRole } = useAuth();
  const { t } = useTranslation();
  const [page, setPage] = useState<number>(1);
  const [pages, setPages] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(50);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [userFilter, setUserFilter] = useState<SearchUserRequest>({
    usernameContain: '',
    roleNameEqual: '',
    activeEqual: '',
    companyIdEqual: ''
  });
  const [visibleConfirmationDialog, setVisibleConfirmationDialog] = useState(false);
  const [title, setTitle] = useState<string>('');
  const [msg, setMsg] = useState<string>('');
  const [action, setAction] = useState<string>('');
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const formik = useFormik({
    initialValues: {
      roleNameEqual: '',
      activeEqual: '',
      companyIdEqual: ''
    },
    enableReinitialize: false,
    onSubmit: (value) => {
      console.log(value);
      const updateObj = { ...value } as unknown as SearchUserRequest;
      setUserFilter(updateObj);
      setPage(1);
    }
  });
  const {
    data: userList,
    refetch: userRefetch,
    isFetching: isUserFetching
  } = useQuery(['user-list', userFilter, page, pageSize], () => searchUser(userFilter, page, pageSize), {
    refetchOnWindowFocus: false,
    keepPreviousData: true,
    onSuccess: (data) => {
      if (data?.data?.pagination) {
        setPage(data.data.pagination.page);
        setPageSize(data.data.pagination.size);
        setPages(data.data.pagination.totalPage);
      }
    }
  });
  const funcResetUserPassword = (userId: string) => {
    setIsLoading(true);
    toast.promise(resetUserPassword(userId), {
      loading: t('toast.loading'),
      success: () => {
        return t('toast.success');
      },
      error: (error) => t('toast.failed') + ' ' + error.message
    }).finally(() => {
      setIsLoading(false);
    });
  };
  const funcActiveInactiveUser = (userId: string, status: string) => {
    setIsLoading(true);
    toast.promise(updateActiveInactiveUser(userId, status), {
      loading: t('toast.loading'),
      success: () => {
        return t('toast.success');
      },
      error: (error) => t('toast.failed') + ' ' + error.message
    }).finally(() => {
      setIsLoading(false);
    });
  };
  const funcDeleteUser = (userId: string) => {
    setIsLoading(true);
    toast.promise(deleteUser(userId), {
      loading: t('toast.loading'),
      success: () => {
        return t('toast.success');
      },
      error: (error) => t('toast.failed') + ' ' + error.message
    }).finally(() => {
      setIsLoading(false);
    });
  };
  const { data: roleList, isFetching: fetchingRole } = useQuery('role-list', () =>
    getAllUserRole()
  );

  const userData = (!isUserFetching &&
    userList &&
    userList.data.users.length > 0 &&
    userList.data.users.map((user: UserProfileResponse) => {
      return (
        <TableRow hover id={`user__index-${user.id}`} key={user.id}>
          <TableCell align="center">
            <TextLineClamp>{user.id}</TextLineClamp>
          </TableCell>
          <TableCell align="left">
            <TextLineClamp>{user.username}</TextLineClamp>
          </TableCell>
          <TableCell align="left">
            <TextLineClamp>{user.role.roleNameTh}</TextLineClamp>
          </TableCell>
          <TableCell align="center">
            <TextLineClamp>{t(`userManagement.status.${user.status}`)}</TextLineClamp>
          </TableCell>
          <TableCell style={{ textAlign: 'center' }}>
            <TextLineClamp>
              <Tooltip title={t('userManagement.actions.resetPassword')}>
                <IconButton
                  disabled={getRole() !== 'SUPER_ADMIN'}
                  onClick={() => {
                    setSelectedUserId(user.id);
                    setTitle(t('userManagement.confirmResetPasswordTitle'));
                    setMsg(t('userManagement.confirmResetPasswordMsg'));
                    setAction('RESET_PASSWORD');
                    setVisibleConfirmationDialog(true);
                  }}>
                  <Password />
                </IconButton>
              </Tooltip>
              &nbsp;&nbsp;
              {user.status === 'ACTIVE' ? (
                <Tooltip title={t('userManagement.actions.setInactive')}>
                  <IconButton onClick={() => {
                    setSelectedUserId(user.id);
                    setTitle(t('userManagement.confirmInactiveUserTitle'));
                    setMsg(t('userManagement.confirmInactiveUserMsg'));
                    setAction('INACTIVE');
                    setVisibleConfirmationDialog(true);
                  }}>
                    <Cancel />
                  </IconButton>
                </Tooltip>
              ) : (
                <Tooltip title={t('userManagement.actions.setActive')}>
                  <IconButton onClick={() => {
                    setSelectedUserId(user.id);
                    setTitle(t('userManagement.confirmActiveUserTitle'));
                    setMsg(t('userManagement.confirmActiveUserMsg'));
                    setAction('ACTIVE');
                    setVisibleConfirmationDialog(true);
                  }}>
                    <CheckCircle />
                  </IconButton>
                </Tooltip>
              )}
              &nbsp;&nbsp;
              <Tooltip title={t('userManagement.actions.delete')}>
                <IconButton onClick={() => {
                  setSelectedUserId(user.id);
                  setTitle(t('userManagement.confirmDeleteUserTitle'));
                  setMsg(t('userManagement.confirmDeleteUserMsg'));
                  setAction('DELETE');
                  setVisibleConfirmationDialog(true);
                }}>
                  <DeleteForever />
                </IconButton>
              </Tooltip>
            </TextLineClamp>
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
  return (
    <Page>
      <PageTitle title={t('userManagement.title')} />
      <Wrapper>
        <Grid container spacing={1}>
          <Grid item xs={12} sm={6}>
            <Typography variant="h6" component="h2">
              {t('general.search')} {t('userManagement.user')}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6} style={{ textAlign: 'right' }}>
            <Button
              variant="contained"
              className="btn-indigo-blue"
              onClick={() => formik.handleSubmit()}
              startIcon={<Search />}>
              {t('button.search')}
            </Button>
            &nbsp;&nbsp;
            <Button
              variant="contained"
              className="btn-amber-orange"
              onClick={() => formik.resetForm()}
              startIcon={<DisabledByDefault />}>
              {t('button.clear')}
            </Button>
          </Grid>
        </Grid>
        {/* <GridSearchSection container spacing={1}></GridSearchSection> */}
        <GridSearchSection container spacing={1} />
        <TableContainer>
          <Table id="user_list___table">
            <TableHead>
              <TableRow>
                <TableCell align="center" key="userId">
                  <TableHeaderColumn>{t('userManagement.tableHeaders.userId')}</TableHeaderColumn>
                </TableCell>
                <TableCell align="center" key="email">
                  <TableHeaderColumn>{t('userManagement.tableHeaders.email')}</TableHeaderColumn>
                </TableCell>
                <TableCell align="center" key="role">
                  <TableHeaderColumn>{t('userManagement.tableHeaders.role')}</TableHeaderColumn>
                </TableCell>
                <TableCell align="center" key="status">
                  <TableHeaderColumn>{t('userManagement.tableHeaders.status')}</TableHeaderColumn>
                </TableCell>
                <TableCell align="center" key="action">
                  <TableHeaderColumn>action</TableHeaderColumn>
                </TableCell>
              </TableRow>
            </TableHead>
            {isUserFetching ? (
              <TableBody>
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              </TableBody>
            ) : (
              <TableBody>{userData}</TableBody>
            )}
          </Table>
        </TableContainer>
        <GridSearchSection container>
          <Grid item xs={12}>
            {isUserFetching ? (
              <></>
            ) : (
              <Paginate
                pagination={userList?.data.pagination}
                page={page}
                pageSize={pageSize}
                setPage={setPage}
                setPageSize={setPageSize}
                refetch={userRefetch}
                totalRecords={userList?.data.pagination.totalRecords}
                isShow={true}
              />
            )}
          </Grid>
        </GridSearchSection>
      </Wrapper>
      <LoadingDialog open={isLoading} />
      <ConfirmDialog
        open={visibleConfirmationDialog}
        title={title}
        message={msg}
        confirmText={t('button.confirm')}
        cancelText={t('button.cancel')}
        onConfirm={() => {
          if (action === 'INACTIVE') {
            funcActiveInactiveUser(selectedUserId, 'INACTIVE');
          } else if (action === 'ACTIVE') {
            funcActiveInactiveUser(selectedUserId, 'ACTIVE');
          } else if (action === 'RESET_PASSWORD') {
            funcResetUserPassword(selectedUserId);
          } else if (action === 'DELETE') {
            funcDeleteUser(selectedUserId);
          }
          setVisibleConfirmationDialog(false);
        }}
        onCancel={() => setVisibleConfirmationDialog(false)}
        isShowCancelButton={true}
        isShowConfirmButton={true}
      />
    </Page>
  );
}
