import axios from 'axios';
import {
  BadRequestException,
  FishjamNotFoundException,
  PeerNotFoundException,
  RoomNotFoundException,
  ServiceUnavailableException,
  UnauthorizedException,
} from '.';
type AxiosError = axios.AxiosError<Record<string, string>>;
function isAxiosException(error: unknown): error is AxiosError {
  return !!error && typeof error === 'object' && 'isAxiosError' in error && !!error.isAxiosError;
}

export const raiseExceptions = (error: unknown, entity?: 'peer' | 'room') => {
  if (isAxiosException(error)) {
    switch (error.response?.status) {
      case 400:
        return new BadRequestException(error);
      case 401:
        throw new UnauthorizedException(error);
      case 404:
        switch (entity) {
          case 'peer':
            return new PeerNotFoundException(error);
          case 'room':
            return new RoomNotFoundException(error);
          default:
            return new FishjamNotFoundException(error);
        }

      case 503:
        return new ServiceUnavailableException(error);
    }
  } else return error;
};
