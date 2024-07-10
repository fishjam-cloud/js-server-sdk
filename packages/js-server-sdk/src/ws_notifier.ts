import * as WebSocket from 'websocket';
import { FishjamConfig, allowedNotification } from './types';
import { ServerMessage } from './proto';

type Listener = (msg: string) => void;
type onError = (msg: Error) => void;
type onClose = (msg: number) => void;

const allowedNotifications: Array<allowedNotification> = [
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

export class FishjamWSNotifier {
  private readonly client: WebSocket.client;
  private notifications: Record<string, Array<Function>>;

  constructor(config: FishjamConfig, onError: onError, onClose: onClose, onConnectionFailed: onError) {
    this.client = new WebSocket.client();
    this.notifications = {};

    const fishjamUrl = config.fishjamUrl.replace('http', 'ws') + '/socket/server/websocket';

    this.client.on('connectFailed', (message) => onConnectionFailed(message));
    this.client.on('connect', (connection) => this.setupConnection(connection, config.serverToken, onError, onClose));

    this.client.connect(fishjamUrl);
  }

  addNotificationListener(notification: allowedNotification, listener: Listener) {
    if (!this.notifications[notification]) {
      this.notifications[notification] = [];
    }
    this.notifications[notification].push(listener);
  }

  removeNotificationListener(notification: allowedNotification, listener: Listener) {
    if (!this.notifications[notification]) return;

    this.notifications[notification] = this.notifications[notification].filter((l) => l !== listener);
  }

  private dispatchNotification(message: WebSocket.Message) {
    if (message.type == 'utf8') return;

    try {
      const decodedMessage = ServerMessage.toJSON(ServerMessage.decode(message.binaryData)) as Record<string, any>;
      const [notification] = Object.keys(decodedMessage);

      if (!this.isAllowedNotification(notification) || !this.notifications[notification]) return;

      this.notifications[notification].forEach((listener) => {
        listener(decodedMessage);
      });
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
