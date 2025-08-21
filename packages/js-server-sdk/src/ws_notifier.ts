import TypedEmitter from 'typed-emitter';
import { EventEmitter } from 'events';
import { CloseEventHandler, ErrorEventHandler, FishjamConfig, RoomId } from './types';
import { getFishjamUrl, httpToWebsocket } from './utils';
import { ServerMessage, ServerMessage_EventType } from '@fishjam-cloud/fishjam-proto';

export type ExpectedEvents =
  | 'roomCreated'
  | 'roomDeleted'
  | 'roomCrashed'
  | 'peerAdded'
  | 'peerDeleted'
  | 'peerConnected'
  | 'peerDisconnected'
  | 'peerMetadataUpdated'
  | 'peerCrashed'
  | 'streamConnected'
  | 'streamDisconnected'
  | 'viewerConnected'
  | 'viewerDisconnected'
  | 'trackAdded'
  | 'trackRemoved'
  | 'trackMetadataUpdated';

type Notifications = { [K in ExpectedEvents]: NonNullable<ServerMessage[K]> };

export type RoomCreated = Notifications['roomCreated'];
export type RoomDeleted = Notifications['roomDeleted'];
export type RoomCrashed = Notifications['roomCrashed'];
export type PeerAdded = Notifications['peerAdded'];
export type PeerDeleted = Notifications['peerDeleted'];
export type PeerConnected = Notifications['peerConnected'];
export type PeerDisconnected = Notifications['peerDisconnected'];
export type PeerMetadataUpdated = Notifications['peerMetadataUpdated'];
export type PeerCrashed = Notifications['peerCrashed'];
export type StreamConnected = Notifications['streamConnected'];
export type StreamDisconnected = Notifications['streamDisconnected'];
export type ViewerConnected = Notifications['viewerConnected'];
export type ViewerDisconnected = Notifications['viewerDisconnected'];
export type TrackAdded = Notifications['trackAdded'];
export type TrackRemoved = Notifications['trackRemoved'];
export type TrackMetadataUpdated = Notifications['trackMetadataUpdated'];

const expectedEventsList: ReadonlyArray<ExpectedEvents> = [
  'roomCreated',
  'roomDeleted',
  'roomCrashed',
  'peerAdded',
  'peerDeleted',
  'peerConnected',
  'peerDisconnected',
  'peerMetadataUpdated',
  'peerCrashed',
  'streamConnected',
  'streamDisconnected',
  'viewerConnected',
  'viewerDisconnected',
  'trackAdded',
  'trackRemoved',
  'trackMetadataUpdated',
] as const;

export type NotificationEvents = { [K in ExpectedEvents]: (message: NonNullable<ServerMessage[K]>) => void };

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

    this.client.onerror = (message) => onError(message);
    this.client.onclose = (message) => onClose(message.code, message.reason);
    this.client.onmessage = (message) => this.dispatchNotification(message);
    this.client.onopen = () => this.setupConnection(config.managementToken);
  }

  private dispatchNotification(message: MessageEvent) {
    try {
      const decodedMessage = ServerMessage.decode(message.data);
      const [[notification, msg]] = Object.entries(decodedMessage).filter(([_k, v]) => v != null);

      if (!this.isExpectedEvent(notification)) return;

      this.emit(notification, msg);
    } catch (e) {
      console.error("Couldn't decode websocket server message.");
      console.error(e);
      console.error(message);
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
