import { writeFile } from 'node:fs/promises';
import { fastify } from '../src';


(async () => {
  await fastify.ready();

  if (fastify.swagger === null || fastify.swagger === undefined) {
    throw new Error('@fastify/swagger plugin is not loaded');
  }

  const schema = fastify.swagger({ yaml: true })
  await writeFile('openapi.yaml', schema, { flag: 'w+' });

  await fastify.close();
})()
