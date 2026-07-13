export class MissingFishjamIdException extends Error {
  constructor() {
    super('Fishjam ID is required');
  }
}

export interface FishjamExceptionInfo {
  message: string;
  statusCode?: number;
  details?: string;
}

export class FishjamBaseException extends Error {
  statusCode: number;
  details?: string;
  constructor(info: FishjamExceptionInfo) {
    super(info.message);
    this.statusCode = info.statusCode ?? 500;
    this.details = info.details;
  }
}

export class BadRequestException extends FishjamBaseException {}

export class UnauthorizedException extends FishjamBaseException {}

export class ForbiddenException extends FishjamBaseException {}

export class RoomNotFoundException extends FishjamBaseException {}

export class FishjamNotFoundException extends FishjamBaseException {}

export class InvalidFishjamCredentialsException extends FishjamBaseException {}

export class PeerNotFoundException extends FishjamBaseException {}

export class ServiceUnavailableException extends FishjamBaseException {}

export class QuotaExceededException extends FishjamBaseException {}

export class UnknownException extends FishjamBaseException {}
