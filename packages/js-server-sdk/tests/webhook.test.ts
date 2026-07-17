import { createHmac } from 'node:crypto';

import { describe, it, expect } from 'vitest';
import { ServerMessage, ServerMessage_PeerType, TrackType } from '@fishjam-cloud/fishjam-proto';
import { decodeServerNotifications, verifyWebhookSignature } from '../src/webhook';

const encode = (message: Parameters<typeof ServerMessage.encode>[0]): Uint8Array =>
  ServerMessage.encode(message).finish();

const peerConnected = {
  peerConnected: { roomId: 'room-1', peerId: 'peer-1', peerType: ServerMessage_PeerType.PEER_TYPE_WEBRTC },
} as const;

const trackAdded = {
  trackAdded: {
    roomId: 'room-1',
    peerId: 'peer-1',
    track: { id: 'track-1', type: TrackType.TRACK_TYPE_VIDEO, metadata: '{}' },
  },
} as const;

describe('decodeServerNotifications', () => {
  it('decodes a single non-batch notification with payload mapping applied', () => {
    const result = decodeServerNotifications(encode(peerConnected));

    expect(result).toHaveLength(1);
    const [notification] = result;
    expect(notification.type).toBe('peerConnected');
    if (notification.type !== 'peerConnected') throw new Error('unreachable');
    // enum -> user-facing string union
    expect(notification.notification.peerType).toBe('webrtc');
    expect(notification.notification.roomId).toBe('room-1');
    expect(notification.notification.peerId).toBe('peer-1');
  });

  it('maps the embedded track of a trackAdded notification', () => {
    const [notification] = decodeServerNotifications(encode(trackAdded));

    expect(notification.type).toBe('trackAdded');
    if (notification.type !== 'trackAdded') throw new Error('unreachable');
    expect(notification.notification.track).toEqual({ id: 'track-1', type: 'video', metadata: '{}' });
  });

  it('unwraps a NotificationBatch into its elements, preserving order', () => {
    const batch = encode({
      notificationBatch: {
        notifications: [{ roomCreated: { roomId: 'room-1' } }, peerConnected, { roomDeleted: { roomId: 'room-1' } }],
      },
    });

    const result = decodeServerNotifications(batch);

    expect(result.map((n) => n.type)).toEqual(['roomCreated', 'peerConnected', 'roomDeleted']);
  });

  it('drops non-surfaced variants from a batch but keeps the surfaced ones', () => {
    const batch = encode({
      notificationBatch: {
        notifications: [
          { subscribeResponse: { eventType: 0 } }, // handshake — ignored
          peerConnected,
          { hlsPlayable: { roomId: 'room-1', componentId: 'comp-1' } }, // deprecated — ignored
        ],
      },
    });

    const result = decodeServerNotifications(batch);

    expect(result.map((n) => n.type)).toEqual(['peerConnected']);
  });

  it('drops a nested batch element (documented protocol violation)', () => {
    const batch = encode({
      notificationBatch: {
        notifications: [peerConnected, { notificationBatch: { notifications: [trackAdded] } }],
      },
    });

    const result = decodeServerNotifications(batch);

    expect(result.map((n) => n.type)).toEqual(['peerConnected']);
  });

  it('returns an empty array for an empty / unrecognized message', () => {
    expect(decodeServerNotifications(encode({}))).toEqual([]);
    expect(decodeServerNotifications(encode({ subscribeResponse: { eventType: 0 } }))).toEqual([]);
  });

  it('accepts Buffer, Uint8Array, and ArrayBuffer input', () => {
    const bytes = encode(peerConnected);
    // Copy into a standalone ArrayBuffer (encode may return a view over a larger pooled buffer).
    const arrayBuffer = new Uint8Array(bytes).buffer as ArrayBuffer;

    expect(decodeServerNotifications(bytes)).toHaveLength(1); // Uint8Array
    expect(decodeServerNotifications(Buffer.from(bytes))).toHaveLength(1); // Buffer (Uint8Array subclass)
    expect(decodeServerNotifications(arrayBuffer)).toHaveLength(1); // ArrayBuffer
  });
});

describe('verifyWebhookSignature', () => {
  const secret = 'test-secret';
  const body = encode(peerConnected);
  // Mirrors the server: Base.encode16(:crypto.mac(:hmac, :sha256, secret, body), case: :lower)
  const validHex = createHmac('sha256', secret).update(body).digest('hex');

  it('accepts the sha256=<hex> header format sent by the server', () => {
    expect(verifyWebhookSignature(body, `sha256=${validHex}`, secret)).toBe(true);
  });

  it('accepts a bare hex signature and an ArrayBuffer body', () => {
    const arrayBuffer = new Uint8Array(body).buffer as ArrayBuffer;
    expect(verifyWebhookSignature(arrayBuffer, validHex, secret)).toBe(true);
  });

  it('rejects a signature computed with a different secret', () => {
    const other = createHmac('sha256', 'other-secret').update(body).digest('hex');
    expect(verifyWebhookSignature(body, `sha256=${other}`, secret)).toBe(false);
  });

  it('rejects a tampered body', () => {
    expect(verifyWebhookSignature(encode(trackAdded), `sha256=${validHex}`, secret)).toBe(false);
  });

  it('rejects malformed signatures without throwing', () => {
    expect(verifyWebhookSignature(body, '', secret)).toBe(false);
    expect(verifyWebhookSignature(body, 'sha256=deadbeef', secret)).toBe(false);
  });
});
