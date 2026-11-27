import { api } from 'api/api';
import {
  ComponentDictionary,
  ComponentDictionaryListResponse,
  ComponentDictionarySearch,
  ComponentDictionaryStatus
} from './component-dictionary-type';

const toQuery = (page: number, size: number, search: ComponentDictionarySearch) => {
  const params = new URLSearchParams({ page: String(page), size: String(size) });
  if (search.keyword) params.set('keyword', search.keyword);
  if (search.status) params.set('status', search.status);
  return params.toString();
};

export const getComponentDictionaryList = async (
  page = 1,
  size = 20,
  search: ComponentDictionarySearch = {}
) => {
  const response = await api
    .get(`/v1/component-dictionaries?${toQuery(page, size, search)}`)
    .then((result) => result.data);
  return response.data as ComponentDictionaryListResponse;
};

export const createComponentDictionary = async (payload: ComponentDictionary) =>
  api.post('/v1/component-dictionaries', payload).then((result) => result.data);

export const updateComponentDictionary = async (id: number, payload: ComponentDictionary) =>
  api.put(`/v1/component-dictionaries/${id}`, payload).then((result) => result.data);

export const updateComponentDictionaryStatus = async (
  id: number,
  status: ComponentDictionaryStatus
) => api
  .patch(`/v1/component-dictionaries/${id}/status`, null, { params: { status } })
  .then((result) => result.data);
