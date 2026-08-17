/* eslint-disable prettier/prettier */
export const formatNumber = (value: number) => {
    return Number(value || 0).toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
};

export const formatNumberWithDigit = (value: number, digit: number) => {
    return Number(value || 0).toLocaleString(undefined, {
        minimumFractionDigits: digit,
        maximumFractionDigits: digit
    });
};

export const formatNumberWithoutDigit = (value: number) => {
    return Number(value || 0).toLocaleString(undefined, {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    });
};

export const formatCurrency = (value: number) =>
    value.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });