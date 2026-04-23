/* eslint-disable prettier/prettier */
import { api } from "api/api";
import { ManualDto } from "./manual-type";

export const getManualByUser = async () => {
    const response: ManualDto[] = await api
        .get(`/v1/manuals`).then((response) => response.data);
    return response.data;
};

export const getManualById = async (id: string) => {
    const response: ManualDto = await api
        .get(`/v1/manuals/${id}`).then((response) => response.data);
    return response.data;
};