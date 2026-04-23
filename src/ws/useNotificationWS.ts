/* eslint-disable prettier/prettier */
// src/ws/useNotificationWS.ts

import { useEffect, useMemo } from "react";
import { notificationClient } from "./notificationClient";
import { NotificationEvent } from "./notificationType";

type Roles = string[];

export function useNotificationWS({
    token,
    userId,
    roles,
    onEvent,
    wsUrl = "/ws",
}: {
    token: string;
    userId: string;
    roles: Roles;
    onEvent: (event: NotificationEvent) => void;
    wsUrl?: string;
}) {

    const roleTopics = useMemo(() => {
        const topics: string[] = [];
        if (roles.includes("SUPER_ADMIN")) {
            topics.push("/topic/notifications/SUPER_ADMIN");
        }
        if (roles.includes("RECEIVE")) {
            topics.push("/topic/notifications/RECEIVE");
        }
        if (roles.includes("PROCUREMENT")) {
            topics.push("/topic/notifications/PROCUREMENT");
        }
        if (roles.includes("PROCUREMENT_ADMIN")) {
            topics.push("/topic/notifications/PROCUREMENT_ADMIN");
        }
        if (roles.includes("ACCOUNT_ADMIN")) {
            topics.push("/topic/notifications/ACCOUNT_ADMIN");
        }
        if (roles.includes("ACCOUNT")) {
            topics.push("/topic/notifications/ACCOUNT");
        }
        return topics;
    }, [roles]);

    useEffect(() => {
        if (!token || !userId) return;

        notificationClient.connect({
            wsUrl,
            token,
            onConnect: () => {
                notificationClient.unsubscribeAll();

                // ✅ user-queue: ห้ามใส่ userId
                console.log("subscribe user queue");
                notificationClient.subscribe("/user/queue/notifications", (msg) => {
                    try {
                        console.log("[USER QUEUE RAW]", msg.body);
                        const payload: NotificationEvent = JSON.parse(msg.body);
                        onEvent(payload);
                    } catch (e) {
                        console.error("Invalid user notification payload", e, msg.body);
                    }
                });

                // role topics
                roleTopics.forEach((topic) => {
                    notificationClient.subscribe(topic, (msg) => {
                        try {
                            console.log("[ROLE TOPIC RAW]", topic, msg.body);
                            const payload: NotificationEvent = JSON.parse(msg.body);
                            onEvent(payload);
                        } catch (e) {
                            console.error("Invalid role notification payload", e, msg.body);
                        }
                    });
                });
            },
            onError: (err) => console.error("WS error", err),
        });

        return () => {
            notificationClient.disconnect();
        };
    }, [token, userId, roleTopics, onEvent, wsUrl]);
}