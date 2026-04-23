/* eslint-disable prettier/prettier */
import React from 'react';
import { Box, MenuItem, Select } from '@mui/material';
import { GridRenderEditCellParams } from '@mui/x-data-grid';

interface Bank {
    icon: string;
    nameTh: string;
    code: string;
}

interface Props extends GridRenderEditCellParams {
    bankOptions: Bank[];
}

const BankSelectEditComponent = (props: Props) => {
    const { id, field, value, api, bankOptions } = props;

    const handleChange = (event) => {
        const newValue = event.target.value;
        api.setEditCellValue({ id, field, value: newValue });
    };

    return (
        <Select value={value || ''} onChange={handleChange} fullWidth>
            {bankOptions.map((bank) => (
                <MenuItem key={bank.code} value={bank.nameTh}>
                    <Box display="flex" alignItems="center">
                        <img src={"/bank/" + bank.code + ".png"} alt={bank.nameTh} width={24} height={24} style={{ marginRight: 8 }} />
                        {bank.nameTh}
                    </Box>
                </MenuItem>
            ))}
        </Select>
    );
};

export default BankSelectEditComponent;

