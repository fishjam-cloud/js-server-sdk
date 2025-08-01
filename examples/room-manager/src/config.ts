declare module 'fastify' {
  interface FastifyInstance {
    config: {
      PORT: number;
      ENABLE_SIMULCAST: boolean;
      MAX_PEERS?: number;
      FISHJAM_ID?: string;
      FISHJAM_URL?: string;
      FISHJAM_SERVER_TOKEN?: string;
      // TODO[FCE-1283] make this param required
      FISHJAM_MANAGEMENT_TOKEN?: string;
      ROOM_VIDEO_CODEC: string;
    };
  }
}

export const configSchema = {
  type: 'object',
  // TODO[FCE-1283] uncomment FISHJAM_MANAGEMENT_TOKEN
  required: ['PORT', 'ENABLE_SIMULCAST' /*'FISHJAM_MANAGEMENT_TOKEN'*/],
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
      default: undefined,
    },
    FISHJAM_URL: {
      type: 'string',
      default: undefined,
    },
    FISHJAM_SERVER_TOKEN: {
      type: 'string',
      default: undefined,
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
