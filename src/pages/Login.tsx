import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import CssBaseline from '@mui/material/CssBaseline';
import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle
} from '@mui/material';
import { useState } from 'react';
import LoadingDialog from 'components/LoadingDialog';
import { getLineLoginUrl } from 'services/Line/line-api';

export default function SignInSide(): JSX.Element {
  const [openDialog, setOpenDialog] = useState(false);
  const [isOpenLoading, setIsOpenLoading] = useState(false);
  const [dialogMessage, setDialogMessage] = useState<string>();

  const handleLineLogin = async () => {
    setIsOpenLoading(true);

    try {
      const loginUrl = await getLineLoginUrl();
      window.location.href = loginUrl;
    } catch (error) {
      console.error('line login init failed', error);
      setDialogMessage('ไม่สามารถเริ่มต้นการเข้าสู่ระบบด้วย LINE ได้');
      setOpenDialog(true);
      setIsOpenLoading(false);
    }
  };

  return (
    <>
      <Box
        component="main"
        sx={{
          minHeight: '100vh',
          width: '100vw',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          px: 2.5,
          m: 0,
          background:
            'radial-gradient(circle at top, rgba(140, 162, 129, 0.14), transparent 30%), linear-gradient(180deg, #fcfcf8 0%, #f3f4ee 100%)'
        }}>
        <CssBaseline />
        <Paper
          elevation={0}
          sx={{
            width: '100%',
            maxWidth: 440,
            borderRadius: '28px',
            border: '1px solid rgba(38, 52, 33, 0.08)',
            boxShadow: '0 28px 70px rgba(30, 40, 24, 0.10), 0 10px 28px rgba(30, 40, 24, 0.05)',
            background:
              'linear-gradient(180deg, rgba(255, 255, 255, 0.98) 0%, rgba(250, 251, 246, 0.98) 100%)',
            overflow: 'hidden',
            position: 'relative',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '6px',
              background: 'linear-gradient(90deg, #27411f 0%, #8aa281 100%)'
            }
          }}>
          <Box
            sx={{
              px: { xs: 3.5, sm: 5.5 },
              py: { xs: 6, sm: 6.5 },
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
            <Typography
              sx={{
                mb: 2.5,
                color: '#6a7464',
                fontSize: '0.74rem',
                fontWeight: 700,
                letterSpacing: '0.22em',
                textTransform: 'uppercase'
              }}>
              Nutalig Portal
            </Typography>
            <Avatar
              src="/logo_nutalig.jpg"
              alt="Nutalig Logo"
              sx={{
                mb: 3,
                width: 132,
                height: 132,
                bgcolor: 'transparent',
                border: '1px solid rgba(38, 52, 33, 0.08)',
                boxShadow: '0 14px 34px rgba(31, 56, 24, 0.08)'
              }}
            />
            <Typography
              variant="h5"
              sx={{
                fontWeight: 700,
                mb: 1,
                color: '#1f2a1c',
                letterSpacing: '-0.02em'
              }}>
              เข้าสู่ระบบ
            </Typography>
            <Typography
              color="text.secondary"
              sx={{
                mb: 4.5,
                textAlign: 'center',
                maxWidth: 280,
                lineHeight: 1.7,
                color: '#6b7468'
              }}>
              เข้าสู่ระบบเพื่อใช้งานระบบ ผ่านบัญชี LINE ของคุณ
            </Typography>
            <Button
              onClick={handleLineLogin}
              variant="contained"
              sx={{
                backgroundColor: '#06c755 !important',
                borderRadius: '999px',
                px: 5,
                py: 1.55,
                minWidth: 240,
                fontWeight: 700,
                fontSize: '0.98rem',
                letterSpacing: '0.01em',
                boxShadow: '0 12px 28px rgba(6, 199, 85, 0.22)',
                '&:hover': {
                  boxShadow: '0 16px 32px rgba(6, 199, 85, 0.28)'
                }
              }}>
              Login with LINE
            </Button>
          </Box>
        </Paper>
      </Box>
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogTitle>เกิดข้อผิดพลาด</DialogTitle>
        <DialogContent>
          <DialogContentText>{dialogMessage}</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button variant="contained" onClick={() => setOpenDialog(false)} autoFocus>
            Ok
          </Button>
        </DialogActions>
      </Dialog>
      <LoadingDialog open={isOpenLoading} />
    </>
  );
}
