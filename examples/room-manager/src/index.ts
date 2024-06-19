import express, { type RequestHandler } from 'express';
import bodyParser from 'body-parser';

import { ServerMessage } from '@fishjam-cloud/js-server-sdk/proto';

import config from './config';
import { RoomService } from './room_service';

const app = express();

const roomService = new RoomService();

app.get('/rooms/:roomId/users/:userId', (async (req, res) => {
  const { roomId, userId } = req.params;
  const { token, url } = await roomService.findOrCreateUser(roomId, userId);

  res.send({ token, url });
}) as RequestHandler);

app.post('/webhook', bodyParser.raw({ type: 'application/x-protobuf' }), (req, res) => {
  const contentType = req.get('content-type');

  if (contentType === 'application/x-protobuf' && Buffer.isBuffer(req.body)) {
    const message = ServerMessage.decode(req.body);

    roomService.handleFishjamMessage(message);

    res.status(200).send();
  } else {
    console.warn({
      message: `Unexpected message of type ${contentType} received on the webhook endpoint: ${JSON.stringify(req.body)}`,
    });

    res.status(400).send();
  }
});

app.listen(config.port, () => {
  console.log({ message: `Server listening at ${config.port}` });
});
