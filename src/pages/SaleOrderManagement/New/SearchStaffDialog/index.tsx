import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import TablePagination from 'components/TablePagination';
import usePagination from 'hooks/usePagination';
import { Autocomplete, Box, Divider, Grid, TableCell, TableRow, TextField } from '@mui/material';
import { useEffect, useState } from 'react';
import { Search } from '@material-ui/icons';
import { useQuery } from 'react-query';
import TableContainer, { TableColumn } from 'components/TableContainer';
import CheckBoxComponent from 'components/CheckBoxComponent';
import TableRowNoData from 'components/TableRowNoData';
import { SearchStaffRequest, Staff } from 'services/Staff/staff-type';
import { getRoleList, searchStaff } from 'services/Staff/staff-api';
import { useTranslation } from 'react-i18next';
import { getSystemConfig } from 'services/Config/config-api';
import { GROUP_CODE } from 'services/Config/config-type';
import { getAllCompany } from 'services/Company/company-api';
import { usePropLocalizer } from 'hooks/usePropsLocalize';

type SearchStaffDialogProps = {
  currentSelectStaff?: Staff;
  open: boolean;
  onSelectStaff: (selectedCustomer: Staff) => void;
  setOpen: (open: boolean) => void;
};

export default function SearchStaffDialog({
  currentSelectStaff,
  open,
  onSelectStaff,
  setOpen
}: SearchStaffDialogProps) {
  const paginate = usePagination();
  const { t } = useTranslation();
  const tProps = usePropLocalizer();

  const defaultFilter = {
    idEqual: '',
    roleEqual: '',
    roleIn: ['ORDER_BKK', 'ORDER_PROVINCE'],
    companyIdEqual: '',
    statusEqual: '',
    typeEqual: '',
    nationalityEqual: '',
    workspaceEqual: '',
    startWorkingTime: '',
    endWorkingTime: ''
  };
  const [staffFilter, setStaffFilter] = useState<SearchStaffRequest>(defaultFilter);

  const { data: staffRoleList, isFetching: isStaffRoleFetching } = useQuery(
    ['staff-role-list', open],
    () => getRoleList(),
    { refetchOnWindowFocus: false, enabled: open }
  );
  const { data: nationalityList, isFetching: isNationalityFetching } = useQuery(
    ['nationality', open],
    () => getSystemConfig(GROUP_CODE.NATIONALITY),
    { refetchOnWindowFocus: false, enabled: open }
  );
  const { data: staffTypeList, isFetching: isStaffTypeFetching } = useQuery(
    ['staff-type', open],
    () => getSystemConfig(GROUP_CODE.STAFF_TYPE),
    { refetchOnWindowFocus: false, enabled: open }
  );
  const { data: workspaceList, isFetching: isWorkspaceFetching } = useQuery(
    ['workspace', open],
    () => getSystemConfig(GROUP_CODE.WORKSPACE),
    { refetchOnWindowFocus: false, enabled: open }
  );
  const { data: companyList, isFetching: isCompanyFetching } = useQuery(
    ['company-list', open],
    () => getAllCompany(),
    { refetchOnWindowFocus: false, enabled: open }
  );

  const { data, refetch, isFetching } = useQuery(
    ['search-staff', paginate.page, paginate.size, open],
    () => searchStaff(staffFilter, paginate.page, paginate.size),
    {
      refetchOnWindowFocus: false,
      onSuccess(data) {
        paginate.setTotalPage(data?.data?.pagination?.totalPage ?? 0);
      },
      enabled: open
    }
  );

  const columns: TableColumn[] = [
    {
      key: 'select',
      name: '',
      hidden: false
    },
    {
      key: 'staff_id',
      name: t('staffManagement.column.id'),
      hidden: false
    },
    {
      key: 'staff_name',
      name: t('staffManagement.column.name'),
      hidden: false
    },
    {
      key: 'staff_company',
      name: t('staffManagement.column.company'),
      hidden: false
    },
    {
      key: 'staff_position',
      name: t('staffManagement.column.role'),
      hidden: false
    },
    {
      key: 'staff_type',
      name: t('staffManagement.column.type'),
      hidden: false
    },
    {
      key: 'staff_workplace',
      name: t('staffManagement.column.workingspace'),
      hidden: false
    },
    {
      key: 'staff_nationality',
      name: t('staffManagement.column.nationality'),
      hidden: false
    }
  ];

  const rows = (data?.data?.staffs ?? []).map((staff, index) => {
    return (
      <TableRow
        key={index}
        onClick={() => {
          handleSelectStaff(staff);
        }}
        sx={{ cursor: 'pointer' }}>
        <TableCell width={`20px`}>
          <Box sx={{ display: 'flex', justifyContent: 'center' }}>
            <CheckBoxComponent
              type="checkbox"
              name="select"
              disable={false}
              id={`search_customer_${staff.id}_${index}_check_box`}
              isChecked={staff?.id === currentSelectStaff?.id}
              handleClick={() => { }}
            />
          </Box>
        </TableCell>
        <TableCell>{staff?.id ?? ''}</TableCell>
        <TableCell>{(staff?.firstName ?? '') + (staff?.lastName ?? '')}</TableCell>
        <TableCell>{staff?.company.nameTh ?? ''}</TableCell>
        <TableCell>{staff?.role.roleNameTh ?? ''}</TableCell>
        <TableCell>{staff?.type.nameTh ?? ''}</TableCell>
        <TableCell>{staff?.workSpace.nameTh ?? ''}</TableCell>
        <TableCell>{staff?.nationality.nameTh ?? ''}</TableCell>
      </TableRow>
    );
  });

  const handleSelectStaff = (staff: Staff) => {
    onSelectStaff(staff);
    setOpen(false);
  };

  const onAutoCompleteChange = (field: string, value: string, reason: string) => {
    setStaffFilter({
      ...staffFilter,
      [field]: reason === 'clear' ? '' : value
    });
  };

  const handleSearchClick = () => {
    if (paginate.page === 1) {
      refetch();
    }
    paginate.setPage(1);
  };

  useEffect(() => {
    if (!open) setStaffFilter(defaultFilter);
  }, [open]);

  return (
    <Dialog open={open} onClose={() => setOpen(false)} scroll={'paper'} maxWidth={'xl'} fullWidth>
      <DialogTitle id="scroll-dialog-title">
        <Box display="flex" alignItems="center" justifyContent={'space-between'} gap={2}>
          {t('purchaseOrder.orderInformationSection.searchStaffDialog.title')}
          <Button
            variant="contained"
            color="primary"
            startIcon={<Search />}
            onClick={handleSearchClick}>
            {t('commons.search')}
          </Button>
        </Box>
      </DialogTitle>
      <DialogContent dividers>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={3}>
            <Autocomplete
              disabled={isCompanyFetching}
              options={companyList?.map((option) => option.id) || []}
              getOptionLabel={(option) =>
                tProps(
                  companyList?.find((item) => item.id === option),
                  'name'
                ) ?? '-'
              }
              value={staffFilter?.companyIdEqual}
              onChange={(_event, value, reason) => {
                onAutoCompleteChange('companyIdEqual', value ?? '', reason);
              }}
              size="small"
              fullWidth
              renderInput={(params) => (
                <TextField
                  {...params}
                  label={t('staffManagement.column.company')}
                  InputLabelProps={{ shrink: true }}
                />
              )}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Autocomplete
              disabled={isStaffRoleFetching}
              options={staffRoleList?.map((option) => option.roleCode) || []}
              getOptionLabel={(option) =>
                tProps(
                  staffRoleList?.find((item) => item.roleCode === option),
                  'roleName'
                ) ?? '-'
              }
              value={staffFilter?.roleEqual}
              onChange={(_event, value, reason) => {
                onAutoCompleteChange('roleEqual', value ?? '', reason);
              }}
              size="small"
              fullWidth
              renderInput={(params) => (
                <TextField
                  {...params}
                  label={t('staffManagement.column.role')}
                  InputLabelProps={{ shrink: true }}
                />
              )}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Autocomplete
              disabled={isWorkspaceFetching}
              options={workspaceList?.map((option) => option.code) || []}
              getOptionLabel={(option) =>
                tProps(
                  workspaceList?.find((item) => item.code === option),
                  'name'
                ) ?? '-'
              }
              value={staffFilter?.workspaceEqual}
              onChange={(_event, value, reason) => {
                onAutoCompleteChange('workspaceEqual', value ?? '', reason);
              }}
              size="small"
              fullWidth
              renderInput={(params) => (
                <TextField
                  {...params}
                  label={t('staffManagement.column.workingspace')}
                  InputLabelProps={{ shrink: true }}
                />
              )}
            />
          </Grid>
          <Grid item xs={8} sm={4} md={2}>
            <Autocomplete
              disabled={isStaffTypeFetching}
              options={staffTypeList?.map((option) => option.code) || []}
              getOptionLabel={(option) =>
                tProps(
                  staffTypeList?.find((item) => item.code === option),
                  'name'
                ) ?? '-'
              }
              value={staffFilter?.typeEqual}
              onChange={(_event, value, reason) => {
                onAutoCompleteChange('typeEqual', value ?? '', reason);
              }}
              size="small"
              fullWidth
              renderInput={(params) => (
                <TextField
                  {...params}
                  label={t('staffManagement.column.type')}
                  InputLabelProps={{ shrink: true }}
                />
              )}
            />
          </Grid>
          <Grid item xs={4} sm={2} md={1}>
            <Autocomplete
              disabled={isNationalityFetching}
              options={nationalityList?.map((option) => option.code) || []}
              getOptionLabel={(option) =>
                tProps(
                  nationalityList?.find((item) => item.code === option),
                  'name'
                ) ?? '-'
              }
              value={staffFilter?.nationalityEqual}
              onChange={(_event, value, reason) => {
                onAutoCompleteChange('nationalityEqual', value ?? '', reason);
              }}
              size="small"
              fullWidth
              renderInput={(params) => (
                <TextField
                  {...params}
                  label={t('staffManagement.column.nationality')}
                  InputLabelProps={{ shrink: true }}
                />
              )}
            />
          </Grid>
        </Grid>
        <Divider sx={{ margin: '1rem 0', height: '0.3px' }} />
        <TableContainer
          columns={columns}
          isFetching={isFetching}
          data={rows.length > 0 ? rows : <TableRowNoData colSpan={columns.length} />}
        />
        <TablePagination {...paginate} />
      </DialogContent>
    </Dialog>
  );
}
