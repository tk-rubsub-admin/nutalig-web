import { Paper } from '@mui/material';
import { styled } from '@mui/material/styles';

const StyledPaper = styled(Paper)(({ theme }) => ({
  borderRadius: '8px',
  boxShadow: '0px 0px 14px 0px rgba(53, 64, 82, 0.05)',
  backgroundColor: theme.palette.background.paper,
  border: `1px solid ${theme.palette.divider}`
}));

export default StyledPaper;
