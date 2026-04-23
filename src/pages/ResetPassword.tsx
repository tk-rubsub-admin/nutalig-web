/* eslint-disable prettier/prettier */
import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';
import { getAuth, sendPasswordResetEmail } from 'firebase/auth';
import {
    Container,
    TextField,
    Button,
    Typography,
    Grid,
    Paper,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle
} from '@mui/material';
import { GridTextField } from 'components/Styled';
import LoadingDialog from 'components/LoadingDialog';

const ResetPassword = () => {
    const history = useHistory();
    const auth = getAuth();
    const [openDialog, setOpenDialog] = useState(false);
    const [isOpenLoading, setIsOpenLoading] = useState(false);
    const [form, setForm] = useState({
        email: ''
    });

    const [error, setError] = useState('');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsOpenLoading(true);

        if (!form.email) {
            setError('กรุณากรอกอีเมล');
            return;
        }

        try {
            // Send Password Reset Email
            await sendPasswordResetEmail(auth, form.email);
            setOpenDialog(true);
            setError('');
        } catch (err: any) {
            setError(err.message);
        }
        setIsOpenLoading(false);
    };

    return (

        <Container maxWidth="sm">
            <Paper elevation={3} sx={{ p: 4, mt: 6 }}>
                <Typography variant="h5" gutterBottom>
                    รีเซ็ตรหัสผ่าน
                </Typography>
                <br />
                <form onSubmit={handleSubmit}>
                    <Grid container spacing={2}>
                        <GridTextField item xs={12}>
                            <TextField
                                fullWidth
                                label="อีเมล"
                                placeholder="กรุณาระบุอีเมล เพื่อทำส่งลิ้งค์รีเซ็ตรหัสผ่าน"
                                name="email"
                                type="email"
                                InputLabelProps={{ shrink: true }}
                                value={form.email}
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
                                ส่งอีเมลการรีเซ็ตรหัสผ่าน
                            </Button>
                        </Grid>
                    </Grid>
                </form>
            </Paper>
            <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
                <DialogTitle id="alert-dialog-title">ส่งอีเมลเรียบร้อย</DialogTitle>
                <DialogContent>
                    <DialogContentText id="alert-dialog-description">กรุณาตรวจสอบกล่องข้อความของคุณ หากไม่พบอีเมล กรุณาตรวจสอบในโฟลเดอร์สแปมหรือจดหมายขยะ</DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button variant="contained" onClick={() => {
                        setOpenDialog(false);
                        history.push('/login');
                    }} autoFocus>
                        Ok
                    </Button>
                </DialogActions>
            </Dialog>
            <LoadingDialog open={isOpenLoading} />
        </Container>
    );
};

export default ResetPassword;
