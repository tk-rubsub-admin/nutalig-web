import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers';
import {
  MobileDateTimePicker as DateTimePickerMUI,
  MobileDateTimePickerProps
} from '@mui/x-date-pickers/MobileDateTimePicker';
import Calendar from '@mui/icons-material/Event';
import dayjs from 'dayjs';

export function DateTimePicker(props: MobileDateTimePickerProps<dayjs.Dayjs>): JSX.Element {
  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <DateTimePickerMUI
        // eslint-disable-next-line react/jsx-props-no-spreading
        {...props}
        slotProps={{
          ...props.slotProps,
          textField: {
            ...props.slotProps?.textField,
            InputProps: {
              endAdornment: <Calendar />
            }
          }
        }}
      />
    </LocalizationProvider>
  );
}
