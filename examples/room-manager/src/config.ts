export const configSchema = {
  type: 'object',
  required: ['PORT', 'WEBHOOK_URL', 'ENABLE_SIMULCAST', 'FISHJAM_URL', 'FISHJAM_SERVER_TOKEN'],
  properties: {
    PORT: {
      type: 'string',
      default: 8080,
    },
    PEERLESS_PURGE_TIMEOUT: {
      type: 'number',
    },
    WEBHOOK_URL: {
      type: 'string',
      default: 'http://0.0.0.0:8080/webhook',
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
  },
};

declare module 'fastify' {
  interface FastifyInstance {
    config: {
      PORT: number;
      WEBHOOK_URL: string;
      PEERLESS_PURGE_TIMEOUT?: number;
      ENABLE_SIMULCAST: boolean;
      MAX_PEERS?: number;
      FISHJAM_URL: string;
      FISHJAM_SERVER_TOKEN: string;
    };
  }
}
