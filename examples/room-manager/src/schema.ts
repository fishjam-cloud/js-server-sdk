import { Peer } from '@fishjam-cloud/js-server-sdk';
import { FastifySchema } from 'fastify';
import S from 'fluent-json-schema';

export interface QueryParams {
  roomName: string;
  peerName: string;
}

export interface User {
  username: string;
  room: { id: string; name: string };
  token: string;
  peer: Peer;
}

export interface GetParticipantAccessQueryParams {
  roomName: string;
  peerName: string;
}

export interface ParticipantAccessData {
  peer: { id: string; name: string };
  room: { id: string; name: string };
  peerToken: string;
  // this props should be removed soon, once we migrate to only use peer
  participant: { id: string; name: string };
  participantToken: string;
}

const response200 = S.object()
  .prop('peerToken', S.string().required())
  .prop('url', S.string().required())
  .prop('room', S.object().prop('id', S.string()).prop('name', S.string()))
  .prop('peer', S.object().prop('id', S.string()).prop('name', S.string()))
  // this props should be removed soon, once we migrate to only use peer
  .prop('participant', S.object())
  .prop('participantToken', S.string());

const errorResponse410 = S.object()
  .prop('error', S.string().required())
  .prop('path', S.string())
  .prop('method', S.string());

const errorResponse500 = errorResponse410.prop('cause', S.string());

const parameterSchema = S.object().prop('roomName', S.string().required()).prop('peerName', S.string().required());

export const baseParticipantEndpointSchema: FastifySchema = {
  querystring: parameterSchema,
  operationId: 'getToken',
  response: {
    200: response200,
    410: errorResponse410,
    500: errorResponse500,
  },
  tags: ['room'],
};

export const queryStringParticipantEndpointSchema: FastifySchema = {
  querystring: parameterSchema,
  operationId: 'getToken',
  response: {
    200: response200,
    410: errorResponse410,
    500: errorResponse500,
  },
  tags: ['room'],
};

export const pathParamParticipantEndpointSchema: FastifySchema = {
  params: parameterSchema,
  operationId: 'getToken',
  response: {
    200: response200,
    410: errorResponse410,
    500: errorResponse500,
  },
  tags: ['room'],
};

export const startRecordingSchema = {
  params: S.object().prop('roomName', S.string().required()),
  operationId: 'startRecording',
  tags: ['room'],
};
