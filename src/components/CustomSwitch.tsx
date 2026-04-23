/* eslint-disable prettier/prettier */
import { FormControlLabel, Switch } from '@mui/material';

interface CustomSwitchProps {
  checked: boolean;
  label: string;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  sx?: SxProps<Theme>;
  style?: React.CSSProperties;
  className?: string;
}

export default function CustomSwitch({
  checked,
  label,
  onChange,
  disabled = false,
  sx,
  style,
  className,
}: CustomSwitchProps) {
  return (
    <FormControlLabel
      className={className}
      style={style}
      sx={{
        m: 0,
        px: 1.5,
        py: 0.5,
        borderRadius: 2,
        bgcolor: checked ? 'action.selected' : 'transparent',
        transition: 'all 0.2s ease',
        '&:hover': {
          bgcolor: 'action.hover',
        },
        opacity: disabled ? 0.6 : 1,
        ...sx,
      }}
      control={
        <Switch
          checked={checked}
          disabled={disabled}
          onChange={(e) => onChange(e.target.checked)}
          sx={{
            // วงกลม (thumb)
            '& .MuiSwitch-thumb': {
              border: '2px solid',
              borderColor: checked ? '#1976d2' : '#bdbdbd',
              boxSizing: 'border-box',
            },

            // track
            '& .MuiSwitch-track': {
              borderRadius: 13,
            },
          }}
        />
      }
      label={label}
    />
  );
}