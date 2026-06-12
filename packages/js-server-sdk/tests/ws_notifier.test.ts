import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ServerMessage, ServerMessage_PeerType } from '@fishjam-cloud/fishjam-proto';
import { FishjamWSNotifier } from '../src/ws_notifier';

const encode = (message: Parameters<typeof ServerMessage.encode>[0]): Uint8Array =>
  ServerMessage.encode(message).finish();

type MessageLike = { data: Uint8Array | ArrayBuffer };

/**
 * Minimal stand-in for the global `WebSocket`: records constructed instances and
 * exposes the handlers the notifier assigns, so a test can drive inbound messages
 * through `dispatchNotification` without a live server.
 */
class FakeWebSocket {
  static instances: FakeWebSocket[] = [];

  binaryType = 'blob';
  onopen: (() => void) | null = null;
  onclose: ((event: { code: number; reason: string }) => void) | null = null;
  onerror: ((event: unknown) => void) | null = null;
  onmessage: ((event: MessageLike) => void) | null = null;
  readonly sent: unknown[] = [];

  constructor(public readonly url: string) {
    FakeWebSocket.instances.push(this);
  }

  send(data: unknown) {
    this.sent.push(data);
  }
}

const config = { fishjamId: 'test-id', managementToken: 'test-token' };
const noop = () => {};

const peerConnected = {
  peerConnected: { roomId: 'room-1', peerId: 'peer-1', peerType: ServerMessage_PeerType.PEER_TYPE_WEBRTC },
} as const;

const createNotifier = () => {
  const notifier = new FishjamWSNotifier(config, noop, noop);
  const socket = FakeWebSocket.instances.at(-1);
  if (!socket) throw new Error('FishjamWSNotifier did not open a WebSocket');
  return { notifier, socket };
};

describe('FishjamWSNotifier.dispatchNotification', () => {
  beforeEach(() => {
    FakeWebSocket.instances = [];
    vi.stubGlobal('WebSocket', FakeWebSocket);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  // Regression for FCE-3373: `emit` used to be called detached from its EventEmitter
  // receiver, so every notification threw on `this._events` and was swallowed by the
  // catch as a misleading "Couldn't decode" error — no handler ever fired.
  it('emits a decoded, mapped notification to a registered handler', () => {
    const { notifier, socket } = createNotifier();
    const handler = vi.fn();
    notifier.on('peerConnected', handler);

    socket.onmessage?.({ data: encode(peerConnected) });

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith(
      expect.objectContaining({ roomId: 'room-1', peerId: 'peer-1', peerType: 'webrtc' })
    );
  });

  it('does not log a decode error for a valid message', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(noop);
    const { notifier, socket } = createNotifier();
    notifier.on('peerConnected', noop);

    socket.onmessage?.({ data: encode(peerConnected) });

    expect(errorSpy).not.toHaveBeenCalled();
  });

  it('unwraps a NotificationBatch, emitting each notification in wire order', () => {
    const { notifier, socket } = createNotifier();
    const events: string[] = [];
    notifier.on('roomCreated', () => events.push('roomCreated'));
    notifier.on('peerConnected', () => events.push('peerConnected'));
    notifier.on('roomDeleted', () => events.push('roomDeleted'));

    socket.onmessage?.({
      data: encode({
        notificationBatch: {
          notifications: [{ roomCreated: { roomId: 'room-1' } }, peerConnected, { roomDeleted: { roomId: 'room-1' } }],
        },
      }),
    });

    expect(events).toEqual(['roomCreated', 'peerConnected', 'roomDeleted']);
  });
});
