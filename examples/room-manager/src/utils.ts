export const removeTrailingSlash = (href: string) => (href.endsWith('/') ? href.slice(0, -1) : href);

export const httpToWebsocket = (httpUrl: string) => {
  const url = new URL(httpUrl);
  // note that this will handle http as well as https
  url.protocol = url.protocol.replace('http', 'ws');
  return url.href;
};
