import TypedEmitter from 'typed-emitter';
import { EventEmitter } from 'events';
import { CloseEventHandler, ErrorEventHandler, FishjamConfig } from './types';
import { getFishjamUrl, httpToWebsocket } from './utils';
import { ServerMessage, ServerMessage_EventType } from '@fishjam-cloud/fishjam-proto';
import { ExpectedEvents, NotificationEvents, expectedEventsList, mapNotification } from './notifications';

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
      const data = new Uint8Array(message.data);
      const decodedMessage = ServerMessage.decode(data);
      const [notification, msg] = Object.entries(decodedMessage).find(([_k, v]) => v)!;

      if (!this.isExpectedEvent(notification)) return;

      // TS can't narrow per-event through Object.entries, so widen emit's signature at the call site.
      const emit = this.emit as (event: ExpectedEvents, message: unknown) => boolean;
      emit(notification, mapNotification(notification, msg));
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

  private isExpectedEvent(notification: string): notification is ExpectedEvents {
    return expectedEventsList.includes(notification as ExpectedEvents);
  }
}
