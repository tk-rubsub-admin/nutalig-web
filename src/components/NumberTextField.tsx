/* eslint-disable prettier/prettier */
import * as React from 'react';
import TextField, { TextFieldProps } from '@mui/material/TextField';

export type NumberTextFieldProps = Omit<TextFieldProps, 'value' | 'onChange' | 'type'> & {
    /** ค่าที่แสดง (ปล่อย null/undefined เพื่อให้ input ว่างได้) */
    value?: number | null;
    /** ค่าต่ำสุด (จะ clamp ตอน commit) */
    min?: number;
    /** ค่าสูงสุด (จะ clamp ตอน commit) */
    max?: number;
    /** เรียกทุกครั้งที่ผู้ใช้พิมพ์ (ยังไม่ clamp) */
    onChange?: (value: number | null) => void;
    /** เรียกตอน commit (blur หรือ Enter) พร้อมค่าที่ถูก clamp แล้ว */
    onCommit?: (value: number | null) => void;
};

export default function NumberTextField({
    value,
    min,
    max,
    onChange,
    onCommit,
    inputProps,
    onFocus,
    onBlur,
    onKeyDown,
    sx,
    ...rest
}: NumberTextFieldProps) {
    // ทำให้เป็น controlled string (เพื่อรองรับการว่างระหว่างพิมพ์)
    const displayValue = (value === null || value === undefined) ? '' : String(value);

    const sanitize = (raw: string) => raw.replace(/[^\d]/g, ''); // เก็บเฉพาะตัวเลข

    const handleFocus: React.FocusEventHandler<HTMLInputElement | HTMLTextAreaElement> = (e) => {
        // เลื่อน caret ไปท้ายสุด
        const input = e.target as HTMLInputElement;
        const len = input.value.length;
        requestAnimationFrame(() => {
            try {
                input.setSelectionRange(len, len);
            } catch { }
        });
        onFocus?.(e);
    };

    const handleChange: React.ChangeEventHandler<HTMLInputElement | HTMLTextAreaElement> = (e) => {
        const raw = e.target.value;
        if (raw === '') {
            onChange?.(null);
            return;
        }
        const onlyDigits = sanitize(raw);
        // อนุญาตให้ลบจนว่าง ถ้าผู้ใช้เคาะตัวอักษรอื่นจะถูกกรองออก
        onChange?.(onlyDigits === '' ? null : Number(commit(onlyDigits)));
    };

    const commit = (raw: string): number | null => {
        if (raw === '') return null;
        let n = Number(sanitize(raw));
        if (Number.isNaN(n)) return null;
        if (typeof min === 'number' && n < min) n = min;
        if (typeof max === 'number' && n > max) n = max;
        return n;
    };

    const handleBlur: React.FocusEventHandler<HTMLInputElement | HTMLTextAreaElement> = (e) => {
        const v = commit(e.target.value);
        onCommit?.(v);
        onBlur?.(e);
    };

    const handleKeyDown: React.KeyboardEventHandler<HTMLInputElement | HTMLTextAreaElement> = (e) => {
        if (e.key === 'Enter') {
            const target = e.target as HTMLInputElement;
            const v = commit(target.value);
            onCommit?.(v);
        }
        onKeyDown?.(e);
    };

    return (
        <TextField
            {...rest}
            type="text" // ใช้ text เพื่อควบคุม caret บน iOS
            value={displayValue}
            onFocus={handleFocus}
            onChange={handleChange}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            inputProps={{
                ...(inputProps || {}),
                inputMode: 'numeric',
                pattern: '[0-9]*',
                // เก็บ min/max ไว้ใน inputProps เผื่อ browser ช่วย validate เพิ่มเติม (เรา clamp เองแล้ว)
                min,
                max
            }}
            sx={{
                '& input': { padding: '16.5px 14px', textAlign: 'center' },
                '& input::-webkit-outer-spin-button, & input::-webkit-inner-spin-button': {
                    display: 'none'
                },
                '& input[type=number]': { MozAppearance: 'textfield' },
                ...(sx || {})
            }}
        />
    );
}
