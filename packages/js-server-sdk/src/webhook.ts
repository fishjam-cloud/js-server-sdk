import { createHmac, timingSafeEqual } from 'node:crypto';

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
 * import { decodeServerNotifications } from '@fishjam-cloud/js-server-sdk';
 *
 * declare const body: Uint8Array;
 * declare const handlePeerConnected: (notification: unknown) => void;
 * // ---cut---
 * for (const { type, notification } of decodeServerNotifications(body)) {
 *   if (type === 'peerConnected') handlePeerConnected(notification);
 * }
 * ```
 * @category Notifications
 */
export const decodeServerNotifications = (data: Uint8Array | ArrayBuffer): ServerNotification[] =>
  extractNotifications(ServerMessage.decode(data instanceof Uint8Array ? data : new Uint8Array(data)));

/**
 * Verify the signature of a raw Fishjam webhook request.
 *
 * Fishjam signs each webhook delivery with the room's signing secret and sends
 * the result in the `x-fishjam-signature-256` header as
 * `sha256=<lowercase hex HMAC-SHA256 of the raw body>`. Pass the raw
 * (undecoded) request body, the header value, and your secret; the comparison
 * is constant-time (signatures of the wrong length are rejected early, which
 * leaks only the expected signature length — public knowledge for SHA-256).
 * Verify before calling {@link decodeServerNotifications}.
 *
 * @example
 * ```ts
 * import { verifyWebhookSignature, decodeServerNotifications } from '@fishjam-cloud/js-server-sdk';
 *
 * declare const body: Uint8Array;
 * declare const signatureHeader: string;
 * // ---cut---
 * if (!verifyWebhookSignature(body, signatureHeader, process.env.WEBHOOK_SECRET!)) {
 *   throw new Error('Invalid webhook signature');
 * }
 * const notifications = decodeServerNotifications(body);
 * ```
 * @category Notifications
 */
export const verifyWebhookSignature = (body: Uint8Array | ArrayBuffer, signature: string, secret: string): boolean => {
  const expected = createHmac('sha256', secret)
    .update(body instanceof Uint8Array ? body : new Uint8Array(body))
    .digest('hex');
  const provided = Buffer.from(signature.trim().replace(/^sha256=/, ''), 'utf8');
  const wanted = Buffer.from(expected, 'utf8');
  return provided.length === wanted.length && timingSafeEqual(provided, wanted);
};
