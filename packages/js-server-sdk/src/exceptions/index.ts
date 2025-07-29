import axios from 'axios';

export class MissingFishjamIdException extends Error {
  constructor() {
    super('Fishjam ID is required');
  }
}

export class FishjamBaseException extends Error {
  statusCode: number;
  axiosCode?: string;
  details?: string;
  constructor(error: axios.AxiosError<Record<string, string>>) {
    super(error.message);
    this.statusCode = error.response?.status ?? 500;
    this.axiosCode = error.code;
    this.details = error.response?.data['detail'] ?? error.response?.data['errors'] ?? 'Unknown error';
  }
}

export class BadRequestException extends FishjamBaseException {}

export class UnauthorizedException extends FishjamBaseException {}

export class ForbiddenException extends FishjamBaseException {}

export class RoomNotFoundException extends FishjamBaseException {}

export class FishjamNotFoundException extends FishjamBaseException {}

export class PeerNotFoundException extends FishjamBaseException {}

export class ServiceUnavailableException extends FishjamBaseException {}

export class UnknownException extends FishjamBaseException {}
