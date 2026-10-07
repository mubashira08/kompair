import React, { useEffect, useState } from 'react';
import { api } from '../services/api';

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  read_at: string | null;
  created_at: string;
}

export const NotificationsList: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const response = await api.get('/notifications');
        setNotifications(response.data);
      } catch (err) {
        console.error('Failed to fetch notifications', err);
      } finally {
        setLoading(false);
      }
    };
    fetchNotifications();
  }, []);

  const markAsRead = async (id: string) => {
    try {
      await api.post(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read_at: new Date().toISOString() } : n));
    } catch (err) {
      console.error('Failed to mark notification as read', err);
    }
  };

  const requestPushPermission = async () => {
    if ('Notification' in window && 'serviceWorker' in navigator) {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        const registration = await navigator.serviceWorker.ready;
        try {
          const subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            // Replace with actual VAPID public key
            applicationServerKey: 'YOUR_VAPID_PUBLIC_KEY' 
          });
          
          await api.post('/notifications/subscribe', {
            subscription,
            platform: 'web'
          });
          
          alert('Successfully subscribed to push notifications!');
        } catch (error) {
          console.error('Failed to subscribe the user: ', error);
        }
      }
    }
  };

  if (loading) return <div>Loading notifications...</div>;

  return (
    <div className="bg-white rounded-lg shadow p-4 max-w-md mx-auto mt-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold">Notifications</h3>
        <button 
          onClick={requestPushPermission}
          className="text-sm text-blue-600 hover:underline"
        >
          Enable Push
        </button>
      </div>
      
      {notifications.length === 0 ? (
        <p className="text-gray-500 text-center py-4">No notifications yet.</p>
      ) : (
        <ul className="space-y-3 max-h-80 overflow-y-auto">
          {notifications.map(notification => (
            <li 
              key={notification.id} 
              className={`p-3 rounded border ${notification.read_at ? 'bg-gray-50 border-gray-100' : 'bg-blue-50 border-blue-200'}`}
              onClick={() => !notification.read_at && markAsRead(notification.id)}
            >
              <h4 className="font-semibold text-gray-800">{notification.title}</h4>
              <p className="text-gray-600 text-sm mt-1">{notification.body}</p>
              <span className="text-xs text-gray-400 mt-2 block">
                {new Date(notification.created_at).toLocaleString()}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
