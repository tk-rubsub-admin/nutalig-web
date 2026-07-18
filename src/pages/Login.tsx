import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import CssBaseline from '@mui/material/CssBaseline';
import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';
import FormControlLabel from '@mui/material/FormControlLabel';
import Typography from '@mui/material/Typography';
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  useMediaQuery,
  useTheme
} from '@mui/material';
import { useEffect, useState } from 'react';
import LoadingDialog from 'components/LoadingDialog';
import { getLineLoginUrl } from 'services/Line/line-api';

export default function SignInSide(): JSX.Element {
  const theme = useTheme();
  const isDownSm = useMediaQuery(theme.breakpoints.down('sm'));
  const [openDialog, setOpenDialog] = useState(false);
  const [isOpenLoading, setIsOpenLoading] = useState(false);
  const [dialogMessage, setDialogMessage] = useState<string>();
  const [isEmailConsentChecked, setIsEmailConsentChecked] = useState(false);

  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    const reason = query.get('reason');

    if (reason !== 'session-replaced') {
      return;
    }

    setDialogMessage('บัญชีนี้ถูกเข้าสู่ระบบจากอุปกรณ์อื่นแล้ว ระบบจึงออกจากระบบเครื่องนี้อัตโนมัติ');
    setOpenDialog(true);
    sessionStorage.removeItem('nutalig:forced-logout');

    query.delete('reason');
    const nextQuery = query.toString();
    const nextUrl = `${window.location.pathname}${nextQuery ? `?${nextQuery}` : ''}`;
    window.history.replaceState({}, document.title, nextUrl);
  }, []);

  const handleLineLogin = async () => {
    if (!isEmailConsentChecked) {
      setDialogMessage('กรุณายืนยันการยินยอมใช้อีเมลก่อนเข้าสู่ระบบด้วย LINE');
      setOpenDialog(true);
      return;
    }

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
          px: { xs: 1.5, sm: 2.5 },
          py: { xs: 2, sm: 3 },
          m: 0,
          background:
            'radial-gradient(circle at top, rgba(140, 162, 129, 0.16), transparent 34%), linear-gradient(180deg, #fcfcf8 0%, #f3f4ee 100%)'
        }}>
        <CssBaseline />
        <Paper
          elevation={0}
          sx={{
            width: '100%',
            maxWidth: 440,
            borderRadius: { xs: '24px', sm: '28px' },
            border: '1px solid rgba(38, 52, 33, 0.08)',
            boxShadow: '0 28px 70px rgba(30, 40, 24, 0.10), 0 10px 28px rgba(30, 40, 24, 0.05)',
            background:
              'linear-gradient(180deg, rgba(255, 255, 255, 0.98) 0%, rgba(250, 251, 246, 0.98) 100%)',
            overflow: 'hidden',
            position: 'relative',
            alignSelf: { xs: 'stretch', sm: 'center' },
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
              px: { xs: 2.25, sm: 5.5 },
              py: { xs: 3, sm: 6.5 },
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
            <Typography
              sx={{
                mb: { xs: 1.75, sm: 2.5 },
                color: '#6a7464',
                fontSize: { xs: '0.68rem', sm: '0.74rem' },
                fontWeight: 700,
                letterSpacing: { xs: '0.18em', sm: '0.22em' },
                textTransform: 'uppercase'
              }}>
              Nutalig Portal
            </Typography>
            <Avatar
              src="/logo_nutalig.jpg"
              alt="Nutalig Logo"
              sx={{
                mb: { xs: 2.25, sm: 3 },
                width: { xs: 92, sm: 132 },
                height: { xs: 92, sm: 132 },
                bgcolor: 'transparent',
                border: '1px solid rgba(38, 52, 33, 0.08)',
                boxShadow: '0 14px 34px rgba(31, 56, 24, 0.08)'
              }}
            />
            <Typography
              variant="h5"
              sx={{
                fontWeight: 700,
                mb: 0.75,
                color: '#1f2a1c',
                letterSpacing: '-0.02em',
                fontSize: { xs: '1.45rem', sm: '1.75rem' }
              }}>
              เข้าสู่ระบบ
            </Typography>
            <Typography
              color="text.secondary"
              sx={{
                mb: { xs: 2.25, sm: 3 },
                textAlign: 'center',
                maxWidth: { xs: '100%', sm: 280 },
                px: { xs: 0.5, sm: 0 },
                lineHeight: 1.7,
                fontSize: { xs: '0.92rem', sm: '1rem' },
                color: '#6b7468'
              }}>
              เข้าสู่ระบบเพื่อใช้งานระบบ ผ่านบัญชี LINE ของคุณ
            </Typography>
            <Box
              sx={{
                width: '100%',
                mb: { xs: 2.25, sm: 3 },
                p: { xs: 1.5, sm: 2.25 },
                borderRadius: { xs: 2.5, sm: 3 },
                border: '1px solid rgba(38, 52, 33, 0.10)',
                background:
                  'linear-gradient(180deg, rgba(248, 251, 245, 0.98) 0%, rgba(255, 255, 255, 0.98) 100%)'
              }}>
              <Typography
                sx={{
                  fontWeight: 700,
                  color: '#1f2a1c',
                  mb: 1,
                  fontSize: { xs: '0.98rem', sm: '1rem' }
                }}>
                การขอใช้อีเมลจากบัญชี LINE
              </Typography>
              <Typography
                variant="body2"
                sx={{ color: '#5f6c5a', lineHeight: 1.7, mb: 0.75, fontSize: { xs: '0.84rem', sm: '0.875rem' } }}>
                ระบบจะขออีเมลจากบัญชี LINE ของคุณเพื่อใช้สำหรับระบุตัวตนผู้ใช้งาน และผูกบัญชีสำหรับเข้าสู่ระบบ Nutalig Portal
              </Typography>
              <Typography
                variant="body2"
                sx={{ color: '#5f6c5a', lineHeight: 1.7, mb: 0.75, fontSize: { xs: '0.84rem', sm: '0.875rem' } }}>
                อีเมลจะถูกใช้เพื่อ:
              </Typography>
              <Typography
                variant="body2"
                sx={{ color: '#5f6c5a', lineHeight: 1.7, fontSize: { xs: '0.84rem', sm: '0.875rem' } }}>
                1. ตรวจสอบและยืนยันตัวตนผู้ใช้งาน
              </Typography>
              <Typography
                variant="body2"
                sx={{ color: '#5f6c5a', lineHeight: 1.7, fontSize: { xs: '0.84rem', sm: '0.875rem' } }}>
                2. เชื่อมบัญชี LINE กับบัญชีผู้ใช้งานในระบบ
              </Typography>
            </Box>
            <FormControlLabel
              sx={{
                alignSelf: 'stretch',
                alignItems: 'flex-start',
                mb: { xs: 2.5, sm: 3 },
                mx: 0,
                gap: 0.5,
                '& .MuiFormControlLabel-label': {
                  fontSize: { xs: '0.84rem', sm: '0.92rem' },
                  color: '#42503e',
                  lineHeight: 1.6
                }
              }}
              control={
                <Checkbox
                  checked={isEmailConsentChecked}
                  onChange={(event) => setIsEmailConsentChecked(event.target.checked)}
                  sx={{
                    mt: isDownSm ? -0.25 : 0,
                    color: '#8aa281',
                    '&.Mui-checked': {
                      color: '#4d6b41'
                    }
                  }}
                />
              }
              label="ฉันยินยอมให้ระบบเข้าถึงอีเมลจากบัญชี LINE ของฉันตามวัตถุประสงค์ข้างต้น"
            />
            <Button
              onClick={handleLineLogin}
              variant="contained"
              disabled={!isEmailConsentChecked}
              sx={{
                backgroundColor: '#06c755 !important',
                borderRadius: '999px',
                px: { xs: 2.5, sm: 5 },
                py: { xs: 1.45, sm: 1.55 },
                minWidth: { xs: '100%', sm: 240 },
                width: { xs: '100%', sm: 'auto' },
                fontWeight: 700,
                fontSize: { xs: '0.94rem', sm: '0.98rem' },
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
