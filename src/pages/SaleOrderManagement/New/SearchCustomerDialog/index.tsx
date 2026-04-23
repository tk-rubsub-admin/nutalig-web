import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import TablePagination from 'components/TablePagination';
import usePagination from 'hooks/usePagination';
import { Autocomplete, Box, Divider, Grid, TableCell, TableRow, TextField } from '@mui/material';
import { ChangeEvent, useEffect, useState } from 'react';
import { Search } from '@material-ui/icons';
import { Customer, SearchCustomerRequest } from 'services/Customer/customer-type';
import { useQuery } from 'react-query';
import { searchCustomer } from 'services/Customer/customer-api';
import TableContainer, { TableColumn } from 'components/TableContainer';
import CheckBoxComponent from 'components/CheckBoxComponent';
import TableRowNoData from 'components/TableRowNoData';
import { getSystemConfig } from 'services/Config/config-api';
import { GROUP_CODE } from 'services/Config/config-type';
import { useTranslation } from 'react-i18next';
import { usePropLocalizer } from 'hooks/usePropsLocalize';

type SearchCustomerDialogProps = {
  currentSelectCustomer?: Customer;
  open: boolean;
  onSelectCustomer: (selectedCustomer: Customer) => void;
  setOpen: (open: boolean) => void;
};

export default function SearchCustomerDialog({
  currentSelectCustomer,
  open,
  onSelectCustomer,
  setOpen
}: SearchCustomerDialogProps) {
  const paginate = usePagination();
  const { t } = useTranslation();
  const tProps = usePropLocalizer();

  const defaultFilter = {
    idEqual: '',
    nameContain: '',
    typeEqual: '',
    rankEqual: '',
    areaEqual: ''
  };
  const [customerFilter, setCustomerFilter] = useState<SearchCustomerRequest>(defaultFilter);

  const handleSearchChange = (e: ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
    setCustomerFilter({
      ...customerFilter,
      [e.target.name]: e.target.value
    });
  };

  const { data: customerTypeList, isFetching: isCustomerTypeFetching } = useQuery(
    'customer-type-list',
    () => getSystemConfig(GROUP_CODE.CUSTOMER_TYPE),
    { refetchOnWindowFocus: false }
  );

  const { data: areaTypeList, isFetching: isAreaTypeFetching } = useQuery(
    'area-type-list',
    () => getSystemConfig(GROUP_CODE.CUSTOMER_AREA),
    { refetchOnWindowFocus: false }
  );

  const { data, refetch, isFetching } = useQuery(
    ['search-customer', paginate.page, paginate.size, open],
    () => searchCustomer(customerFilter, paginate.page, paginate.size),
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
      key: 'customerId',
      name: t('customerManagement.customerId'),
      hidden: false
    },
    {
      key: 'customerName',
      name: t('customerManagement.customerName'),
      hidden: false
    },
    {
      key: 'customerType',
      name: t('customerManagement.column.type'),
      hidden: false
    },
    {
      key: 'phoneNumber',
      name: t('customerManagement.phoneNumber'),
      hidden: false
    },
    {
      key: 'areaType',
      name: t('customerManagement.column.dropOff.areaType'),
      hidden: false
    }
  ];

  const rows = (data?.data?.customers ?? []).map((customer, index) => {
    return (
      <TableRow
        key={index}
        onClick={() => {
          handleSelectCustomer(customer);
        }}
        sx={{ cursor: 'pointer' }}>
        <TableCell width={`20px`}>
          <Box sx={{ display: 'flex', justifyContent: 'center' }}>
            <CheckBoxComponent
              type="checkbox"
              name="select"
              disable={false}
              id={`search_customer_${customer.customerId}_${index}_check_box`}
              isChecked={customer?.customerId === currentSelectCustomer?.customerId}
              handleClick={() => { }}
            />
          </Box>
        </TableCell>
        <TableCell>{customer?.customerId ?? ''}</TableCell>
        <TableCell>{customer?.customerName ?? ''}</TableCell>
        <TableCell>{tProps(customer?.customerType, 'name') ?? '-'}</TableCell>
        <TableCell>{customer?.contactNumber ?? ''}</TableCell>
        <TableCell>{tProps(customer?.customerDropOffs?.[0]?.area, 'name') ?? '-'}</TableCell>
      </TableRow>
    );
  });

  const handleSelectCustomer = (customer: Customer) => {
    onSelectCustomer(customer);
    setOpen(false);
  };

  const onAutoCompleteChange = (field: string, value: string, reason: string) => {
    setCustomerFilter({
      ...customerFilter,
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
    if (!open) setCustomerFilter(defaultFilter);
  }, [open]);

  return (
    <Dialog open={open} onClose={() => setOpen(false)} scroll={'paper'} maxWidth={'md'} fullWidth>
      <DialogTitle id="scroll-dialog-title" >
        <Box display="flex" alignItems="center" justifyContent={'space-between'} gap={2}>
          {t('purchaseOrder.customerInformationSection.searchCustomerDialog.title')}
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
          <Grid item xs={12} md={3}>
            <TextField
              label={t('customerManagement.column.id')}
              variant="outlined"
              name="idEqual"
              value={customerFilter?.idEqual ?? ''}
              onChange={handleSearchChange}
              size="small"
              fullWidth
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField
              label={t('customerManagement.customerName')}
              variant="outlined"
              name="nameContain"
              value={customerFilter?.nameContain ?? ''}
              onChange={handleSearchChange}
              size="small"
              fullWidth
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <Autocomplete
              disabled={isCustomerTypeFetching}
              options={customerTypeList?.map((option) => option.code) || []}
              getOptionLabel={(option) =>
                tProps(
                  customerTypeList?.find((item) => item.code === option),
                  'name'
                ) ?? '-'
              }
              value={customerFilter?.typeEqual}
              onChange={(_event, value, reason) => {
                onAutoCompleteChange('typeEqual', value ?? '', reason);
              }}
              size="small"
              fullWidth
              renderInput={(params) => (
                <TextField {...params} label={t('customerManagement.column.type')} />
              )}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <Autocomplete
              disabled={isAreaTypeFetching}
              options={areaTypeList?.map((option) => option.code) || []}
              getOptionLabel={(option) =>
                tProps(
                  areaTypeList?.find((item) => item.code === option),
                  'name'
                ) ?? '-'
              }
              value={customerFilter?.areaEqual}
              onChange={(_event, value, reason) => {
                onAutoCompleteChange('areaEqual', value ?? '', reason);
              }}
              size="small"
              fullWidth
              renderInput={(params) => (
                <TextField {...params} label={t('customerManagement.column.dropOff.areaType')} />
              )}
            />
          </Grid>
        </Grid>
        <Divider sx={{ margin: '1rem 0' }} />
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
