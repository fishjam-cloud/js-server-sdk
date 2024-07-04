import S from "fluent-json-schema";

const params = S.object()
  .prop("roomId", S.string().required())
  .prop("userId", S.string().required());

const response200 = S.object()
  .prop("token", S.string().required())
  .prop("url", S.string().required());

const errorResponse410 = S.object()
  .prop("error", S.string().required())
  .prop("path", S.string())
  .prop("method", S.string());

const errorResponse500 = errorResponse410.prop("cause", S.string());

export const peerEndpointSchema = {
  params,
  response: {
    200: response200,
    410: errorResponse410,
    500: errorResponse500,
  },
};

export type QueryParams = {
  roomId: string;
  userId: string;
};
