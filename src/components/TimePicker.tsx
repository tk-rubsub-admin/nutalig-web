import React from 'react';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import dayjs from 'dayjs';
import { DEFAULT_TIME_FORMAT } from 'utils';
import { TextFieldProps } from '@mui/material';
import { MobileTimePicker } from '@mui/x-date-pickers';

interface TimeFieldProps {
  label?: string;
  value?: dayjs.Dayjs | null;
  onChange?: (newValue: dayjs.Dayjs | null) => void;
  textFieldProps?: TextFieldProps;
  format?: string;
}

const TimeField: React.FC<TimeFieldProps> = ({
  label,
  value,
  onChange,
  textFieldProps,
  format = DEFAULT_TIME_FORMAT
}) => {
  const validValue = dayjs(value).isValid() ? value : null;

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <MobileTimePicker
        ampm={false}
        slotProps={{
          textField: {
            variant: 'outlined',
            ...textFieldProps
          }
        }}
        format={format}
        value={validValue}
        onChange={onChange}
        label={label}
      />
    </LocalizationProvider>
  );
};

export default TimeField;
