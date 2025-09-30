import { useState } from 'react';
import { CreatePeerSection } from './components/CreatePeerSection';
import { SubscribeToPeerSection } from './components/SubscribeToPeerSection';
import { SubscribeToTracksSection } from './components/SubscribeToTracksSection';
import { NotificationsSection } from './components/NotificationsSection';

interface Notification {
  id: string;
  type: string;
  timestamp: Date;
  data: any;
}

interface Peer {
  id: string;
  token: string;
}

function App() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [peers, setPeers] = useState<Peer[]>([]);

  const addNotification = (type: string, data: any) => {
    setNotifications(prev => [{
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      type, timestamp: new Date(), data
    }, ...prev.slice(0, 49)]);
  };

  const handlePeerCreated = (peer: Peer) => {
    setPeers(prev => [...prev, peer]);
    addNotification('peerCreated', { peerId: peer.id });
  };

    return (
      <div style={{ fontFamily: 'Arial, sans-serif' }}>
      <header style={{ backgroundColor: '#343a40', color: 'white', padding: '20px 0', marginBottom: '30px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>
        <h1>🐟 Fishjam Selective Subscription Dashboard</h1>
        <p>Create peers and test selective subscription features</p>
        <p>
          As a Fishjam client you can use:{' '}
          <a
          href="https://github.com/fishjam-cloud/web-client-sdk/tree/main/examples/react-client"
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: '#ffd700', textDecoration: 'underline' }}
          >
          minimal-react client app
          </a>
        </p>
        </div>
      </header>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
        <div>
        <CreatePeerSection peers={peers} onPeerCreated={handlePeerCreated} />
        <SubscribeToPeerSection peers={peers} onNotification={addNotification} />
        <SubscribeToTracksSection peers={peers} onNotification={addNotification} />
        </div>
        <div>
        <NotificationsSection localNotifications={notifications} />
        </div>
      </div>
      </div>
    );
}

export default App;
