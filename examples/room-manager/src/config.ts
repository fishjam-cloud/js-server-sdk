export const configSchema = {
  type: 'object',
  required: [
    'PORT',
    'WEBHOOK_URL',
    'ENABLE_SIMULCAST',
    'JELLYFISH_URL',
    'JELLYFISH_SERVER_TOKEN',
    // delete
    'JELLYFISH_HOST',
    'JELLYFISH_PATH',
  ],
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
    JELLYFISH_URL: {
      type: 'string',
      default: 'http://localhost:5002',
    },
    JELLYFISH_SERVER_TOKEN: {
      type: 'string',
      default: 'development',
    },
    // todo delete after jellyfish upgrade
    JELLYFISH_HOST: {
      type: 'string',
      default: 'localhost:5002',
    },
    JELLYFISH_PATH: {
      type: 'string',
      default: '',
    },
  },
};

declare module 'fastify' {
  interface FastifyInstance {
    config: {
      PORT: number;
      WEBHOOK_URL: string;
      PEERLESS_PURGE_TIMEOUT: number | undefined;
      ENABLE_SIMULCAST: boolean;
      MAX_PEERS: number | undefined;
      JELLYFISH_URL: string;
      JELLYFISH_SERVER_TOKEN: string;
      // todo delete after upgrade
      JELLYFISH_HOST: string;
      JELLYFISH_PATH: string;
    };
  }
}
