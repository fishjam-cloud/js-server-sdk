import React, { useState } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../config';

interface Peer {
  id: string;
  token: string;
}

interface SubscribeToPeerSectionProps {
  peers: Peer[];
  onNotification: (type: string, data: any) => void;
}

export const SubscribeToPeerSection: React.FC<SubscribeToPeerSectionProps> = ({ peers, onNotification }) => {
  const [subscriberId, setSubscriberId] = useState('');
  const [producerId, setProducerId] = useState('');
  const [isSubscribing, setIsSubscribing] = useState(false);

  const subscribeToPeer = async () => {
    if (!subscriberId || !producerId) return;
    setIsSubscribing(true);
    try {
      await axios.post(`${API_BASE_URL}/subscribe_peer?subId=${subscriberId}&prodId=${producerId}`);
      onNotification('peerSubscribed', { subscriberId, producerId });
    } finally {
      setIsSubscribing(false);
    }
  };

  return (
    <div style={{ marginBottom: '30px', padding: '20px', border: '1px solid #ddd', borderRadius: '8px' }}>
      <h3>Subscribe to All Peer Tracks</h3>

      <div style={{ marginBottom: '15px' }}>
        <label>Subscriber Peer:</label>
        <select value={subscriberId} onChange={(e) => setSubscriberId(e.target.value)}>
          <option value="">Select subscriber...</option>
          {peers.map((peer) => (
            <option key={peer.id} value={peer.id}>
              {peer.id}
            </option>
          ))}
        </select>
      </div>

      <div style={{ marginBottom: '15px' }}>
        <label>Producer Peer:</label>
        <select value={producerId} onChange={(e) => setProducerId(e.target.value)}>
          <option value="">Select producer...</option>
          {peers
            .filter((peer) => peer.id !== subscriberId)
            .map((peer) => (
              <option key={peer.id} value={peer.id}>
                {peer.id}
              </option>
            ))}
        </select>
      </div>

      <button onClick={subscribeToPeer} disabled={isSubscribing || !subscriberId || !producerId}>
        {isSubscribing ? 'Subscribing...' : 'Subscribe to All Tracks'}
      </button>
    </div>
  );
};
