/* eslint-disable prettier/prettier */
import { useQuery, useQueryClient } from 'react-query';
import { SearchSaleOrderRequest } from 'services/SaleOrder/sale-order-type';

export function useAdvanceSOFilter(
    userId: string,
    defaultFilter: SearchSaleOrderRequest
) {
    const queryClient = useQueryClient();
    const QUERY_KEY = ['advance-po-filter', userId];

    // โหลด filter จาก cache
    const { data: filter = defaultFilter } = useQuery<SearchSaleOrderRequest>(
        QUERY_KEY,
        () => defaultFilter,
        {
            staleTime: Infinity,
            cacheTime: Infinity
        }
    );

    // update filter
    const setFilter = (newFilter: SearchSaleOrderRequest) => {
        queryClient.setQueryData(QUERY_KEY, newFilter);
    };

    // reset filter
    const resetFilter = () => {
        queryClient.setQueryData(QUERY_KEY, defaultFilter);
    };

    return {
        filter,
        setFilter,
        resetFilter
    };
}