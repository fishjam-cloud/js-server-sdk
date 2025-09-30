import React, { useState } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../config';

interface Peer {
  id: string;
  token: string;
}

interface CreatePeerSectionProps {
  peers: Peer[];
  onPeerCreated: (peer: Peer) => void;
}

export const CreatePeerSection: React.FC<CreatePeerSectionProps> = ({ peers, onPeerCreated }) => {
  const [isCreating, setIsCreating] = useState(false);

  const createPeer = async () => {
    setIsCreating(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/peers`);
      onPeerCreated({ id: response.data.peerId, token: response.data.token });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div style={{ marginBottom: '30px', padding: '20px', border: '1px solid #ddd', borderRadius: '8px' }}>
      <h3>Create Peers</h3>
      <button onClick={createPeer} disabled={isCreating}>
        {isCreating ? 'Creating...' : 'Create New Peer'}
      </button>
      
      <div style={{ marginTop: '20px' }}>
        <h4>Created Peers ({peers.length})</h4>
        {peers.map((peer) => (
          <div key={peer.id} style={{ margin: '10px 0', padding: '10px', backgroundColor: '#f9f9f9', borderRadius: '4px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <strong>ID:</strong> 
              <code style={{ flex: 1 }}>{peer.id}</code>
              <button onClick={() => navigator.clipboard.writeText(peer.id)}>Copy</button>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <strong>Token:</strong>
              <code style={{ flex: 1, fontSize: '11px' }}>{peer.token.substring(0, 40)}...</code>
              <button onClick={() => navigator.clipboard.writeText(peer.token)}>Copy</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};