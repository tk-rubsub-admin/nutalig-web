/* eslint-disable prettier/prettier */
import { api } from 'api/api';

export const generateReceiveMessage = async (receiveDate: string, supplierId: string, buyingNo: string) => {
    const response = await api
        .get(`/v1/receive-message?receiveDate=${receiveDate}&supplierId=${supplierId}&buyingNo=${buyingNo}`)
        .then((response) => response.data)
    return response.data;
}
