import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import TableContainer from 'components/TableContainer';
import TablePagination from 'components/TablePagination';
import TableRowNoData from 'components/TableRowNoData';
import usePagination from 'hooks/usePagination';
import { ProductItemDetail } from '../utils';
import { Box, Divider, Grid, TableCell, TableRow, TextField } from '@mui/material';
import { ChangeEvent, useEffect, useState } from 'react';
import CheckBoxComponent from 'components/CheckBoxComponent';
import { Search } from '@material-ui/icons';
import { SearchProductRequest } from 'services/Product/product-type';
import { searchProduct } from 'services/Product/product-api';
import { useQuery } from 'react-query';
import { useTranslation } from 'react-i18next';

type SearchProductDialogProps = {
  currentSelectProducts: ProductItemDetail[];
  open: boolean;
  setOpen: (open: boolean) => void;
  onSelectProducts: (selectedProducts: ProductItemDetail[]) => void;
};

export default function SearchProductDialog({
  currentSelectProducts,
  open,
  setOpen,
  onSelectProducts
}: SearchProductDialogProps) {
  const paginate = usePagination();
  const defaultFilter = {
    nameContain: '',
    skuContain: '',
    parentSkuEqual: '',
    isIncludeParentSku: false
  };
  const [productFilter, setProductFilter] = useState<SearchProductRequest>(defaultFilter);
  const [selectProducts, setSelectProducts] = useState<ProductItemDetail[]>(currentSelectProducts);
  const { t } = useTranslation();

  const {
    data: products,
    refetch,
    isFetching
  } = useQuery(
    ['search-staff', paginate.page, paginate.size, open],
    () =>
      searchProduct(
        {
          ...productFilter
        },
        paginate.page,
        paginate.size
      ),
    {
      refetchOnWindowFocus: false,
      onSuccess(data) {
        paginate.setTotalPage(data?.data?.pagination?.totalPage ?? 0);
      },
      enabled: open
    }
  );

  const columns = [
    {
      key: 'Select',
      name: '',
      hidden: false
    },
    {
      key: 'productName',
      name: t('purchaseOrder.addProductSection.searchProductDialog.column.productName'),
      hidden: false
    },
    {
      key: 'productSku',
      name: t('purchaseOrder.addProductSection.searchProductDialog.column.productSku'),
      hidden: false
    }
  ];

  const handleConfirmClick = () => {
    onSelectProducts(selectProducts);
    setOpen(false);
  };

  const rows: JSX.Element[] = (products?.data?.products ?? []).map((product, index) => (
    <TableRow key={index}>
      <TableCell width={`20px`}>
        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
          <CheckBoxComponent
            type="checkbox"
            name="select"
            disable={false}
            id={`search_product_${product.productSku}_check_box`}
            isChecked={selectProducts
              .map((product) => product.itemSku)
              .includes(product.productSku)}
            handleClick={() => {
              setSelectProducts((prev) => {
                if (prev.map((product) => product.itemSku).includes(product.productSku)) {
                  return prev.filter((p) => p.itemSku !== product.productSku);
                }
                return [
                  ...prev,
                  {
                    itemName: product.productName,
                    itemSku: product.productSku,
                    qty: 1
                  }
                ];
              });
            }}
          />
        </Box>
      </TableCell>
      <TableCell>{product.productName}</TableCell>
      <TableCell>{product.productSku}</TableCell>
    </TableRow>
  ));

  const handleSearchChange = (e: ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
    setProductFilter({
      ...productFilter,
      [e.target.name]: e.target.value
    });
  };

  const handleSearchClick = () => {
    if (paginate.page === 1) {
      refetch();
    }
    paginate.setPage(1);
  };

  useEffect(() => {
    if (!open) {
      setProductFilter(defaultFilter);
    } else {
      setSelectProducts(currentSelectProducts);
    }
  }, [open]);

  return (
    <Dialog open={open} onClose={() => setOpen(false)} scroll={'paper'} maxWidth={'md'} fullWidth>
      <DialogTitle id="scroll-dialog-title">
        <Box display="flex" alignItems="center" justifyContent={'space-between'} gap={2}>
          {t('purchaseOrder.addProductSection.searchProductDialog.title')}
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
          <Grid item xs={12} md={4}>
            <TextField
              label={t('purchaseOrder.addProductSection.searchProductDialog.column.productName')}
              variant="outlined"
              name="nameContain"
              value={productFilter.nameContain}
              onChange={handleSearchChange}
              size="small"
              fullWidth
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              label={t('purchaseOrder.addProductSection.searchProductDialog.column.productSku')}
              variant="outlined"
              name="skuContain"
              value={productFilter.skuContain}
              onChange={handleSearchChange}
              size="small"
              fullWidth
            />
          </Grid>
        </Grid>
        <Divider sx={{ margin: '1rem 0' }} />
        <TableContainer
          isFetching={isFetching}
          columns={columns}
          data={rows.length > 0 ? rows : <TableRowNoData colSpan={columns.length} />}
        />
        <TablePagination {...paginate} />
      </DialogContent>
      <DialogActions>
        <Button
          variant="outlined"
          onClick={() => {
            setOpen(false);
          }}>
          {t('commons.cancel')}
        </Button>
        <Button variant="contained" onClick={handleConfirmClick}>
          {t('commons.confirm')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
