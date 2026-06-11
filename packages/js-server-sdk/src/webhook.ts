import { ServerMessage } from '@fishjam-cloud/fishjam-proto';
import { extractNotifications, ServerNotification } from './notifications';

/**
 * Decode a raw Fishjam webhook body (`application/x-protobuf`) into typed,
 * mapped notifications.
 *
 * A room/stream created with `batchWebhookNotifications: true` may deliver
 * several notifications coalesced into a single `NotificationBatch`; this helper
 * transparently unwraps that batch, so a single message and a batch are handled
 * the same way. Notifications are returned in wire order, with the same payload
 * mapping the {@link FishjamWSNotifier} applies (branded ids, `peerType`/`track`
 * enums). Non-surfaced variants (handshake, deprecated) are omitted.
 *
 * Accepts a Node `Buffer` (a `Uint8Array` subclass), a `Uint8Array`, or an
 * `ArrayBuffer`.
 *
 * @example
 * ```ts
 * for (const { type, notification } of decodeServerNotifications(body)) {
 *   if (type === 'peerConnected') handlePeerConnected(notification);
 * }
 * ```
 * @category Notifications
 */
export const decodeServerNotifications = (data: Uint8Array | ArrayBuffer): ServerNotification[] =>
  extractNotifications(ServerMessage.decode(data instanceof Uint8Array ? data : new Uint8Array(data)));
