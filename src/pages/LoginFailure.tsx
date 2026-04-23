import { Box, Button, Paper, Typography } from '@mui/material';
import { useMemo } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import { ROUTE_PATHS } from 'routes';

export default function LoginFailure(): JSX.Element {
  const history = useHistory();
  const location = useLocation();

  const message = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return (
      params.get('message') ||
      params.get('error_description') ||
      params.get('error') ||
      'การเข้าสู่ระบบด้วย LINE ถูกยกเลิกหรือเกิดข้อผิดพลาด'
    );
  }, [location.search]);

  return (
    <Box
      minHeight="100vh"
      width="100%"
      display="flex"
      alignItems="center"
      justifyContent="center"
      bgcolor="#f4f7f1"
      px={2}>
      <Paper
        elevation={0}
        sx={{
          width: '100%',
          maxWidth: 420,
          px: 4,
          py: 6,
          textAlign: 'center',
          borderRadius: 3
        }}>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          เข้าสู่ระบบไม่สำเร็จ
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          {message}
        </Typography>
        <Button
          variant="contained"
          sx={{ mt: 4, backgroundColor: '#4d8a3f !important' }}
          onClick={() => history.replace(ROUTE_PATHS.LOGIN)}>
          กลับไปหน้าเข้าสู่ระบบ
        </Button>
      </Paper>
    </Box>
  );
}
