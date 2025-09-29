declare module 'fastify' {
  interface FastifyInstance {
    config: {
      PORT: number;
      ENABLE_SIMULCAST: boolean;
      MAX_PEERS?: number;
      FISHJAM_ID: string;
      FISHJAM_MANAGEMENT_TOKEN: string;
      ROOM_VIDEO_CODEC: string;
    };
  }
}

export const configSchema = {
  type: 'object',
  required: ['PORT', 'ENABLE_SIMULCAST', 'FISHJAM_ID', 'FISHJAM_MANAGEMENT_TOKEN'],
  properties: {
    PORT: {
      type: 'string',
      default: 8080,
    },
    ENABLE_SIMULCAST: {
      type: 'boolean',
      default: true,
    },
    MAX_PEERS: {
      type: 'number',
      default: undefined,
    },
    FISHJAM_ID: {
      type: 'string',
      required: true,
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
