import { writeFile } from 'node:fs/promises';
import { fastify } from '../src';

const [fileName] = process.argv.slice(2);

(async () => {
  if (fastify.config) {
    fastify.config.FISHJAM_ID = 'dummy_id';
  }
  await fastify.ready();

  if (fastify.swagger === null || fastify.swagger === undefined) {
    throw new Error('@fastify/swagger plugin is not loaded');
  }

  const schema = fastify.swagger({ yaml: true });
  await writeFile(fileName ?? 'openapi.yaml', schema, { flag: 'w+' });

  await fastify.close();
})();
