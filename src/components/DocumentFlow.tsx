/* eslint-disable prettier/prettier */
import { ArrowForwardIos, OpenInNew } from '@mui/icons-material';
import { Box, Button, Chip, Stack, Typography } from '@mui/material';
import type { DocumentFlowItem } from 'utils/documentFlow';
import { getDocumentStatusChipSx, getDocumentStatusLabel } from 'utils/documentStatus';

export type { DocumentFlowItem, DocumentFlowRelatedItem } from 'utils/documentFlow';

export default function DocumentFlow({ items }: { items: DocumentFlowItem[] }) {
    return (
        <Box
            sx={{
                mb: 2,
                backgroundColor: '#fff',
                border: '1px solid #e6ebf1',
                borderRadius: 3,
                px: { xs: 1.5, md: 2 },
                py: { xs: 1.5, md: 2 },
                boxShadow: '0 12px 30px rgba(15, 23, 42, 0.05)'
            }}>
            <Stack
                direction={{ xs: 'column', md: 'row' }}
                spacing={{ xs: 1, md: 1.5 }}
                alignItems="stretch"
                useFlexGap>
                {items.map((item, index) => (
                    <Stack
                        key={item.title}
                        direction={{ xs: 'column', md: 'row' }}
                        spacing={{ xs: 1, md: 1.5 }}
                        alignItems="stretch"
                        sx={{
                            flex: { xs: 1, md: item.relatedItems?.length ? '0 0 auto' : 1 },
                            alignSelf: 'stretch'
                        }}>
                        <DocumentFlowCard item={item} />
                        {index < items.length - 1 ? (
                            <Box
                                sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: '#94a3b8',
                                    minWidth: { md: 28 }
                                }}>
                                <ArrowForwardIos
                                    fontSize="small"
                                    sx={{
                                        transform: { xs: 'rotate(90deg)', md: 'none' }
                                    }}
                                />
                            </Box>
                        ) : null}
                    </Stack>
                ))}
            </Stack>
        </Box>
    );
}

function DocumentFlowCard({ item }: { item: DocumentFlowItem }) {
    const hasDocument = Boolean(item.docNo);
    const statusColor = getDocumentStatusChipSx(item.status, item.statusProfile);
    const statusLabel = getDocumentStatusLabel(item.status, item.statusProfile);

    return (
        <Box
            sx={{
                flex: { xs: 1, md: item.relatedItems?.length ? '0 0 auto' : 1 },
                height: 'fit-content',
                minWidth: 0,
                width: { xs: '100%', md: item.relatedItems?.length ? 'fit-content' : '100%' },
                alignSelf: 'stretch',
                border: item.isCurrent ? '1px solid #c7d2fe' : '1px solid #e2e8f0',
                background: item.isCurrent
                    ? 'linear-gradient(180deg, rgba(238, 242, 255, 0.95) 0%, rgba(255, 255, 255, 1) 100%)'
                    : 'linear-gradient(180deg, rgba(248, 250, 252, 0.95) 0%, rgba(255, 255, 255, 1) 100%)',
                borderRadius: 2.5,
                p: 1.5
            }}>
            <Stack spacing={1.25}>
                <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
                    <Typography variant="subtitle2" fontWeight={700}>
                        {item.title}
                    </Typography>
                    {item.count ? <Chip size="small" label={`${item.count} รายการ`} /> : null}
                </Stack>
                <Typography
                    variant="body2"
                    fontWeight={700}
                    sx={{
                        color: hasDocument ? '#0f172a' : '#94a3b8',
                        wordBreak: 'break-word',
                        minHeight: 20
                    }}>
                    {item.isLoading ? 'กำลังค้นหาเอกสาร...' : item.docNo || 'ยังไม่มีเอกสาร'}
                </Typography>
                <Stack
                    direction="row"
                    spacing={1}
                    alignItems="center"
                    justifyContent="space-between"
                    flexWrap="wrap"
                    useFlexGap>
                    {statusLabel ? (
                        <Chip
                            size="small"
                            label={statusLabel}
                            sx={{
                                fontWeight: 700,
                                backgroundColor: statusColor.backgroundColor,
                                color: statusColor.color
                            }}
                        />
                    ) : (
                        <Typography variant="caption" color="text.secondary">
                            {hasDocument ? '-' : 'รอสร้างเอกสาร'}
                        </Typography>
                    )}
                    {item.onOpen ? (
                        <Button
                            size="small"
                            variant="text"
                            endIcon={<OpenInNew fontSize="small" />}
                            onClick={item.onOpen}
                            sx={{ ml: 'auto' }}>
                            ดูรายละเอียด
                        </Button>
                    ) : null}
                </Stack>
                {item.relatedItems?.length ? (
                    <Stack spacing={1} alignItems="flex-start">
                        <Stack spacing={1} alignItems="flex-start" sx={{ width: '100%' }}>
                            {item.relatedItems.map((relatedItem) => {
                                const relatedHasDocument = Boolean(relatedItem.docNo);
                                const relatedStatusColor = getDocumentStatusChipSx(
                                    relatedItem.status,
                                    relatedItem.statusProfile
                                );
                                const relatedStatusLabel = getDocumentStatusLabel(
                                    relatedItem.status,
                                    relatedItem.statusProfile
                                );

                                return (
                                    <Box
                                        key={`${item.title}:${relatedItem.docNo || relatedItem.title}`}
                                        sx={{
                                            width: 'fit-content',
                                            maxWidth: '100%',
                                            alignSelf: 'flex-start',
                                            border: relatedItem.isCurrent ? '1px solid #93c5fd' : '1px solid #e2e8f0',
                                            borderRadius: 2,
                                            px: 1.25,
                                            py: 1,
                                            backgroundColor: relatedItem.isCurrent ? '#eff6ff' : '#fff'
                                        }}>
                                        <Stack
                                            direction={{ xs: 'column', sm: 'row' }}
                                            spacing={1}
                                            alignItems={{ xs: 'flex-start', sm: 'center' }}
                                            justifyContent="space-between">
                                            <Stack spacing={0.4}>
                                                <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                                                    <Typography variant="body2" fontWeight={700}>
                                                        {relatedItem.docNo || relatedItem.title}
                                                    </Typography>
                                                    {relatedItem.isCurrent ? (
                                                        <Chip size="small" color="primary" label="ใบปัจจุบัน" />
                                                    ) : null}
                                                </Stack>
                                                <Stack
                                                    direction="row"
                                                    spacing={1}
                                                    alignItems="center"
                                                    flexWrap="wrap"
                                                    useFlexGap>
                                                    {relatedStatusLabel ? (
                                                        <Chip
                                                            size="small"
                                                            label={relatedStatusLabel}
                                                            sx={{
                                                                fontWeight: 700,
                                                                backgroundColor: relatedStatusColor.backgroundColor,
                                                                color: relatedStatusColor.color
                                                            }}
                                                        />
                                                    ) : (
                                                        <Typography variant="caption" color="text.secondary">
                                                            {relatedHasDocument ? '-' : 'รอสร้างเอกสาร'}
                                                        </Typography>
                                                    )}
                                                    {relatedItem.isLoading ? (
                                                        <Typography variant="caption" color="text.secondary">
                                                            กำลังค้นหาเอกสาร...
                                                        </Typography>
                                                    ) : null}
                                                </Stack>
                                            </Stack>
                                            {relatedItem.onOpen ? (
                                                <Button
                                                    size="small"
                                                    variant="text"
                                                    endIcon={<OpenInNew fontSize="small" />}
                                                    onClick={relatedItem.onOpen}
                                                    sx={{ ml: 'auto' }}>
                                                    ดูรายละเอียด
                                                </Button>
                                            ) : null}
                                        </Stack>
                                    </Box>
                                );
                            })}
                        </Stack>
                    </Stack>
                ) : null}
            </Stack>
        </Box>
    );
}
