import webpush from 'web-push';
import { db } from './db.service';

// In a real app, generate VAPID keys using `npx web-push generate-vapid-keys`
// and store them in environment variables.
const publicVapidKey = process.env.VAPID_PUBLIC_KEY || 'BF...'; // Replace with real generated key
const privateVapidKey = process.env.VAPID_PRIVATE_KEY || '...'; // Replace with real generated key

try {
  webpush.setVapidDetails(
    'mailto:support@studymate.test', // Should be a valid email
    publicVapidKey,
    privateVapidKey
  );
} catch (e) {
  console.warn('VAPID keys not configured properly for push notifications.');
}

export const sendPushNotification = async (userId: string, payload: any) => {
  try {
    const devices = await db.query('SELECT device_token FROM user_devices WHERE user_id = $1', [userId]);
    
    for (const device of devices.rows) {
      const pushSubscription = typeof device.device_token === 'string' ? JSON.parse(device.device_token) : device.device_token;
      try {
        await webpush.sendNotification(pushSubscription, JSON.stringify(payload));
      } catch (err: any) {
        console.error('Push notification failed, may be expired', err);
        if (err.statusCode === 410 || err.statusCode === 404) {
          // Subscription has expired or is no longer valid, delete it
          await db.query('DELETE FROM user_devices WHERE user_id = $1 AND device_token::text = $2', [userId, JSON.stringify(pushSubscription)]);
        }
      }
    }
  } catch (error) {
    console.error('Error in sendPushNotification', error);
  }
};
