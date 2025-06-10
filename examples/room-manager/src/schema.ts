import { Peer, type RoomConfigRoomTypeEnum } from '@fishjam-cloud/js-server-sdk';
import { FastifySchema } from 'fastify';
import S from 'fluent-json-schema';

export interface User {
  username: string;
  room: { id: string; name: string };
  token: string;
  peer: Peer;
}

export interface GetPeerAccessQueryParams {
  roomName: string;
  peerName: string;
  roomType: RoomConfigRoomTypeEnum;
}

export interface PeerAccessData {
  peer: { id: string; name: string };
  room: { id: string; name: string };
  peerToken: string;
}

const response200 = S.object()
  .prop('peerToken', S.string().required())
  .prop('url', S.string().required())
  .prop('room', S.object().prop('id', S.string()).prop('name', S.string()))
  .prop('peer', S.object().prop('id', S.string()).prop('name', S.string()));

const baseErrorResponse = S.object()
  .prop('error', S.string().required())
  .prop('path', S.string())
  .prop('method', S.string());

const errorResponse500 = baseErrorResponse.prop('cause', S.string());

const parameterSchema = S.object()
  .prop('roomName', S.string().required())
  .prop('peerName', S.string().required())
  .prop(
    'roomType',
    S.string()
      .enum(['conference', 'audio_only', 'livestream'] satisfies RoomConfigRoomTypeEnum[])
      .default('conference')
  );

export const peerEndpointSchema: FastifySchema = {
  querystring: parameterSchema,
  operationId: 'getToken',
  response: {
    200: response200,
    410: baseErrorResponse,
    500: errorResponse500,
  },
  tags: ['room'],
};

const viewerTokenResponse = S.object().prop('token', S.string());

export const viewerEndpointSchema: FastifySchema = {
  params: S.object().prop('roomName', S.string().required()),
  operationId: 'getBroadcastViewerToken',
  response: {
    200: viewerTokenResponse,
    404: baseErrorResponse,
  },
  tags: ['room'],
};
