import config from 'config';
import styled from 'styled-components';
import { FormControl, Select, MenuItem, Pagination, useTheme, useMediaQuery } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { Fragment } from 'react';
import { Pagination as IPagination } from 'services/web-bff/response.type';
import { makeStyles } from '@mui/styles';
import { isMobileOnly } from 'react-device-detect';

const PaginateContainer = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
`;

const LeftContainer = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: flex-start;
  padding: 20px;
`;

const RightContainer = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: flex-end;
  padding: 20px;
`;

const FormWrapper = styled.div`
  padding: 0 10px;
`;
const FormControlInline = styled(FormControl)`
  display: inline-flex !important;
  background: none;
`;
const TextWrapper = styled.span`
  padding: 4px 0;
`;

interface PaginateProps {
  pagination: IPagination | undefined;
  page: number;
  pageSize: number;
  setPage: (page: number) => void;
  setPageSize: (pageSize: number) => void;
  refetch: () => void;
  totalRecords: number | undefined;
  isShow: boolean;
}

export default function Paginate({
  pagination,
  page,
  pageSize,
  setPage,
  setPageSize,
  refetch,
  totalRecords,
  isShow
}: PaginateProps): JSX.Element {
  const { t } = useTranslation();
  const useStyles = makeStyles({
    hideObject: {
      display: 'none'
    }
  });
  const classes = useStyles();
  if (!pagination) {
    return <Fragment />;
  }

  return (
    <>
      {isMobileOnly ? (
        <>
          <div
            style={{
              display: 'flex',
              flexDirection: 'row',
              justifyContent: 'center'
            }}>
            <FormWrapper className={isShow && !isMobileOnly ? '' : classes.hideObject}>
              <FormControlInline variant="standard">
                <Select
                  value={pagination.size || pageSize}
                  defaultValue={pagination.size || pageSize}
                  onChange={(event) => {
                    setPage(1);
                    setPageSize(event.target.value as number);
                  }}>
                  {config.tableRowsPerPageOptions?.map((option) => (
                    <MenuItem key={option} value={option}>
                      {option}
                    </MenuItem>
                  ))}
                </Select>
              </FormControlInline>
            </FormWrapper>
            <TextWrapper>
              {pagination.page} {t('pagination.of')} {pagination.totalPage}
            </TextWrapper>
            <Pagination
              count={pagination.totalPage}
              page={pagination.page || page}
              defaultPage={pagination.page || page}
              variant="text"
              color="primary"
              onChange={(_event: React.ChangeEvent<unknown>, selectedPage: number) => {
                if (page !== selectedPage) {
                  setPage(selectedPage);
                } else {
                  refetch();
                }
              }}
            />
          </div>
        </>
      ) : (
        <>
          <PaginateContainer>
            <LeftContainer>
              <TextWrapper>
                {t('pagination.totalRecords')}: {totalRecords}
              </TextWrapper>
            </LeftContainer>
            <RightContainer>
              <TextWrapper className={isShow && !isMobileOnly ? '' : classes.hideObject}>
                {t('pagination.rowsPerPage')}:{' '}
              </TextWrapper>
              <FormWrapper className={isShow && !isMobileOnly ? '' : classes.hideObject}>
                <FormControlInline variant="standard">
                  <Select
                    value={pagination.size || pageSize}
                    defaultValue={pagination.size || pageSize}
                    onChange={(event) => {
                      setPage(1);
                      setPageSize(event.target.value as number);
                    }}>
                    {config.tableRowsPerPageOptions?.map((option) => (
                      <MenuItem key={option} value={option}>
                        {option}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControlInline>
              </FormWrapper>
              <TextWrapper>
                {pagination.page} {t('pagination.of')} {pagination.totalPage}
              </TextWrapper>
              <Pagination
                count={pagination.totalPage}
                page={pagination.page || page}
                defaultPage={pagination.page || page}
                variant="text"
                color="primary"
                onChange={(_event: React.ChangeEvent<unknown>, selectedPage: number) => {
                  if (page !== selectedPage) {
                    setPage(selectedPage);
                  } else {
                    refetch();
                  }
                }}
              />
            </RightContainer>
          </PaginateContainer>
        </>
      )}
    </>
  );
}
