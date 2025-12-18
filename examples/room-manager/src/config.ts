declare module 'fastify' {
  interface FastifyInstance {
    config: {
      PORT: number;
      MAX_PEERS?: number;
      FISHJAM_ID: string;
      FISHJAM_MANAGEMENT_TOKEN: string;
      ROOM_VIDEO_CODEC: string;
    };
  }
}

export const configSchema = {
  type: 'object',
  required: ['PORT', 'FISHJAM_ID', 'FISHJAM_MANAGEMENT_TOKEN'],
  properties: {
    PORT: {
      type: 'string',
      default: 8080,
    },
    MAX_PEERS: {
      type: 'number',
      default: undefined,
    },
    FISHJAM_ID: {
      type: 'string',
    },
    FISHJAM_MANAGEMENT_TOKEN: {
      type: 'string',
    },
    ROOM_VIDEO_CODEC: {
      type: 'string',
      default: 'vp8',
    },
  },
};
