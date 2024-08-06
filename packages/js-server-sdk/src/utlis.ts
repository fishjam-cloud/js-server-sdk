export const httpToWebsocket = (url: string) => {
  const [protocol, rest] = url.split('://');

  // note that this will handle http as well as https
  return `${protocol.replace('http', 'ws')}://${rest}`;
};
