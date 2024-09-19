import axios from 'axios';

export class FishjamBaseException extends Error {
  statusCode: number;
  constructor(error: axios.AxiosError<Record<string, string>>) {
    super(error.response?.data['detail'] ?? error.response?.data['errors'] ?? 'Unknown error');
    this.statusCode = error.response?.status ?? 500;
  }
}

export class BadRequestException extends FishjamBaseException {}

export class UnauthorizedException extends FishjamBaseException {}

export class ForbiddenException extends FishjamBaseException {}

export class RoomNotFoundException extends FishjamBaseException {}

export class FishjamNotFoundException extends FishjamBaseException {}

export class ParticipantNotFoundException extends FishjamBaseException {}

export class ServiceUnavailableException extends FishjamBaseException {}

export class UnknownException extends FishjamBaseException {}
