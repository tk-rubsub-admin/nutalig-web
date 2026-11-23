import { Alert, Box, Button, CircularProgress, TableCell, TableRow, Typography } from '@mui/material';

export function ListLoadingState({ colSpan = 1 }: { colSpan?: number }) {
  return (
    <TableRow>
      <TableCell colSpan={colSpan} align="center">
        <CircularProgress size={28} aria-label="กำลังโหลดข้อมูล" />
      </TableCell>
    </TableRow>
  );
}

export function ListEmptyState({
  colSpan = 1,
  message = 'ไม่พบข้อมูล'
}: {
  colSpan?: number;
  message?: string;
}) {
  return (
    <TableRow>
      <TableCell colSpan={colSpan} align="center" sx={{ py: 5 }}>
        <Typography color="text.secondary">{message}</Typography>
      </TableCell>
    </TableRow>
  );
}

export function ListErrorState({
  message = 'ไม่สามารถโหลดข้อมูลได้',
  onRetry
}: {
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <Alert
      severity="error"
      action={onRetry ? <Button onClick={onRetry}>ลองอีกครั้ง</Button> : undefined}>
      {message}
    </Alert>
  );
}

export function ListPageLoading() {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
      <CircularProgress />
    </Box>
  );
}
