import { useCallback, useState } from 'react';

import config from 'config';

/**
 * Custom hook for managing pagination state.
 *
 * @param {object} [config={}] Configuration object for the hook. Optional, defaults to an empty object.
 * @param {number} [config.tableRowsDefaultPageSize=config.tableRowsDefaultPageSize] Default number of items per page. Optional, defaults to config.tableRowsDefaultPageSize.
 * @returns An object containing pagination state and handler functions:
 *   - size (number): Current number of items per page.
 *   - setSize (function): Function to set the number of items per page.
 *   - page (number): Current page number (start from 1).
 *   - setPage (function): Function to set the current page number.
 *   - totalPage (number): Total number of pages calculated.
 *   - setTotalPage (function): Function to set the total number of pages.
 *   - setPagination (function): Function to set all pagination states at once with an object.
 *   - reset (function): Function to reset pagination to initial state.
 */
export default function usePagination({
  tableRowsDefaultPageSize = config.tableRowsDefaultPageSize
}: { tableRowsDefaultPageSize?: number } = {}) {
  const [_size, _setSize] = useState(tableRowsDefaultPageSize);
  const [_page, _setPage] = useState(1);
  const [_totalPage, _setTotalPage] = useState(1);

  const setPage = useCallback((newPage: number) => {
    _setPage(newPage);
  }, []);

  const setSize = useCallback((newSize: number) => {
    _setSize(newSize);
    _setPage(1); // Reset to page 1 when page size changes
  }, []);

  const setTotalPage = useCallback((newTotalPage: number) => {
    _setTotalPage(newTotalPage);
  }, []);

  const setPagination = useCallback(
    (paginationState: { size: number; page: number; totalPage: number }) => {
      _setSize(paginationState.size);
      _setPage(paginationState.page);
      _setTotalPage(paginationState.totalPage);
    },
    []
  );

  const reset = useCallback(() => {
    _setSize(tableRowsDefaultPageSize);
    _setPage(1);
    _setTotalPage(1);
  }, [tableRowsDefaultPageSize]);

  return {
    size: _size,
    setSize,
    page: _page,
    setPage,
    totalPage: _totalPage,
    setTotalPage,
    setPagination,
    reset
  };
}
