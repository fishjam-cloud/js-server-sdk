import axios from 'axios';

type RoomManagerError = {
  error:
    | 'Cannot connect to the FishJam instance'
    | 'Cannot authorize with the FishJam instance'
    | 'Invalid request structure sent to the FishJam instance'
    | 'Unknown error when connecting to the FishJam instance'
    | "Room doesn't exist"
    | 'Peer limit has been reached'
    | 'Internal server error';
  cause?: unknown;
  path?: string;
  method?: string;
};

export function parseError(error: unknown): [RoomManagerError, number] {
  let parsedError: RoomManagerError;

  let errorCode = 500;

  if (axios.isAxiosError(error)) {
    let errorMessage: RoomManagerError['error'];

    const statusCode = error.status ?? error.response?.status;

    if (!statusCode) {
      errorMessage = 'Cannot connect to the FishJam instance';
    } else if (statusCode === 404) {
      errorMessage = "Room doesn't exist";
    } else if (statusCode === 401) {
      errorMessage = 'Cannot authorize with the FishJam instance';
    } else if (statusCode === 400) {
      errorMessage = 'Invalid request structure sent to the FishJam instance';
    } else if (statusCode === 503) {
      errorMessage = 'Peer limit has been reached';
      errorCode = 410;
    } else {
      errorMessage = 'Unknown error when connecting to the FishJam instance';
    }

    parsedError = {
      error: errorMessage,
      path: error.config?.url,
      method: error.config?.method,
    };
  } else {
    parsedError = {
      error: 'Internal server error',
      cause: error,
    };
  }
  return [parsedError, errorCode];
}
