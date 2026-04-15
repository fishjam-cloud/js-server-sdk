import { describe, it, expect } from 'vitest';
import { FishjamClient } from '../src/client';
import {
  UnauthorizedException,
  RoomNotFoundException,
  PeerNotFoundException,
  FishjamNotFoundException,
} from '../src/exceptions';
import { RoomType } from '@fishjam-cloud/fishjam-openapi';
import type { RoomId, PeerId, StreamId } from '../src/types';

const FISHJAM_ID = process.env.FISHJAM_ID!;
const FISHJAM_MANAGEMENT_TOKEN = process.env.FISHJAM_MANAGEMENT_TOKEN!;

const createClient = (token = FISHJAM_MANAGEMENT_TOKEN) =>
  new FishjamClient({ fishjamId: FISHJAM_ID, managementToken: token });

describe('Authentication', () => {
  it('throws UnauthorizedException with invalid token', async () => {
    const client = createClient('invalid');
    await expect(client.getAllRooms()).rejects.toThrow(UnauthorizedException);
  });

  it('succeeds with valid credentials', async () => {
    const client = createClient();
    const room = await client.createRoom();
    const allRooms = await client.getAllRooms();

    expect(allRooms.some((r) => r.id === room.id)).toBe(true);
  });
});

describe('createRoom', () => {
  it('creates a room with default config', async () => {
    const client = createClient();
    const room = await client.createRoom();

    expect(room.id).toBeTruthy();
    expect(room.peers).toEqual([]);

    const allRooms = await client.getAllRooms();
    expect(allRooms.some((r) => r.id === room.id)).toBe(true);
  });

  it('creates a room with custom maxPeers', async () => {
    const client = createClient();
    const room = await client.createRoom({ maxPeers: 5 });

    expect(room.config.maxPeers).toBe(5);
    expect(room.peers).toEqual([]);
  });
});

describe('deleteRoom', () => {
  it('deletes an existing room', async () => {
    const client = createClient();
    const room = await client.createRoom();

    await client.deleteRoom(room.id);

    const allRooms = await client.getAllRooms();
    expect(allRooms.some((r) => r.id === room.id)).toBe(false);
  });

  it('throws RoomNotFoundException for a non-existent room id', async () => {
    const client = createClient();

    await expect(client.deleteRoom('515c8b52-168b-4b39-a227-4d6b4f102a56' as unknown as RoomId)).rejects.toThrow(
      RoomNotFoundException
    );
  });
});

describe('getAllRooms', () => {
  it('returns an array containing the created room', async () => {
    const client = createClient();
    const room = await client.createRoom();
    const allRooms = await client.getAllRooms();

    expect(Array.isArray(allRooms)).toBe(true);
    expect(allRooms.some((r) => r.id === room.id)).toBe(true);
  });
});

describe('getRoom', () => {
  it('returns the correct room', async () => {
    const client = createClient();
    const room = await client.createRoom();
    const fetchedRoom = await client.getRoom(room.id);

    expect(fetchedRoom.id).toBe(room.id);
    expect(fetchedRoom.peers).toEqual([]);
  });

  it('throws RoomNotFoundException for a non-existent room id', async () => {
    const client = createClient();

    await expect(client.getRoom('515c8b52-168b-4b39-a227-4d6b4f102a56' as unknown as RoomId)).rejects.toThrow(
      RoomNotFoundException
    );
  });
});

describe('createPeer', () => {
  it('creates a peer with default options', async () => {
    const client = createClient();
    const room = await client.createRoom();
    const { peer, peerToken } = await client.createPeer(room.id);

    expect(peer.id).toBeTruthy();
    expect(typeof peerToken).toBe('string');

    const updatedRoom = await client.getRoom(room.id);
    expect(updatedRoom.peers.some((p) => p.id === peer.id)).toBe(true);
  });
});

describe('deletePeer', () => {
  it('removes the peer from the room', async () => {
    const client = createClient();
    const room = await client.createRoom();
    const { peer } = await client.createPeer(room.id);

    await client.deletePeer(room.id, peer.id);

    const updatedRoom = await client.getRoom(room.id);
    expect(updatedRoom.peers).toEqual([]);
  });

  it('throws PeerNotFoundException for an invalid peer id', async () => {
    const client = createClient();
    const room = await client.createRoom();

    await expect(client.deletePeer(room.id, 'invalid-peer-id' as unknown as PeerId)).rejects.toThrow(
      PeerNotFoundException
    );
  });
});

describe('refreshPeerToken', () => {
  it('returns a different token than the original', async () => {
    const client = createClient();
    const room = await client.createRoom();
    const { peer, peerToken } = await client.createPeer(room.id);

    const refreshedToken = await client.refreshPeerToken(room.id, peer.id);

    expect(refreshedToken).not.toBe(peerToken);
  });

  it('throws PeerNotFoundException for an invalid peer id', async () => {
    const client = createClient();
    const room = await client.createRoom();

    await expect(client.refreshPeerToken(room.id, 'invalid-peer-id' as unknown as PeerId)).rejects.toThrow(
      PeerNotFoundException
    );
  });
});

describe('createLivestreamStreamerToken', () => {
  it('returns a token string for a livestream room', async () => {
    const client = createClient();
    const room = await client.createRoom({ roomType: RoomType.Livestream });
    const result = await client.createLivestreamStreamerToken(room.id);

    expect(typeof result.token).toBe('string');
  });

  it('throws FishjamNotFoundException for a non-livestream room', async () => {
    const client = createClient();
    const room = await client.createRoom();

    await expect(client.createLivestreamStreamerToken(room.id)).rejects.toThrow(FishjamNotFoundException);
  });
});

describe('createLivestreamViewerToken', () => {
  it('returns a token string for a public livestream room', async () => {
    const client = createClient();
    const room = await client.createRoom({ roomType: RoomType.Livestream, public: true });
    const result = await client.createLivestreamViewerToken(room.id);

    expect(typeof result.token).toBe('string');
  });

  it('throws FishjamNotFoundException for a non-livestream room', async () => {
    const client = createClient();
    const room = await client.createRoom();

    await expect(client.createLivestreamViewerToken(room.id)).rejects.toThrow(FishjamNotFoundException);
  });
});

describe('createMoqPublisherToken', () => {
  it('returns a token for a valid stream id', async () => {
    const client = createClient();
    const result = await client.createMoqPublisherToken('test-stream' as unknown as StreamId);

    expect(typeof result.token).toBe('string');
  });

  it('throws UnauthorizedException with invalid management token', async () => {
    const client = createClient('invalid');

    await expect(client.createMoqPublisherToken('test-stream' as unknown as StreamId)).rejects.toThrow(
      UnauthorizedException
    );
  });
});

describe('createMoqSubscriberToken', () => {
  it('returns a token for a valid stream id', async () => {
    const client = createClient();
    const result = await client.createMoqSubscriberToken('test-stream' as unknown as StreamId);

    expect(typeof result.token).toBe('string');
  });

  it('throws UnauthorizedException with invalid management token', async () => {
    const client = createClient('invalid');

    await expect(client.createMoqSubscriberToken('test-stream' as unknown as StreamId)).rejects.toThrow(
      UnauthorizedException
    );
  });
});
