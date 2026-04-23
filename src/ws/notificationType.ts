/* eslint-disable prettier/prettier */

// ประเภท event ที่มาจาก WS/BE
export type NotificationType = 'NEW_REQUEST' | 'JOB_DONE' | 'SYSTEM_ALERT' | 'INFO';

// payload ที่มาจาก WS
export interface NotificationEvent<T = any> {
    type: NotificationType;
    message: string;
    data?: T;
    createdAt?: string; // ISO string
    id?: string;        // ถ้า backend ส่งมา
}

// item สำหรับ Notification Center
export interface NotificationItem {
    id: string;
    type: NotificationType;
    title?: string;
    message: string;
    data?: any;
    createdAt: string;     // ISO string
    readAt?: string | null; // null/undefined = unread
}


export const isUnread = (n: NotificationItem) => !n.readAt;