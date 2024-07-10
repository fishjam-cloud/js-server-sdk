import * as WebSocket from 'websocket';
import TypedEmitter from 'typed-emitter';
import { EventEmitter } from 'events';
import { ServerMessage } from './proto';
import { FishjamConfig, NotificationEvents } from './types';

type onError = (msg: Error) => void;
type onClose = (msg: number) => void;

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
];

export class FishjamWSNotifier extends (EventEmitter as new () => TypedEmitter<NotificationEvents>) {
  private readonly client: WebSocket.client;

  constructor(config: FishjamConfig, onError: onError, onClose: onClose, onConnectionFailed: onError) {
    super();

    this.client = new WebSocket.client();

    const fishjamUrl = config.fishjamUrl.replace('http', 'ws') + '/socket/server/websocket';

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

      this.emit(notification as keyof NotificationEvents, decodedMessage);
    } catch (e) {
      console.error("Couldn't decode websocket server message.");
      console.error(e);
      console.error(message);
    }
  }

  private setupConnection(connection: WebSocket.connection, serverToken: string, onError: onError, onClose: onClose) {
    const auth = ServerMessage.encode({ authRequest: { token: serverToken } }).finish();
    const subscr = ServerMessage.encode({ subscribeRequest: { eventType: 1 } }).finish();

    connection.send(auth);
    connection.send(subscr);

    connection.on('message', (message) => this.dispatchNotification(message));
    connection.on('error', (message) => onError(message));
    connection.on('close', (message) => onClose(message));
  }

  private isAllowedNotification(notification: string): boolean {
    return (allowedNotifications as string[]).includes(notification);
  }
}
