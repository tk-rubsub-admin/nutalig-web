/* eslint-disable prettier/prettier */
import { useEffect, useState } from 'react';
import {
    Box,
    Card,
    CardActionArea,
    CardContent,
    Chip,
    CircularProgress,
    Dialog,
    DialogContent,
    DialogTitle,
    Stack,
    Typography,
    useMediaQuery,
    useTheme,
} from '@mui/material';
import PlayCircleOutline from '@mui/icons-material/PlayCircleOutline';
import VideocamOff from '@mui/icons-material/VideocamOff';
import PageTitle from 'components/PageTitle';
import { Wrapper } from 'components/Styled';
import { useTranslation } from 'react-i18next';
import { ManualDto } from 'services/Manual/manual-type';
import { getManualByUser } from 'services/Manual/manual-api';


export default function Manual() {
    const { t } = useTranslation();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    const [manuals, setManuals] = useState<ManualDto[]>([]);
    const [loading, setLoading] = useState<boolean>(true);

    const [manualDetail, setManualDetail] = useState<string>('');
    const [openDetail, setOpenDetail] = useState(false);
    const [selectedManual, setSelectedManual] = useState<ManualDto | null>(null);

    useEffect(() => {
        fetchManuals();
    }, []);

    const fetchManuals = async () => {
        try {
            const response = await getManualByUser();
            setManuals(response);
        } catch (error) {
            console.error('Failed to fetch manuals', error);
        } finally {
            setLoading(false);
        }
    };

    const openManualDialog = async (manual: ManualDto) => {
        setSelectedManual(manual);

        try {
            const res = await fetch(`/manuals/${manual.id}.txt`);
            const text = await res.text();
            setManualDetail(text);
        } catch (e) {
            setManualDetail(t('manual.noManualDetail'));
        }

        setOpenDetail(true);
    };

    return (
        <Box
            sx={{
                width: '100%',
                height: '100vh',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
            }}
        >
            <PageTitle title={t('manual.title')} />

            <Box
                sx={{
                    flex: 1,
                    width: '100%',          // ✅ กว้าง 100%
                    overflowY: 'auto',      // ✅ scroll เฉพาะส่วนนี้
                    WebkitOverflowScrolling: 'touch',
                }}
            >
                <Wrapper
                    sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        flex: 1,
                        overflow: 'hidden',
                    }}
                >
                    {loading ? (
                        <Stack alignItems="center" mt={4}>
                            <CircularProgress />
                        </Stack>
                    ) : manuals.length === 0 ? (
                        <Card
                            elevation={0}
                            sx={{
                                borderRadius: 2,
                                border: '1px dashed #ccc',
                                p: 3,
                                textAlign: 'center',
                            }}
                        >
                            <Typography color="text.secondary">
                                {t('manual.notFound')}
                            </Typography>
                        </Card>
                    ) : (
                        <Box
                            sx={{
                                flex: 1,
                                overflowY: 'auto',
                                WebkitOverflowScrolling: 'touch',
                                pr: 0.5,
                            }}
                        >
                            <Stack spacing={isMobile ? 1.5 : 2}>
                                {manuals.map((manual) => {
                                    const hasVideo = Boolean(manual.videoLink);

                                    return (
                                        <Card
                                            key={manual.id}
                                            elevation={0}
                                            sx={{
                                                borderRadius: 2,
                                                border: '1px solid #eee',
                                                // opacity: hasVideo ? 1 : 0.5,
                                            }}
                                        >
                                            <CardActionArea
                                                onClick={() => openManualDialog(manual)}
                                                sx={{
                                                    minHeight: 72,
                                                }}
                                            >
                                                <CardContent>
                                                    <Stack spacing={1}>
                                                        {/* Title row */}
                                                        <Stack
                                                            direction="row"
                                                            alignItems="center"
                                                            spacing={1.5}
                                                        >
                                                            {hasVideo ? (
                                                                <PlayCircleOutline
                                                                    color="primary"
                                                                    sx={{ fontSize: 36 }}
                                                                />
                                                            ) : (
                                                                <VideocamOff
                                                                    color="disabled"
                                                                    sx={{ fontSize: 36 }}
                                                                />
                                                            )}

                                                            <Typography
                                                                variant="subtitle1"
                                                                fontWeight={600}
                                                                sx={{ lineHeight: 1.3 }}
                                                            >
                                                                {manual.name}
                                                            </Typography>
                                                        </Stack>

                                                        {/* Status */}
                                                        {!hasVideo && (
                                                            <Chip
                                                                size="small"
                                                                label={t('manual.noVideo')}
                                                                sx={{ alignSelf: 'flex-start' }}
                                                            />
                                                        )}

                                                        {/* Hint */}
                                                        {hasVideo && (
                                                            <Typography
                                                                variant="caption"
                                                                color="text.secondary"
                                                            >
                                                                {t('manual.touchToViewVideo')}
                                                            </Typography>
                                                        )}
                                                    </Stack>
                                                </CardContent>
                                            </CardActionArea>
                                        </Card>
                                    );
                                })}
                            </Stack>
                        </Box>
                    )}

                    {isMobile && manuals.length > 0 && (
                        <Typography
                            variant="caption"
                            color="text.secondary"
                            align="center"
                            sx={{ py: 1 }}
                        >
                            {t('manual.touchToViewVideo')}
                        </Typography>
                    )}
                </Wrapper>
            </Box>
            <Dialog
                open={openDetail}
                onClose={() => setOpenDetail(false)}
                fullWidth
                maxWidth="md"
            >
                <DialogTitle>
                    {selectedManual?.name}
                </DialogTitle>

                <DialogContent dividers sx={{ p: 0 }}>
                    {/* ===== VIDEO SECTION ===== */}
                    {selectedManual?.videoLink && (
                        <Box
                            sx={{
                                position: 'relative',
                                paddingTop: '56.25%', // 16:9
                                backgroundColor: '#000',
                            }}
                        >
                            <Box
                                component="video"
                                controls
                                src={selectedManual.videoLink}
                                sx={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    width: '100%',
                                    height: '100%',
                                }}
                            />
                        </Box>
                    )}

                    {/* ===== TEXT SECTION ===== */}
                    <Box sx={{ p: 2 }}>
                        <Typography
                            component="pre"
                            sx={{
                                whiteSpace: 'pre-wrap',
                                fontFamily: 'inherit',
                                fontSize: 14,
                                lineHeight: 1.8,
                            }}
                        >
                            {manualDetail}
                        </Typography>
                    </Box>
                </DialogContent>
            </Dialog>
        </Box>
    );
}