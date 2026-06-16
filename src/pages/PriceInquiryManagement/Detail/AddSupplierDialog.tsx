import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Stack, TextField, Typography } from '@mui/material';
import { ReactElement } from 'react';
import { Supplier } from 'services/Supplier/supplier-type';
import { blueActionButtonSx } from './supplierQuoteDialogStyles';

interface AddSupplierDialogProps {
  open: boolean;
  supplierSearchInput: string;
  onSupplierSearchInputChange: (value: string) => void;
  onSearchEnter: () => void;
  onSearch: () => void;
  isSupplierSearchFetching: boolean;
  supplierSearchResult: Supplier[];
  suggestedSupplierIds: Set<string>;
  onSelectSupplier: (supplier: Supplier) => void;
  onClose: () => void;
}

export function AddSupplierDialog(props: AddSupplierDialogProps): ReactElement {
  const {
    open,
    supplierSearchInput,
    onSupplierSearchInputChange,
    onSearchEnter,
    onSearch,
    isSupplierSearchFetching,
    supplierSearchResult,
    suggestedSupplierIds,
    onSelectSupplier,
    onClose
  } = props;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>เพิ่มคู่ค้า</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
            <TextField
              fullWidth
              size="small"
              label="ค้นหาคู่ค้า"
              value={supplierSearchInput}
              onChange={(event) => onSupplierSearchInputChange(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  onSearchEnter();
                }
              }}
            />
            <Button variant="contained" sx={blueActionButtonSx} onClick={onSearch}>
              ค้นหา
            </Button>
          </Stack>
          {isSupplierSearchFetching ? (
            <Stack alignItems="center" justifyContent="center" sx={{ py: 4 }}>
              <Typography variant="body2" color="text.secondary">
                กำลังโหลดข้อมูลคู่ค้า...
              </Typography>
            </Stack>
          ) : supplierSearchResult.length ? (
            <Stack spacing={1.25}>
              {supplierSearchResult.map((supplier) => {
                const supplierId = supplier.supplierId || supplier.id;
                const isAlreadySuggested = supplierId ? suggestedSupplierIds.has(supplierId) : false;

                return (
                  <Box
                    key={supplier.supplierId || supplier.id}
                    sx={{
                      border: '1px solid #dce4ee',
                      borderRadius: 2,
                      p: 1.5,
                      backgroundColor: '#fff'
                    }}>
                    <Stack
                      direction={{ xs: 'column', sm: 'row' }}
                      spacing={1}
                      justifyContent="space-between"
                      alignItems={{ xs: 'flex-start', sm: 'center' }}>
                      <Box sx={{ minWidth: 0 }}>
                        <Typography variant="subtitle2" fontWeight={700}>
                          {supplier.supplierName || '-'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {supplier.supplierId || supplier.id} | {supplier.supplierCode || '-'}
                        </Typography>
                      </Box>
                      <Button
                        variant="contained"
                        sx={blueActionButtonSx}
                        disabled={isAlreadySuggested}
                        onClick={() => onSelectSupplier(supplier)}>
                        {isAlreadySuggested ? 'อยู่ในรายการแล้ว' : 'เลือก'}
                      </Button>
                    </Stack>
                  </Box>
                );
              })}
            </Stack>
          ) : (
            <Box
              sx={{
                border: '1px dashed #cbd5e1',
                borderRadius: 2,
                py: 3,
                px: 2,
                textAlign: 'center',
                backgroundColor: '#f8fafc'
              }}>
              <Typography variant="body2" color="text.secondary">
                ไม่พบคู่ค้าที่ใช้งานอยู่
              </Typography>
            </Box>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>ปิด</Button>
      </DialogActions>
    </Dialog>
  );
}
