/* eslint-disable prettier/prettier */
export const getStatusChipSx = (status: string) => {
    switch (status) {
        case 'CREATED':
            return {
                backgroundColor: '#3aa3d0',
                color: '#e6f6fc',
                fontWeight: 'bold'
            };

        case 'DRAFT':
            return {
                backgroundColor: '#f3f4f6',
                color: '#4b5563',
                fontWeight: 'bold'
            };

        case 'COMPLETED':
            return {
                backgroundColor: '#fff6df',
                color: '#fbab24',
                fontWeight: 'bold'
            };

        case 'CONFIRMED':
            return {
                backgroundColor: '#dbeafe',
                color: '#1e40af',
                fontWeight: 'bold'
            };

        case 'PAID':
            return {
                backgroundColor: '#16a34a',
                color: '#ffffff',
                fontWeight: 'bold'
            };

        case 'CANCELLED':
            return {
                backgroundColor: '#dc2626',
                color: '#ffffff',
                fontWeight: 'bold'
            };

        default:
            return {
                backgroundColor: '#e5e7eb',
                color: '#374151',
                fontWeight: 'bold'
            };
    }
};