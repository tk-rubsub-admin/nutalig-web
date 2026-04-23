import { Box } from '@mui/material';
import styled from 'styled-components';

export const StyledBox = styled(Box)`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  flex-wrap: wrap;
  flex-grow: 1;
  border: 1px solid ${(props) => props.theme.palette.grey[300]};
  border-radius: 4px;
  padding: 24px;
  margin-top: 2px;
  margin-bottom: 24px;
  transition: all 0.3s ease-in-out;
`;
