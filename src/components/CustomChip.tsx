import { Chip } from '@mui/material';
import styled from 'styled-components';

const ChipStandard = styled(Chip)`
  border-radius: 64px !important;
`;

const ChipGreen = styled(Chip)`
  background-color: ${({ theme }) => theme.palette.success.main} !important;
  color: ${({ theme }) => theme.palette.primary.contrastText} !important;
  border-radius: 64px !important;
`;

const ChipRed = styled(Chip)`
  background-color: ${({ theme }) => theme.palette.error.main} !important;
  color: ${({ theme }) => theme.palette.primary.contrastText} !important;
  border-radius: 64px !important;
`;

const ChipLightGrey = styled(Chip)`
  background-color: ${({ theme }) => theme.palette.divider} !important;
  color: ${({ theme }) => theme.palette.text.primary} !important;
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
