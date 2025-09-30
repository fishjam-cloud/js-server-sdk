import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../config';

interface Notification {
  id: string;
  type: string;
  timestamp: Date;
  data: any;
}

interface NotificationsSectionProps {
  localNotifications: Notification[];
}

export const NotificationsSection: React.FC<NotificationsSectionProps> = ({ localNotifications }) => {
  const [serverNotifications, setServerNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    const eventSource = new EventSource(`${API_BASE_URL}/notifications/stream`);

    eventSource.onmessage = (event) => {
      try {
        const notification = JSON.parse(event.data);
        if (notification.type !== 'heartbeat') {
          setServerNotifications(prev => [{
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            type: notification.type,
            timestamp: new Date(notification.timestamp),
            data: notification.data
          }, ...prev.slice(0, 19)]);
        }
      } catch {}
    };

    return () => eventSource.close();
  }, []);

  const allNotifications = [...localNotifications, ...serverNotifications]
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    .slice(0, 50);

  const getIcon = (type: string) => {
    const icons: Record<string, string> = {
      peerCreated: '✅', peerConnected: '✅', peerSubscribed: '🔗',
      tracksSubscribed: '🔗', peerDisconnected: '❌', trackAdded: '🎥',
      trackRemoved: '🗑️', subscriptionError: '⚠️'
    };
    return icons[type] || '📢';
  };

  return (
    <div style={{ padding: '20px', border: '1px solid #ddd', borderRadius: '8px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
        <h2>Notifications ({allNotifications.length})</h2>
      </div>

      <div>
        {allNotifications.length === 0 ? (
          <p>No notifications yet</p>
        ) : (
          allNotifications.map((notification) => (
            <div key={notification.id} style={{ margin: '10px 0', padding: '15px', backgroundColor: '#f9f9f9', borderRadius: '4px' }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px', fontWeight: 'bold' }}>
                <span style={{ marginRight: '8px' }}>{getIcon(notification.type)}</span>
                <span style={{ flex: 1 }}>{notification.type}</span>
                <span style={{ fontSize: '12px' }}>{notification.timestamp.toLocaleTimeString()}</span>
              </div>
              <pre style={{ fontSize: '12px', margin: 0, backgroundColor: '#f0f0f0', padding: '10px', borderRadius: '4px' }}>
                {JSON.stringify(notification.data, null, 2)}
              </pre>
            </div>
          ))
        )}
      </div>
    </div>
  );
};