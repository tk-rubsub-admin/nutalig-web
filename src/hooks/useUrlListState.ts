import {
  Dispatch,
  SetStateAction,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';
import { useHistory, useLocation } from 'react-router-dom';

export interface UrlListStateOptions<TFilter> {
  defaultFilter: TFilter;
  parseFilter: (search: string, defaultFilter: TFilter) => TFilter;
  serializeFilter: (params: URLSearchParams, filter: TFilter) => void;
  defaultPageSize?: number;
}

export interface UrlListState<TFilter> {
  filter: TFilter;
  page: number;
  pageSize: number;
  setFilter: Dispatch<SetStateAction<TFilter>>;
  setPage: Dispatch<SetStateAction<number>>;
  setPageSize: Dispatch<SetStateAction<number>>;
  reset: () => void;
}

export function useUrlListState<TFilter>({
  defaultFilter,
  parseFilter,
  serializeFilter,
  defaultPageSize = 10
}: UrlListStateOptions<TFilter>): UrlListState<TFilter> {
  const history = useHistory();
  const location = useLocation();
  const parsedParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const defaultFilterRef = useRef(defaultFilter);
  const parseFilterRef = useRef(parseFilter);
  const serializeFilterRef = useRef(serializeFilter);
  defaultFilterRef.current = defaultFilter;
  parseFilterRef.current = parseFilter;
  serializeFilterRef.current = serializeFilter;
  const [filter, setFilter] = useState<TFilter>(() =>
    parseFilter(location.search, defaultFilter)
  );
  const [page, setPage] = useState(() => Number(parsedParams.get('page')) || 1);
  const [pageSize, setPageSize] = useState(
    () => Number(parsedParams.get('pageSize')) || defaultPageSize
  );

  useEffect(() => {
    setFilter(parseFilterRef.current(location.search, defaultFilterRef.current));
    setPage(Number(parsedParams.get('page')) || 1);
    setPageSize(Number(parsedParams.get('pageSize')) || defaultPageSize);
  }, [defaultPageSize, location.search, parsedParams]);

  useEffect(() => {
    const params = new URLSearchParams();
    params.set('page', String(page));
    params.set('pageSize', String(pageSize));
    serializeFilterRef.current(params, filter);
    const search = `?${params.toString()}`;
    if (search === location.search) return;

    history.replace({
      pathname: location.pathname,
      search,
      state: location.state
    });
  }, [filter, history, location.pathname, location.search, location.state, page, pageSize]);

  const reset = useCallback(() => {
    setFilter(defaultFilterRef.current);
    setPage(1);
    setPageSize(defaultPageSize);
  }, [defaultPageSize]);

  return { filter, page, pageSize, setFilter, setPage, setPageSize, reset };
}
