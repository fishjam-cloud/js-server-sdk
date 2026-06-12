import TypedEmitter from 'typed-emitter';
import { EventEmitter } from 'events';
import { CloseEventHandler, ErrorEventHandler, FishjamConfig } from './types';
import { getFishjamUrl, httpToWebsocket } from './utils';
import { ServerMessage, ServerMessage_EventType } from '@fishjam-cloud/fishjam-proto';
import { ExpectedEvents, NotificationEvents, extractNotifications } from './notifications';

/**
 * Notifier object that can be used to get notified about various events related to the Fishjam App.
 * @category Client
 */
export class FishjamWSNotifier extends (EventEmitter as new () => TypedEmitter<NotificationEvents>) {
  private readonly client: WebSocket;

  constructor(config: FishjamConfig, onError: ErrorEventHandler, onClose: CloseEventHandler) {
    super();

    const fishjamUrl = getFishjamUrl(config);
    const websocketUrl = `${httpToWebsocket(fishjamUrl)}/socket/server/websocket`;

    this.client = new WebSocket(websocketUrl);

    this.client.binaryType = 'arraybuffer';

    this.client.onerror = (message) => onError(message);
    this.client.onclose = (message) => onClose(message.code, message.reason);
    this.client.onmessage = (message) => this.dispatchNotification(message);
    this.client.onopen = () => this.setupConnection(config.managementToken);
  }

  private dispatchNotification(message: MessageEvent) {
    try {
      const decodedMessage = ServerMessage.decode(new Uint8Array(message.data));

      // `.bind(this)` keeps emit's receiver (a bare `this.emit` runs with `this === undefined` and throws, FCE-3373); the cast widens the per-event signature TS can't narrow through the union.
      const emit = this.emit.bind(this) as (event: ExpectedEvents, message: unknown) => boolean;

      // `extractNotifications` unwraps any NotificationBatch and applies payload mapping,
      // so a single message and a batch are emitted identically, in wire order.
      for (const { type, notification } of extractNotifications(decodedMessage)) {
        emit(type, notification);
      }
    } catch (e) {
      console.error("Couldn't decode websocket server message", e, message);
    }
  }

  private setupConnection(serverToken: string) {
    const auth = ServerMessage.encode({ authRequest: { token: serverToken } }).finish();
    const subscription = ServerMessage.encode({
      subscribeRequest: { eventType: ServerMessage_EventType.EVENT_TYPE_SERVER_NOTIFICATION },
    }).finish();

    this.client.send(auth);
    this.client.send(subscription);
  }
}
