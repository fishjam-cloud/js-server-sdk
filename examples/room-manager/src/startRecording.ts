import S from "fluent-json-schema";
import { FastifyInstance } from "fastify";

export interface QueryParams {
  roomName: string;
}

const startRecordingSchema = {
  params: S.object().prop('roomName', S.string().required()),
  operationId: 'startRecording',
  // todo required for generator to generate RoomApi instead of DefaultApi
  tags: ["room"]
};

export async function startRecording(fastify: FastifyInstance) {
  fastify.get<{ Params: QueryParams }>(
    '/api/rooms/:roomName/startRecording',
    { schema: startRecordingSchema },
    async (req, res) => {
      throw new Error("Not yet implemented")
    }
  );
}
