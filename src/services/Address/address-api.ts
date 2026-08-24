import { api } from 'api/api';
import { GetCountry, GetDistrict, GetProvince, GetSubDistrict } from './address-type';

export const getProvince = async () => {
  const response: GetProvince = await api.get(`/v1/provinces`).then((response) => response.data);
  return response.data;
};

export const getDistrict = async () => {
  const response: GetDistrict = await api
    .get(`/v1/provinces/ /districts`)
    .then((response) => response.data);
  return response.data;
};

export const getSubDistrict = async () => {
  const response: GetSubDistrict = await api
    .get(`/v1/provinces/ /districts/ /subdistricts`)
    .then((response) => response.data);
  return response.data;
};

export const getCountry = async () => {
  const response: GetCountry = await api.get(`/v1/countries`).then((response) => response.data);
  return response.data;
};

export const getAmphure = getDistrict;

export const getTumbon = getSubDistrict;
