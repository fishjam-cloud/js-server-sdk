import React, { useState } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../config';

interface Peer {
  id: string;
  token: string;
}

interface SubscribeToTracksSectionProps {
  peers: Peer[];
  onNotification: (type: string, data: any) => void;
}

export const SubscribeToTracksSection: React.FC<SubscribeToTracksSectionProps> = ({ peers, onNotification }) => {
  const [subscriberId, setSubscriberId] = useState('');
  const [tracks, setTracks] = useState('');
  const [isSubscribing, setIsSubscribing] = useState(false);

  const subscribeToTracks = async () => {
    if (!subscriberId || !tracks.trim()) return;
    setIsSubscribing(true);
    try {
      const trackIds = tracks.split(',').map(t => t.trim()).filter(t => t);
      await axios.post(`${API_BASE_URL}/subscribe_tracks?subId=${subscriberId}&tracks=${trackIds.join(',')}`);
      onNotification('tracksSubscribed', { subscriberId, tracks: trackIds });
    } finally {
      setIsSubscribing(false);
    }
  };

  return (
    <div style={{ marginBottom: '30px', padding: '20px', border: '1px solid #ddd', borderRadius: '8px' }}>
      <h3>Subscribe to Specific Tracks</h3>
      
      <div style={{ marginBottom: '15px' }}>
        <label>Subscriber Peer:</label>
        <select value={subscriberId} onChange={(e) => setSubscriberId(e.target.value)}>
          <option value="">Select subscriber...</option>
          {peers.map(peer => (
            <option key={peer.id} value={peer.id}>{peer.id}</option>
          ))}
        </select>
      </div>
      
      <div style={{ marginBottom: '15px' }}>
        <label>Track IDs (comma-separated):</label>
        <input
          type="text"
          placeholder="track1,track2,track3..."
          value={tracks}
          onChange={(e) => setTracks(e.target.value)}
        />
      </div>
      
      <button onClick={subscribeToTracks} disabled={isSubscribing || !subscriberId || !tracks.trim()}>
        {isSubscribing ? 'Subscribing...' : 'Subscribe to Tracks'}
      </button>
    </div>
  );
};