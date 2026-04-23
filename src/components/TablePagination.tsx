import { ChangeEvent, FC } from 'react';
import { useTranslation } from 'react-i18next';
import { MenuItem, Pagination, Select, Stack, Typography } from '@mui/material';

import config from 'config';

const TablePagination: FC<{
  id?: string;
  page: number;
  totalPage: number;
  size: number;
  setPage: (value: number) => void;
  setSize: (value: number) => void;
}> = ({ id, page, totalPage, size, setPage, setSize }) => {
  const { t } = useTranslation();

  return (
    <Stack
      id={id}
      direction="row"
      spacing={6.5}
      justifyContent="flex-end"
      alignItems="center"
      sx={{ py: 3 }}>
      <Stack direction="row" spacing={2} alignItems="center">
        <Typography variant="caption" sx={{ ml: 'auto', color: 'rgba(0, 0, 0, 0.6)' }}>
          {t('tablePagination.rowPerPage')}:
        </Typography>
        <Select
          id={id && `${id}_row_per_page_select`}
          variant="standard"
          value={size}
          onChange={(event) => setSize(event.target.value as number)}
          sx={{ '&::before': { borderBottom: 'none' } }}>
          {config.tableRowsPerPageOptions?.map((option) => (
            <MenuItem key={option} value={option}>
              {option}
            </MenuItem>
          ))}
        </Select>
      </Stack>
      <Typography
        id={id && `${id}_page_status`}
        variant="caption"
        sx={{ color: 'rgba(0, 0, 0, 0.87)' }}>
        {t('tablePagination.pageStatus', { page, totalPage })}
      </Typography>
      <Pagination
        id={id && `${id}_pagination`}
        count={totalPage}
        page={page}
        variant="text"
        color="primary"
        size="large"
        onChange={(_event: ChangeEvent<unknown>, value: number) => setPage(value)}
      />
    </Stack>
  );
};

export default TablePagination;
