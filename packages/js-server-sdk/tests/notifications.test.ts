import { describe, it, expect, expectTypeOf } from 'vitest';
import {
  ServerMessage,
  ServerMessage_VadNotification_Status,
  TrackType as ProtoTrackType,
} from '@fishjam-cloud/fishjam-proto';
import {
  expectedEventsList,
  ignoredEventsList,
  mapNotification,
  peerEventsWithPeerType,
  trackEvents,
} from '../src/notifications';
import type {
  ExpectedEvents,
  IgnoredEvents,
  Notifications,
  TrackForwarding,
  ServerNotification,
  VadNotification,
} from '../src/notifications';
import type * as SDK from '../src';

//    Compile-time completeness: every `ServerMessage` oneof must be classified
//    as either an ExpectedEvents or IgnoredEvents member. If a new oneof is
//    added, this line fails to compile with the offending name literally in
//    the error.
type Unaccounted = Exclude<keyof ServerMessage, ExpectedEvents | IgnoredEvents>;
const _exhaustive: [Unaccounted] extends [never] ? true : Unaccounted = true as [Unaccounted] extends [never]
  ? true
  : Unaccounted;
void _exhaustive;

//    Mapping-set coverage (compile-time): if someone adds a new peerType- or
//    track-carrying event to ExpectedEvents, the runtime required[] below
//    will fail to satisfy the computed key set.
type EventsWithPeerTypeField = {
  [K in ExpectedEvents]: Notifications[K] extends { peerType: unknown } ? K : never;
}[ExpectedEvents];

type EventsWithTrackField = {
  [K in ExpectedEvents]: Notifications[K] extends { track?: unknown } ? K : never;
}[ExpectedEvents];

describe('notifications module', () => {
  it('ExpectedEvents and IgnoredEvents are disjoint', () => {
    const ignored = ignoredEventsList as readonly string[];
    const overlap = expectedEventsList.filter((e) => ignored.includes(e));
    expect(overlap).toEqual([]);
  });

  it('every ExpectedEvents member is surfaced as a named type export', () => {
    expectTypeOf<SDK.RoomCreated>().toEqualTypeOf<Notifications['roomCreated']>();
    expectTypeOf<SDK.PeerAdded>().toEqualTypeOf<Notifications['peerAdded']>();
    expectTypeOf<SDK.PeerDeleted>().toEqualTypeOf<Notifications['peerDeleted']>();
    expectTypeOf<SDK.PeerConnected>().toEqualTypeOf<Notifications['peerConnected']>();
    expectTypeOf<SDK.PeerDisconnected>().toEqualTypeOf<Notifications['peerDisconnected']>();
    expectTypeOf<SDK.PeerMetadataUpdated>().toEqualTypeOf<Notifications['peerMetadataUpdated']>();
    expectTypeOf<SDK.PeerCrashed>().toEqualTypeOf<Notifications['peerCrashed']>();
    expectTypeOf<SDK.RoomDeleted>().toEqualTypeOf<Notifications['roomDeleted']>();
    expectTypeOf<SDK.RoomCrashed>().toEqualTypeOf<Notifications['roomCrashed']>();
    expectTypeOf<SDK.StreamerConnected>().toEqualTypeOf<Notifications['streamerConnected']>();
    expectTypeOf<SDK.StreamerDisconnected>().toEqualTypeOf<Notifications['streamerDisconnected']>();
    expectTypeOf<SDK.ViewerConnected>().toEqualTypeOf<Notifications['viewerConnected']>();
    expectTypeOf<SDK.ViewerDisconnected>().toEqualTypeOf<Notifications['viewerDisconnected']>();
    expectTypeOf<SDK.TrackAdded>().toEqualTypeOf<Notifications['trackAdded']>();
    expectTypeOf<SDK.TrackRemoved>().toEqualTypeOf<Notifications['trackRemoved']>();
    expectTypeOf<SDK.TrackMetadataUpdated>().toEqualTypeOf<Notifications['trackMetadataUpdated']>();
    expectTypeOf<SDK.ChannelAdded>().toEqualTypeOf<Notifications['channelAdded']>();
    expectTypeOf<SDK.ChannelRemoved>().toEqualTypeOf<Notifications['channelRemoved']>();
    expectTypeOf<SDK.TrackForwarding>().toEqualTypeOf<Notifications['trackForwarding']>();
    expectTypeOf<SDK.TrackForwardingRemoved>().toEqualTypeOf<Notifications['trackForwardingRemoved']>();
    expectTypeOf<SDK.VadNotification>().toEqualTypeOf<Notifications['vadNotification']>();
  });

  it('trackForwarding and vadNotification are expected, not ignored', () => {
    for (const event of ['trackForwarding', 'trackForwardingRemoved', 'vadNotification'] as const) {
      expect(expectedEventsList).toContain(event);
      expect(ignoredEventsList as readonly string[]).not.toContain(event);
    }
  });

  it('maps trackForwarding tracks to friendly track types, keeping metadata as a JSON string', () => {
    const encoded = ServerMessage.encode({
      trackForwarding: {
        roomId: 'r1',
        peerId: 'p1',
        compositionUrl: 'url',
        inputId: 'in1',
        audioTrack: { id: 'a1', type: ProtoTrackType.TRACK_TYPE_AUDIO, metadata: '{"type":"camera"}' },
        videoTrack: { id: 'v1', type: ProtoTrackType.TRACK_TYPE_VIDEO, metadata: '{"type":"camera"}' },
      },
    }).finish();
    const { trackForwarding } = ServerMessage.decode(encoded);
    const mapped = mapNotification('trackForwarding', trackForwarding) as TrackForwarding;

    expect(mapped.audioTrack).toEqual({ id: 'a1', type: 'audio', metadata: '{"type":"camera"}' });
    expect(mapped.videoTrack).toEqual({ id: 'v1', type: 'video', metadata: '{"type":"camera"}' });
    expect(mapped.inputId).toBe('in1');
  });

  it('maps vadNotification status to the friendly union', () => {
    const speech = ServerMessage.decode(
      ServerMessage.encode({
        vadNotification: {
          roomId: 'r1',
          peerId: 'p1',
          trackId: 'a1',
          status: ServerMessage_VadNotification_Status.STATUS_SPEECH,
        },
      }).finish()
    ).vadNotification;
    expect((mapNotification('vadNotification', speech) as VadNotification).status).toBe('speech');

    const silence = ServerMessage.decode(
      ServerMessage.encode({
        vadNotification: {
          roomId: 'r1',
          peerId: 'p1',
          trackId: 'a1',
          status: ServerMessage_VadNotification_Status.STATUS_SILENCE,
        },
      }).finish()
    ).vadNotification;
    expect((mapNotification('vadNotification', silence) as VadNotification).status).toBe('silence');
  });

  it('maps unspecified and unrecognized vad statuses to silence', () => {
    const unspecified = ServerMessage.decode(
      ServerMessage.encode({
        vadNotification: {
          roomId: 'r1',
          peerId: 'p1',
          trackId: 'a1',
          status: ServerMessage_VadNotification_Status.STATUS_UNSPECIFIED,
        },
      }).finish()
    ).vadNotification;
    expect((mapNotification('vadNotification', unspecified) as VadNotification).status).toBe('silence');

    const unrecognized = {
      roomId: 'r1',
      peerId: 'p1',
      trackId: 'a1',
      status: ServerMessage_VadNotification_Status.UNRECOGNIZED,
    };
    expect((mapNotification('vadNotification', unrecognized) as VadNotification).status).toBe('silence');
  });

  it('peerEventsWithPeerType covers all ExpectedEvents with a peerType field', () => {
    const required: EventsWithPeerTypeField[] = [
      'peerAdded',
      'peerDeleted',
      'peerConnected',
      'peerDisconnected',
      'peerMetadataUpdated',
      'peerCrashed',
    ];
    for (const event of required) {
      expect(peerEventsWithPeerType.has(event)).toBe(true);
    }
  });

  it('trackEvents covers all ExpectedEvents with a track field', () => {
    const required: EventsWithTrackField[] = ['trackAdded', 'trackRemoved', 'trackMetadataUpdated'];
    for (const event of required) {
      expect(trackEvents.has(event)).toBe(true);
    }
  });

  it("ServerNotification's discriminant covers exactly ExpectedEvents", () => {
    expectTypeOf<ServerNotification['type']>().toEqualTypeOf<ExpectedEvents>();
  });
});
