/* eslint-disable prettier/prettier */
import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';
import { getAuth, signInWithEmailAndPassword, updatePassword } from 'firebase/auth';
import {
    Container,
    TextField,
    Button,
    Typography,
    Grid,
    Paper,
    InputAdornment,
    IconButton
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { GridTextField } from 'components/Styled';

const ChangePassword = () => {
    const history = useHistory();
    const auth = getAuth();
    const [form, setForm] = useState({
        email: '',
        oldPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const togglePasswordVisibility = () => {
        setShowPassword((prev) => !prev);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Basic validation
        if (form.newPassword !== form.confirmPassword) {
            setError('รหัสผ่านใหม่ไม่ตรงกัน กรุณาระบุรหัสผ่านใหม่ให้ถูกต้อง');
            return;
        }

        if (!form.email || !form.oldPassword || !form.newPassword) {
            setError('กรุณากรอกข้อมูลให้ครบ');
            return;
        }
        try {
            // Re-authenticate
            const userCredential = await signInWithEmailAndPassword(auth, form.email, form.oldPassword);
            const user = userCredential.user;

            if (!user) {
                setError('ไม่พบผู้ใช้งาน');
                return;
            }

            const providerId = user.providerData[0]?.providerId;
            if (providerId === 'google.com') {
                setError('บัญชีนี้สมัครผ่าน Google ไม่สามารถเปลี่ยนรหัสผ่านได้ที่นี่');
                return;
            }

            // Update password
            await updatePassword(user, form.newPassword);

            setError('');
            history.push('/login');
        } catch (err: any) {
            console.error(err);
            if (err.code === 'auth/wrong-password') {
                setError('รหัสผ่านเก่าไม่ถูกต้อง');
            } else if (err.code === 'auth/user-not-found') {
                setError('ไม่พบอีเมลนี้ในระบบ');
            } else if (err.code === 'auth/invalid-login-credentials') {
                setError('รหัสผ่านไม่ถูกต้อง กรุณาลองอีกครั้ง')
            } else {
                setError(err.message);
            }
        }
    };

    return (

        <Container maxWidth="sm">
            <Paper elevation={3} sx={{ p: 4, mt: 6 }}>
                <Typography variant="h5" gutterBottom>
                    เปลี่ยนรหัสผ่าน
                </Typography>

                <form onSubmit={handleSubmit}>
                    <Grid container spacing={2}>
                        <GridTextField item xs={12}>
                            <TextField
                                fullWidth
                                label="อีเมล"
                                name="email"
                                type="email"
                                value={form.email}
                                onChange={handleChange}
                                required
                            />
                        </GridTextField>

                        <GridTextField item xs={12}>
                            <TextField
                                fullWidth
                                label="รหัสผ่านเก่า"
                                name="oldPassword"
                                type={showPassword ? 'text' : 'password'}
                                value={form.oldPassword}
                                onChange={handleChange}
                                required
                                InputProps={{
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <IconButton onClick={togglePasswordVisibility} edge="end">
                                                {showPassword ? <VisibilityOff /> : <Visibility />}
                                            </IconButton>
                                        </InputAdornment>
                                    )
                                }}
                            />
                        </GridTextField>

                        <GridTextField item xs={12}>
                            <TextField
                                fullWidth
                                label="รหัสผ่านใหม่"
                                name="newPassword"
                                type={showPassword ? 'text' : 'password'}
                                value={form.newPassword}
                                onChange={handleChange}
                                required
                            />
                        </GridTextField>

                        <GridTextField item xs={12}>
                            <TextField
                                fullWidth
                                label="ยืนยันรหัสผ่านใหม่"
                                name="confirmPassword"
                                type={showPassword ? 'text' : 'password'}
                                value={form.confirmPassword}
                                onChange={handleChange}
                                required
                            />
                        </GridTextField>

                        {error && (
                            <Grid item xs={12} style={{ textAlign: 'center' }}>
                                <Typography color="error" sx={{ mb: 2 }}>
                                    {error}
                                </Typography>
                            </Grid>
                        )}

                        <Grid item xs={6}>
                            <Button fullWidth variant="contained" color="error" onClick={() => history.goBack()}>
                                ย้อนกลับ
                            </Button>
                        </Grid>
                        <Grid item xs={6}>
                            <Button fullWidth variant="contained" type="submit">
                                เปลี่ยนรหัสผ่าน
                            </Button>
                        </Grid>
                    </Grid>
                </form>
            </Paper>
        </Container>
    );
};

export default ChangePassword;
