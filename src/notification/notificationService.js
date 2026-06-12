// src/notificationService.js

import { messaging } from './firebase';
import { getToken, onMessage } from 'firebase/messaging';

const VAPID_KEY =
  'BFUkx7jW4_Ro82nLGFGmIy5S35wYoxArLVDRL-2_oEg21Y6HRdYtos73wT9zvkt8u-CeXR_8RxYH_StIvd48-V0';

export async function requestNotificationPermission(userId) {
  const permission = await Notification.requestPermission();

  if (permission !== 'granted') {
    return;
  }

  const token = await getToken(messaging, {
    vapidKey: VAPID_KEY
  });

  console.log('FCM Token:', token);

  await fetch('/api/notification-token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      userId,
      token,
      platform: 'web'
    })
  });
}

export function listenNotification() {
  onMessage(messaging, (payload) => {
    console.log(payload);

    new Notification(payload.notification?.title || 'Notification', {
      body: payload.notification?.body
    });
  });
}
