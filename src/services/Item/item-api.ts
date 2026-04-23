import { crmAPI } from 'api/api';
import { Item } from './item-type';

export const getAllItem = async () => {
  const response: Item[] = await crmAPI.get('/v1/items').then((response) => response.data);
  return response.data;
};
