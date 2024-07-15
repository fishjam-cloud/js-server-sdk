import * as WebSocket from 'websocket';
import TypedEmitter from 'typed-emitter';
import { EventEmitter } from 'events';
import { ServerMessage, ServerMessage_EventType } from './proto';
import { FishjamConfig } from './types';

const allowedNotifications = [
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

type onError = (msg: Error) => void;
type onClose = (code: number, reason: string) => void;
type NotificationEvents = Record<(typeof allowedNotifications)[number], (message: ServerMessage) => void>;

export class FishjamWSNotifier extends (EventEmitter as new () => TypedEmitter<NotificationEvents>) {
  private readonly client: WebSocket.client;

  constructor(config: FishjamConfig, onError: onError, onClose: onClose, onConnectionFailed: onError) {
    super();

    this.client = new WebSocket.client();

    const fishjamUrl = `${config.fishjamUrl.replace('http', 'ws')}/socket/server/websocket`;

    this.client.on('connectFailed', (message) => onConnectionFailed(message));
    this.client.on('connect', (connection) => this.setupConnection(connection, config.serverToken, onError, onClose));

    this.client.connect(fishjamUrl);
  }

  private dispatchNotification(message: WebSocket.Message) {
    if (message.type == 'utf8') return;

    try {
      const decodedMessage = ServerMessage.toJSON(ServerMessage.decode(message.binaryData)) as Record<string, any>;
      const [notification] = Object.keys(decodedMessage);

      if (!this.isAllowedNotification(notification)) return;

      this.emit(notification, decodedMessage);
    } catch (e) {
      console.error("Couldn't decode websocket server message.");
      console.error(e);
      console.error(message);
    }
  }

  private setupConnection(connection: WebSocket.connection, serverToken: string, onError: onError, onClose: onClose) {
    const auth = ServerMessage.encode({ authRequest: { token: serverToken } }).finish();
    const subscr = ServerMessage.encode({
      subscribeRequest: { eventType: ServerMessage_EventType.EVENT_TYPE_SERVER_NOTIFICATION },
    }).finish();

    connection.send(auth);
    connection.send(subscr);

    connection.on('message', (message) => this.dispatchNotification(message));
    connection.on('error', (error) => onError(error));
    connection.on('close', (code, reason) => onClose(code, reason));
  }

  private isAllowedNotification(notification: string): notification is (typeof allowedNotifications)[number] {
    return allowedNotifications.includes(notification as (typeof allowedNotifications)[number]);
  }
}
