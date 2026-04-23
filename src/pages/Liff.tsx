/* eslint-disable prettier/prettier */
import React, { useEffect, useState } from 'react';
import liff from '@line/liff';
import toast from 'react-hot-toast';
import { UpdateLineConnectRequest } from 'services/User/user-type';
import { useTranslation } from 'react-i18next';
import { updateLineConnect } from 'services/User/user-api';
import LoadingDialog from 'components/LoadingDialog';
import { Container, Paper, Typography } from '@mui/material';

const LiffApp = () => {
    const { t } = useTranslation();
    const [userId, setUserId] = useState(null);
    const [lineUserId, setLineUserId] = useState(null);
    const [isOpenLoading, setIsOpenLoading] = useState(false);

    useEffect(() => {
        setIsOpenLoading(true);
        // Initialize LIFF SDK
        liff
            .init({ liffId: '2008988361-sH0cqOKp' })
            .then(() => {
                // Get user data from the URL parameters
                const urlParams = new URLSearchParams(window.location.search);
                const userId = urlParams.get('userId');

                setUserId(userId);
                // if (!liff.isLoggedIn()) {
                //     liff.login();  // Prompt user to log in
                // } else {
                liff.getProfile()
                    .then(profile => {
                        const lineUserId = profile.userId;
                        setLineUserId(lineUserId);
                        console.log('Line User ID:', lineUserId);
                        console.log('User ID:', userId);


                        updateUserLineConnect(lineUserId, userId);
                    })
                    .catch(err => {
                        setIsOpenLoading(false);
                        console.error('Failed to get profile', err);
                    });
                // }
            })
            .catch((err) => {
                setIsOpenLoading(false);
                console.error('LIFF initialization failed', err);
            });
    }, []);

    const updateUserLineConnect = (lineUserId: string, userId: string) => {
        toast.promise(updateLineConnect({ userId, lineUserId } as UpdateLineConnectRequest), {
            loading: t('toast.loading'),
            success: () => {
                return t('toast.success');
            },
            error: (error) => t('toast.failed') + ' ' + error.message
        }).finally(() => {
            setIsOpenLoading(false);
        })
    }

    return (
        <Container maxWidth="sm">
            <Paper elevation={3} sx={{ p: 4, mt: 6 }}>
                {!isOpenLoading && (
                    <div style={{ textAlign: 'center', paddingTop: '20px' }}>
                        <Typography variant="h6">
                            เชื่อมต่อ LINE เรียบร้อย กรุณาปิดหน้าต่างนี้
                        </Typography>
                    </div>
                )}
                <LoadingDialog open={isOpenLoading} />
            </Paper>
        </Container>
    );
};

export default LiffApp;
