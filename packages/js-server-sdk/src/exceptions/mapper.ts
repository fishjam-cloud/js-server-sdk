import axios from 'axios';
import {
  BadRequestException,
  FishjamNotFoundException,
  PeerNotFoundException,
  RoomNotFoundException,
  ServiceUnavailableException,
  UnauthorizedException,
  UnknownException,
} from '.';

export const raiseExceptions = (error: axios.AxiosError<any, any>, entity?: 'peer' | 'room') => {
  switch (error.response?.status) {
    case 400:
      throw new BadRequestException(error);
    case 401:
      throw new UnauthorizedException(error);
    case 404:
      switch (entity) {
        case 'peer':
          throw new PeerNotFoundException(error);
        case 'room':
          throw new RoomNotFoundException(error);
        default:
          throw new FishjamNotFoundException(error);
      }
    case 502:
      throw new UnknownException(error);
    case 503:
      throw new ServiceUnavailableException(error);
    default:
      throw new UnknownException(error);
  }
};
