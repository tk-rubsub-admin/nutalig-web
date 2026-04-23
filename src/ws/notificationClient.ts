/* eslint-disable prettier/prettier */
// src/ws/notificationClient.ts

import SockJS from "sockjs-client";
import { Client, IMessage, StompSubscription } from "@stomp/stompjs";

type OnConnectFn = (client: Client) => void;
type OnErrorFn = (err: any) => void;

class NotificationClient {
    private client: Client | null = null;
    private subscriptions: StompSubscription[] = [];
    private connected = false;

    connect({
        wsUrl = "/ws",
        token,
        onConnect,
        onError,
    }: {
        wsUrl?: string;
        token: string;
        onConnect?: OnConnectFn;
        onError?: OnErrorFn;
    }) {
        if (this.client && (this.connected || this.client.active)) {
            return; // กัน connect ซ้ำ
        }

        const client = new Client({
            webSocketFactory: () => new SockJS(wsUrl),
            connectHeaders: {
                Authorization: `Bearer ${token}`,
            },
            debug: (str) => {
                // เปิดได้ตอน debug
                // console.log("[STOMP]", str);
            },
            reconnectDelay: 3000,     // auto reconnect ทุก 3 วิ
            heartbeatIncoming: 10000, // keepalive
            heartbeatOutgoing: 10000,
            onConnect: () => {
                this.connected = true;
                onConnect?.(client);
            },
            onDisconnect: () => {
                this.connected = false;
            },
            onStompError: (frame) => {
                this.connected = false;
                onError?.(frame);
            },
            onWebSocketError: (evt) => {
                this.connected = false;
                onError?.(evt);
            },
        });

        client.activate();
        this.client = client;
    }

    disconnect() {
        this.subscriptions.forEach((s) => s.unsubscribe());
        this.subscriptions = [];
        this.connected = false;

        if (this.client) {
            this.client.deactivate();
            this.client = null;
        }
    }

    subscribe(destination: string, cb: (msg: IMessage) => void) {
        if (!this.client || !this.connected) return;

        const sub = this.client.subscribe(destination, cb);
        this.subscriptions.push(sub);
    }

    unsubscribeAll() {
        this.subscriptions.forEach((s) => s.unsubscribe());
        this.subscriptions = [];
    }

    isConnected() {
        return !!this.client && this.connected;
    }
}

export const notificationClient = new NotificationClient();