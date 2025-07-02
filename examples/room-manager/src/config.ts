declare module 'fastify' {
  interface FastifyInstance {
    config: {
      PORT: number;
      ENABLE_SIMULCAST: boolean;
      MAX_PEERS?: number;
      FISHJAM_URL: string;
      FISHJAM_MANAGEMENT_TOKEN: string;
      ROOM_VIDEO_CODEC: string;
    };
  }
}

export const configSchema = {
  type: 'object',
  required: ['PORT', 'ENABLE_SIMULCAST', 'FISHJAM_URL', 'FISHJAM_MANAGEMENT_TOKEN'],
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
    FISHJAM_URL: {
      type: 'string',
      default: 'http://localhost:5002',
    },
    FISHJAM_MANAGEMENT_TOKEN: {
      type: 'string',
      default: undefined,
    },
    ROOM_VIDEO_CODEC: {
      type: 'string',
      default: 'vp8',
    },
  },
};
