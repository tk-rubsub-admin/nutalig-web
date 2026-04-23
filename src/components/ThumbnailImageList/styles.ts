import IconButton from '@material-ui/core/IconButton';
import ButtonBase from '@mui/material/ButtonBase';
import styled from 'styled-components';

export const UploadMoreButton = styled(ButtonBase)(
  ({ theme }) => `
  background-color: white;
  color: ${theme.palette.grey[500]};
  width: 120px;
  height: 120px;
  border: 1px solid ${theme.palette.grey[300]};
  border-radius: 4px;
  pointer: cursor;
`
) as typeof ButtonBase;

export const IconButtonWrapper = styled(IconButton)`
  position: absolute !important;
  top: 5px;
  right: 5px;
  width: 28px;
  height: 28px;
  color: white;
  background-color: #f4433680;
  padding: 4px;
  margin: 0;
  z-index: 1;
  :hover {
    background-color: #f44336;
  }
` as typeof IconButton;

export const LoadingImage = styled.div(
  ({ theme }) => `
  background-color: white;
  color: ${theme.palette.grey[500]};
  width: 120px;
  height: 120px;
  border: 1px solid ${theme.palette.grey[300]};
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
`
);
