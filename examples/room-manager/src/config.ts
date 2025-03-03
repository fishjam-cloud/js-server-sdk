declare module 'fastify' {
  interface FastifyInstance {
    config: {
      PORT: number;
      PEERLESS_PURGE_TIMEOUT?: number;
      ENABLE_SIMULCAST: boolean;
      MAX_PEERS?: number;
      FISHJAM_URL: string;
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
  required: ['PORT', 'ENABLE_SIMULCAST', 'FISHJAM_URL' /*'FISHJAM_MANAGEMENT_TOKEN'*/],
  properties: {
    PORT: {
      type: 'string',
      default: 8080,
    },
    PEERLESS_PURGE_TIMEOUT: {
      type: 'number',
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
    FISHJAM_SERVER_TOKEN: {
      type: 'string',
      default: 'development',
    },
    FISHJAM_MANAGEMENT_TOKEN: {
      type: 'string',
      default: 'development',
    },
    ROOM_VIDEO_CODEC: {
      type: 'string',
      default: 'vp8',
    },
  },
};
