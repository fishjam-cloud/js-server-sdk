import * as WebSocket from 'websocket';
import TypedEmitter from 'typed-emitter';
import { EventEmitter } from 'events';
import { ServerMessage, ServerMessage_EventType } from './proto';
import { FishjamConfig } from './types';
import { httpToWebsocket } from './utlis';

export type AllowedNotifications =
  | 'roomCreated'
  | 'roomDeleted'
  | 'roomCrashed'
  | 'peerAdded'
  | 'peerDeleted'
  | 'peerConnected'
  | 'peerDisconnected'
  | 'peerMetadataUpdated'
  | 'peerCrashed'
  | 'trackAdded'
  | 'trackRemoved'
  | 'trackMetadataUpdated';

const allowedNotificationsList: ReadonlyArray<AllowedNotifications> = [
  'roomCreated',
  'roomDeleted',
  'roomCrashed',
  'peerAdded',
  'peerDeleted',
  'peerConnected',
  'peerDisconnected',
  'peerMetadataUpdated',
  'peerCrashed',
  'trackAdded',
  'trackRemoved',
  'trackMetadataUpdated',
] as const;

export type ErrorEventHandler = (msg: Error) => void;
export type CloseEventHandler = (code: number, reason: string) => void;
export type NotificationEvents = Record<AllowedNotifications, (message: ServerMessage) => void>;

/**
 * Notifier object that can be used to get notified about various events related to the Fishjam App.
 * @category Client
 */
export class FishjamWSNotifier extends (EventEmitter as new () => TypedEmitter<NotificationEvents>) {
  private readonly client: WebSocket.client;

  constructor(
    config: FishjamConfig,
    onError: ErrorEventHandler,
    onClose: CloseEventHandler,
    onConnectionFailed: ErrorEventHandler
  ) {
    super();

    this.client = new WebSocket.client();

    const fishjamUrl = `${httpToWebsocket(config.fishjamUrl)}/socket/server/websocket`;

    this.client.on('connectFailed', (message) => onConnectionFailed(message));
    this.client.on('connect', (connection) =>
      this.setupConnection(connection, config.managementToken, onError, onClose)
    );

    this.client.connect(fishjamUrl);
  }

  private dispatchNotification(message: WebSocket.Message) {
    if (message.type == 'utf8') {
      console.warn('UTF-8 is an invalid notification type');
      return;
    }

    try {
      const decodedMessage = ServerMessage.toJSON(ServerMessage.decode(message.binaryData)) as Record<string, string>;
      const [notification] = Object.keys(decodedMessage);

      if (!this.isAllowedNotification(notification)) return;

      this.emit(notification, decodedMessage);
    } catch (e) {
      console.error("Couldn't decode websocket server message.");
      console.error(e);
      console.error(message);
    }
  }

  private setupConnection(
    connection: WebSocket.connection,
    serverToken: string,
    onError: ErrorEventHandler,
    onClose: CloseEventHandler
  ) {
    const auth = ServerMessage.encode({ authRequest: { token: serverToken } }).finish();
    const subscription = ServerMessage.encode({
      subscribeRequest: { eventType: ServerMessage_EventType.EVENT_TYPE_SERVER_NOTIFICATION },
    }).finish();

    connection.send(auth);
    connection.send(subscription);

    connection.on('message', (message) => this.dispatchNotification(message));
    connection.on('error', (error) => onError(error));
    connection.on('close', (code, reason) => onClose(code, reason));
  }

  private isAllowedNotification(notification: string): notification is AllowedNotifications {
    return allowedNotificationsList.includes(notification as AllowedNotifications);
  }
}
