import type { AxiosError as BaseAxiosError } from 'axios';
import {
  BadRequestException,
  FishjamNotFoundException,
  InvalidFishjamCredentialsException,
  PeerNotFoundException,
  QuotaExceededException,
  RoomNotFoundException,
  ServiceUnavailableException,
  UnauthorizedException,
  UnknownException,
} from '.';
type AxiosError = BaseAxiosError<Record<string, string>>;
function isAxiosException(error: unknown): error is AxiosError {
  return !!error && typeof error === 'object' && 'isAxiosError' in error && !!error.isAxiosError;
}

export const mapException = (error: unknown, entity?: 'peer' | 'room') => {
  if (isAxiosException(error)) {
    switch (error.response?.status) {
      case 400:
        return new BadRequestException(error);
      case 402:
        return new QuotaExceededException(error);
      case 401:
        throw new UnauthorizedException(error);
      case 404:
        if (error.request.path.includes('validate')) {
          return new InvalidFishjamCredentialsException(error);
        }

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
      default:
        return new UnknownException(error);
    }
  } else {
    return error;
  }
};
