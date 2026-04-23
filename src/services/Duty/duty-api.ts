/* eslint-disable prettier/prettier */
import { api } from "api/api";
import { CreateDutyRequest, GetDutyResponse } from "./duty-type";

export const getDuty = async (date: string) => {
    const response: GetDutyResponse = await api
        .get(`/v1/duty?date=${date}`)
        .then((response) => response.data);
    return response;
};

export const createDuty = async (data: CreateDutyRequest) => {
    const response = await api
        .post(`/v1/duty`, data)
        .then((response) => response.data);
    return response;
};