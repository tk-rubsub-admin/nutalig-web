import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import CssBaseline from '@mui/material/CssBaseline';
import FormControlLabel from '@mui/material/FormControlLabel';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import { CircularProgress } from '@mui/material';
import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import {
  LineRegisterValidationData,
  LineRegisterValidationResponse
} from 'services/User/user-type';
import { getLineRegisterUrl, validateLineRegisterToken } from 'services/Line/line-api';

type ValidationState = 'loading' | 'ready' | 'invalid';

function getValidationData(response?: LineRegisterValidationResponse): LineRegisterValidationData {
  return response?.data || {};
}

function getValidationMessage(response?: LineRegisterValidationResponse): string {
  const data = getValidationData(response);

  if (typeof data.message === 'string' && data.message) {
    return data.message;
  }

  if (typeof response?.message === 'string' && response.message) {
    return response.message;
  }

  switch (data.status) {
    case 'USED':
    case 'REGISTERED':
      return 'ลิงก์ลงทะเบียนนี้ถูกใช้งานแล้ว';
    case 'EXPIRED':
      return 'ลิงก์ลงทะเบียนหมดอายุแล้ว';
    case 'INVALID':
      return 'ลิงก์ลงทะเบียนไม่ถูกต้อง';
    default:
      return 'ไม่สามารถใช้งานลิงก์ลงทะเบียนนี้ได้';
  }
}

function isValidationReady(response?: LineRegisterValidationResponse): boolean {
  const data = getValidationData(response);

  if (data.valid === false) {
    return false;
  }

  if (typeof data.status === 'string') {
    return !['USED', 'REGISTERED', 'EXPIRED', 'INVALID'].includes(data.status);
  }

  return true;
}

export default function LineRegister(): JSX.Element {
  const location = useLocation();
  const query = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const token = query.get('token') || query.get('inviteToken') || query.get('registrationToken') || '';

  const [validationState, setValidationState] = useState<ValidationState>('loading');
  const [validation, setValidation] = useState<LineRegisterValidationResponse>();
  const [message, setMessage] = useState('');
  const [isEmailConsentChecked, setIsEmailConsentChecked] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    let isMounted = true;

    if (!token) {
      setValidationState('invalid');
      setMessage('ไม่พบ token สำหรับลงทะเบียน');
      return;
    }

    (async () => {
      try {
        const response = await validateLineRegisterToken(token);

        if (!isMounted) {
          return;
        }

        setValidation(response);

        if (isValidationReady(response)) {
          setValidationState('ready');
          setMessage('');
          return;
        }

        setValidationState('invalid');
        setMessage(getValidationMessage(response));
      } catch (error: any) {
        if (!isMounted) {
          return;
        }

        setValidationState('invalid');
        setMessage(
          error?.response?.data?.message || error?.message || 'ไม่สามารถตรวจสอบลิงก์ลงทะเบียนได้'
        );
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [token]);

  const validationData = getValidationData(validation);
  const displayName = validationData.displayName || validationData.username || 'ผู้ใช้งาน';

  const handleRegisterWithLine = async () => {
    if (!isEmailConsentChecked || !token) {
      return;
    }

    setIsRedirecting(true);

    try {
      const authorizeUrl = await getLineRegisterUrl(token);
      window.location.href = authorizeUrl;
    } catch (error: any) {
      setMessage(
        error?.response?.data?.message || error?.message || 'ไม่สามารถเริ่มต้นการลงทะเบียนผ่าน LINE ได้'
      );
      setValidationState('invalid');
      setIsRedirecting(false);
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
            maxWidth: 480,
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
                width: 120,
                height: 120,
                bgcolor: 'transparent',
                border: '1px solid rgba(38, 52, 33, 0.08)',
                boxShadow: '0 14px 34px rgba(31, 56, 24, 0.08)'
              }}
            />
            {validationState === 'loading' ? (
              <>
                <CircularProgress sx={{ color: '#4d8a3f' }} />
                <Typography variant="h6" sx={{ mt: 3, fontWeight: 700, color: '#1f2a1c' }}>
                  กำลังตรวจสอบลิงก์ลงทะเบียน
                </Typography>
                <Typography sx={{ mt: 1.5, color: '#6b7468', textAlign: 'center' }}>
                  กรุณารอสักครู่ ระบบกำลังตรวจสอบสิทธิ์การลงทะเบียนของคุณ
                </Typography>
              </>
            ) : validationState === 'invalid' ? (
              <>
                <Typography
                  variant="h5"
                  sx={{ fontWeight: 700, mb: 1, color: '#8b1e3f', letterSpacing: '-0.02em' }}>
                  ไม่สามารถลงทะเบียนได้
                </Typography>
                <Typography sx={{ textAlign: 'center', color: '#6b7468', lineHeight: 1.8 }}>
                  {message}
                </Typography>
              </>
            ) : (
              <>
                <Typography
                  variant="h5"
                  sx={{
                    fontWeight: 700,
                    mb: 1,
                    color: '#1f2a1c',
                    letterSpacing: '-0.02em',
                    textAlign: 'center'
                  }}>
                  ลงทะเบียนเข้าใช้งานผ่าน LINE
                </Typography>
                <Typography
                  color="text.secondary"
                  sx={{
                    mb: 3,
                    textAlign: 'center',
                    maxWidth: 320,
                    lineHeight: 1.7,
                    color: '#6b7468'
                  }}>
                  บัญชีนี้ถูกเตรียมไว้สำหรับ {displayName} กรุณายืนยันตัวตนผ่าน LINE เพื่อผูกบัญชีและเริ่มใช้งานระบบ
                </Typography>
                <Box
                  sx={{
                    width: '100%',
                    mb: 3,
                    p: 2.25,
                    borderRadius: 3,
                    border: '1px solid rgba(38, 52, 33, 0.10)',
                    background:
                      'linear-gradient(180deg, rgba(248, 251, 245, 0.98) 0%, rgba(255, 255, 255, 0.98) 100%)'
                  }}>
                  <Typography sx={{ fontWeight: 700, color: '#1f2a1c', mb: 1 }}>
                    การขอใช้อีเมลจากบัญชี LINE
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#5f6c5a', lineHeight: 1.75, mb: 0.75 }}>
                    ระบบจะเก็บอีเมล, LINE user ID, display name และรูปโปรไฟล์ของคุณ เพื่อใช้สำหรับลงทะเบียนและผูกบัญชีเข้าใช้งาน Nutalig Portal
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#5f6c5a', lineHeight: 1.75 }}>
                    1. ใช้ยืนยันตัวตนผู้ใช้งานตามสิทธิ์ที่ผู้ดูแลระบบกำหนดไว้
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#5f6c5a', lineHeight: 1.75 }}>
                    2. ใช้เชื่อมบัญชี LINE กับบัญชีผู้ใช้งานในระบบ
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#5f6c5a', lineHeight: 1.75 }}>
                    3. ใช้สำหรับการเข้าสู่ระบบและการติดต่อในภายหลัง
                  </Typography>
                </Box>
                <FormControlLabel
                  sx={{
                    alignSelf: 'stretch',
                    mb: 3,
                    mx: 0,
                    '& .MuiFormControlLabel-label': {
                      fontSize: '0.92rem',
                      color: '#42503e',
                      lineHeight: 1.6
                    }
                  }}
                  control={
                    <Checkbox
                      checked={isEmailConsentChecked}
                      onChange={(event) => setIsEmailConsentChecked(event.target.checked)}
                      sx={{
                        color: '#8aa281',
                        '&.Mui-checked': {
                          color: '#4d6b41'
                        }
                      }}
                    />
                  }
                  label="ฉันยินยอมให้ระบบเข้าถึงข้อมูลจากบัญชี LINE ของฉันตามวัตถุประสงค์ข้างต้น"
                />
                <Button
                  onClick={handleRegisterWithLine}
                  variant="contained"
                  disabled={!isEmailConsentChecked || isRedirecting}
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
                  {isRedirecting ? 'กำลังไปยัง LINE...' : 'ลงทะเบียนด้วย LINE'}
                </Button>
              </>
            )}
          </Box>
        </Paper>
      </Box>
    </>
  );
}
