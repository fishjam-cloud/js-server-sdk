import {
  BadRequestException,
  PeerNotFoundException,
  RoomNotFoundException,
  ServiceUnavailableException,
  UnauthorizedException,
} from '.';

export const raisePossibleExceptions = (code: number, entity?: 'peer' | 'room') => {
  switch (code) {
    case 400:
      throw new BadRequestException();
    case 401:
      throw new UnauthorizedException();
    case 404:
      switch (entity) {
        case 'peer':
          throw new PeerNotFoundException();
        case 'room':
          throw new RoomNotFoundException();
        default:
          return;
      }
    case 503:
      throw new ServiceUnavailableException();
    default:
      return;
  }
};
