import { useEffect, useMemo, useState } from 'react';
import { Box, Button, CircularProgress, Paper, Typography } from '@mui/material';
import { useHistory, useLocation } from 'react-router-dom';
import { useAuth } from 'auth/AuthContext';
import { ROUTE_PATHS } from 'routes';

function buildFailureSearchParams(message: string): string {
  const params = new URLSearchParams();
  params.set('message', message);
  return params.toString();
}

export default function LoginSuccess(): JSX.Element {
  const history = useHistory();
  const location = useLocation();
  const { authReady, getToken, lineLogin } = useAuth();
  const [errorMessage, setErrorMessage] = useState('');

  const query = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const redirect = query.get('redirect') || ROUTE_PATHS.ROOT;
  const accessToken =
    query.get('accessToken') || query.get('access_token') || query.get('token') || '';
  const idToken = query.get('idToken') || query.get('id_token') || query.get('userId') || '';

  useEffect(() => {
    if (!authReady) return;
    console.log('redirect : ' + redirect);
    if (getToken()) {
      history.replace(redirect);
      return;
    }

    if (!accessToken || !idToken) {
      setErrorMessage('ไม่พบ access token หรือ id token สำหรับเข้าสู่ระบบด้วย LINE');
      return;
    }

    let isMounted = true;

    (async () => {
      try {
        await lineLogin({
          accessToken,
          idToken
        });
        history.replace(redirect);
      } catch (error: any) {
        const backendMessage =
          error?.response?.data?.message || error?.message || 'เข้าสู่ระบบด้วย LINE ไม่สำเร็จ';

        if (!isMounted) return;

        history.replace({
          pathname: ROUTE_PATHS.LOGIN_FAILURE,
          search: buildFailureSearchParams(backendMessage)
        });
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [accessToken, authReady, getToken, history, idToken, lineLogin, redirect]);

  if (!authReady || (!errorMessage && (getToken() || accessToken || idToken))) {
    return (
      <Box
        minHeight="100vh"
        width="100%"
        display="flex"
        alignItems="center"
        justifyContent="center"
        bgcolor="#f4f7f1">
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
          <CircularProgress sx={{ color: '#4d8a3f' }} />
          <Typography variant="h6" sx={{ mt: 3, fontWeight: 700 }}>
            กำลังเข้าสู่ระบบด้วย LINE
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            กรุณารอสักครู่ ระบบกำลังตรวจสอบข้อมูลของคุณ
          </Typography>
        </Paper>
      </Box>
    );
  }

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
          เข้าสู่ระบบด้วย LINE ไม่สำเร็จ
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          {errorMessage}
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
