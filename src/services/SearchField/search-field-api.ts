import { api } from 'api/api';
import { SearchFieldResponse } from './search-field-type';

export const getMySearchFields = async (screenCode: string) => {
  const response: SearchFieldResponse = await api
    .get('/v1/me/search-fields', {
      params: {
        screenCode
      }
    })
    .then((response) => response.data);
  return response.data;
};
