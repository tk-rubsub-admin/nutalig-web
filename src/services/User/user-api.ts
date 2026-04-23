/* eslint-disable prettier/prettier */
import { api } from 'api/api';
import { CreateNewUserRequest, GetAllRole, SearchUserRequest, UpdateLineConnectRequest } from './user-type';

export const getAllUserRole = async () => {
    const response: GetAllRole = await api
        .get(`/v1/user/roles`)
        .then((response) => response.data);
    return response.data;
};

export const createUser = async (data: CreateNewUserRequest) => {
    const response = await api
        .post(`/v1/users`, data)
        .then((response) => response.data);
    return response;
};

export const searchUser = async (data: SearchUserRequest, page: number, size: number) => {
    const response = await api
        .post(`/v1/users/search`, data, {
            params: {
                page,
                size
            }
        })
        .then((response) => response.data);
    return response;
}

export const updateActiveInactiveUser = async (userId: string, status: string) => {
    const response = await api
        .patch(`/v1/users/${userId}/status/${status}`)
        .then((response) => response.data);
    return response;
};

export const resetUserPassword = async (userId: string) => {
    const response = await api
        .post(`/v1/users/${userId}/reset-password`)
        .then((response) => response.data);
    return response;
};

export const deleteUser = async (userId: string) => {
    const response = await api
        .delete(`/v1/users/${userId}`)
        .then((response) => response.data);
    return response;
};

export const updateLineConnect = async (req: UpdateLineConnectRequest) => {
    const response = await api
        .post(`/v1/users/line-connect`, req)
        .then((response) => response.data);
    return response;
}
