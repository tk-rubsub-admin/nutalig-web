import { Chip } from '@mui/material';
import styled from 'styled-components';

const ChipStandard = styled(Chip)`
  border-radius: 64px !important;
`;

const ChipGreen = styled(Chip)`
  background-color: #4caf50 !important;
  color: #ffffff !important;
  border-radius: 64px !important;
`;

const ChipRed = styled(Chip)`
  background-color: #f44336 !important;
  color: #ffffff !important;
  border-radius: 64px !important;
`;

const ChipLightGrey = styled(Chip)`
  background-color: #e0e0e0 !important;
  color: #000000 !important;
  border-radius: 64px !important;
`;

interface CustomChipProps {
  label: string;
  color: string;
}

export function CustomChip(props: CustomChipProps): JSX.Element {
  const { label, color } = props;
  if (color === 'green') {
    return <ChipGreen size="small" label={label} />;
  } else if (color === 'yellow') {
    return <ChipRed size="small" label={label} />;
  } else if (color === 'lightGrey') {
    return <ChipLightGrey size="small" label={label} />;
  }
  return <ChipStandard size="small" label={label} />;
}
