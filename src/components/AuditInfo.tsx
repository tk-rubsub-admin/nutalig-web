/* eslint-disable prettier/prettier */
import * as React from 'react';
import { Box, Typography } from '@mui/material';

type AuditInfoProps = {
    createdBy?: string | null;
    createdDate?: Date | string | number | null;
    updatedBy?: string | null;
    updatedDate?: Date | string | number | null;

    /** ฟังก์ชันแปลงวันที่ให้เป็น string */
    formatDate: (input: Date | string | number | null | undefined) => string;

    /** label ปรับได้ (รองรับ i18n) */
    createdLabel?: React.ReactNode;
    updatedLabel?: React.ReactNode;

    /** ถ้าค่าว่าง ให้แสดงเป็นอะไร (ค่าเริ่มต้น '-') */
    emptyText?: React.ReactNode;
};

export default function AuditInfo({
    createdBy,
    createdDate,
    updatedBy,
    updatedDate,
    formatDate,
    createdLabel = 'Created By',
    updatedLabel = 'Updated By',
    emptyText = '-'
}: AuditInfoProps) {
    const createdValue = [createdBy ?? emptyText, 'เมื่อ', formatDate?.(createdDate) || emptyText].join(
        ' '
    );

    const updatedValue = [updatedBy ?? emptyText, 'เมื่อ', formatDate?.(updatedDate) || emptyText].join(
        ' '
    );

    return (
        <Box
            sx={{
                display: 'grid',
                gridTemplateColumns: 'max-content 1fr', // คอลัมน์ซ้ายกว้างเท่าข้อความ label
                columnGap: 1,
                rowGap: 0.25,
                alignItems: 'center'
            }}>
            <Typography variant="caption" color="text.secondary" noWrap>
                {createdLabel} :
            </Typography>
            <Typography variant="caption" color="text.secondary">{createdValue}</Typography>

            <Typography variant="caption" color="text.secondary" noWrap>
                {updatedLabel} :
            </Typography>
            <Typography variant="caption" color="text.secondary">{updatedValue}</Typography>
        </Box >
    );
}
