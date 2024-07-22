import { Peer } from '@fishjam-cloud/js-server-sdk';
import S from 'fluent-json-schema';

export interface QueryParams {
  roomName: string;
  username: string;
}

export interface User {
  username: string;
  room: { id: string; name: string };
  token: string;
  peer: Peer;
}

const params = S.object()
  .prop('roomName', S.string().required())
  .prop('username', S.string().required());

const response200 = S.object()
  .prop('token', S.string().required())
  .prop('url', S.string().required())
  .prop('room', S.object().prop('id', S.string()).prop('name', S.string()))
  .prop('username', S.string())
  .prop('peer', S.object().prop('id', S.string()));

const errorResponse410 = S.object()
  .prop('error', S.string().required())
  .prop('path', S.string())
  .prop('method', S.string());

const errorResponse500 = errorResponse410.prop('cause', S.string());

export const peerEndpointSchema = {
  params,
  operationId: 'getToken',
  response: {
    200: response200,
    410: errorResponse410,
    500: errorResponse500,
  },
};
