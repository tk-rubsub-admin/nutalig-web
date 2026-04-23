import { useEffect } from 'react';
import { useLocation, useHistory } from 'react-router-dom';
import { useAuth } from 'auth/AuthContext';
import { Box, CircularProgress } from '@material-ui/core';

export default function MagicLinkPage() {
  const { logInWithOneTimeToken, authReady, getToken } = useAuth();
  const location = useLocation();
  const history = useHistory();

  useEffect(() => {
    if (!authReady) return; // รอ Firebase restore session ให้เสร็จก่อน

    const params = new URLSearchParams(location.search);

    // 🔁 ชื่อ param ตามที่ BE ใช้จริง: oneTimeToken
    const oneTimeToken = params.get('oneTimeToken');
    const redirect = params.get('redirect') || '/';

    if (!oneTimeToken) {
      // ไม่มี token → กลับหน้า login หรือ not-found ตาม design
      console.log('!oneTimeToken');
      history.replace('/login');
      return;
    }

    // ถ้ามี token เดิมอยู่แล้ว → ข้ามขั้นตอน magic login
    if (getToken()) {
      params.delete('oneTimeToken');
      history.replace({
        pathname: redirect,
        search: params.toString()
      });
      return;
    }

    (async () => {
      try {
        await logInWithOneTimeToken(oneTimeToken);

        // ล้าง oneTimeToken ออกจาก URL
        params.delete('oneTimeToken');
        history.replace({
          pathname: redirect,
          search: params.toString()
        });
      } catch (err) {
        console.error('magic login failed', err);
        history.replace('/login');
      }
    })();
  }, [location.search, authReady, logInWithOneTimeToken, getToken, history]);

  return (
    <Box height="100vh" width="100vw" display="flex" justifyContent="center" alignItems="center">
      <CircularProgress />
    </Box>
  );
}
