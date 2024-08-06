export const httpToWebsocket = (httpUrl: string) => {
  const url = new URL(httpUrl);

  // note that this will handle http as well as https
  url.protocol = url.protocol.replace('http', 'ws');
  return url.origin;
};
