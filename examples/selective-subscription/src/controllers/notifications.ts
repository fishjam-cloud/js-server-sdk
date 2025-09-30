import { Elysia } from 'elysia';
import { FishjamService } from '../service/fishjam';

export const notificationsController = (fishjam: FishjamService) =>
  new Elysia().get('/notifications/stream', ({ set }) => {
    set.headers = {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
    };

    return new ReadableStream({
      start(controller) {
        let isConnected = true;

        const handleNotification = (event: CustomEvent) => {
          if (!isConnected) return;
          try {
            const message = JSON.stringify(event.detail);
            controller.enqueue(`data: ${message}\n\n`);
          } catch {
            isConnected = false;
          }
        };

        fishjam.addEventListener('notification', handleNotification as EventListener);

        const heartbeat = setInterval(() => {
          if (!isConnected) return clearInterval(heartbeat);
          try {
            controller.enqueue(`data: ${JSON.stringify({ type: 'heartbeat' })}\n\n`);
          } catch {
            isConnected = false;
            clearInterval(heartbeat);
          }
        }, 30000);

        return () => {
          isConnected = false;
          clearInterval(heartbeat);
          fishjam.removeEventListener('notification', handleNotification as EventListener);
        };
      }
    });
  });