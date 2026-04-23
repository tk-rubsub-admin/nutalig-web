import { Button, Card, Grid, TableContainer, TextField } from '@mui/material';
import styled from 'styled-components';

export const Wrapper = styled(Card)`
  padding: 15px;
  margin-top: 20px;
`;
export const ContentSection = styled.div`
  margin-bottom: 20px;
`;

export const TableContainerWithNoBorder = styled(TableContainer)`
  border: 0px;
`;
export const DisabledField = styled(TextField)`
  .MuiInputBase-root {
    background-color: #f5f5f5;
  }
  .MuiInputBase-input:disabled {
    color: #000000 !important;
    -webkit-text-fill-color: #000000 !important;
  }
  label.Mui-disabled {
    color: #000000 !important;
    -webkit-text-fill-color: #000000 !important;
  }
`;
export const EnabledTextField = styled(TextField)`
  .MuiInputBase-input {
    color: #000000 !important;
    -webkit-text-fill-color: #000000 !important;
  }
  fieldset.MuiOutlinedInput-notchedOutline {
    border-color: #000000;
  }
  label {
    color: #000000 !important;
    -webkit-text-fill-color: #000000 !important;
  }
`;
export const GridSearchSection = styled(Grid)`
  padding-top: 20px !important;
  align-items: left !important;
  min-height: 100px !important;
`;
export const GridTextField = styled(Grid)`
  padding-top: 10px !important;
  padding-bottom: 10px !important;
`;

export const TextSmallLineClamp = styled.div`
  text-overflow: ellipsis;
  overflow: hidden;
  overflow-wrap: break-word;
  width: 80px;
  padding-left: 15px;
  -line-clamp: 2;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  display: -webkit-box;
`;
export const TextLineClamp = styled.div`
  text-overflow: ellipsis;
  overflow: hidden;
  overflow-wrap: break-word;
  padding-left: 15px;
  -line-clamp: 2;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  display: -webkit-box;
`;
export const TextLineURLClamp = styled.div`
  text-overflow: ellipsis;
  overflow: hidden;
  overflow-wrap: break-word;
  padding-left: 15px;
  width: 200px;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  display: -webkit-box;
`;

export const SearchButton = styled(Button)`
  font-weight: bold !important;
  display: inline-flexbox;
  box-shadow: none;
  padding: 14px 12px !important;
  width: 107px;
`;

export const DataWrapper = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: left;
`;
export const ChannelWrapper = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: center;
`;
