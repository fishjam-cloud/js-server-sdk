export class MissingFishjamIdException extends Error {
  constructor() {
    super('Fishjam ID is required');
  }
}

export class StaleSdkException extends Error {
  /** Raw wire value received from the server. */
  status: number;
  constructor(status: number) {
    super(
      `Received a recording status this SDK cannot parse (${status}). You are probably using an outdated version of @fishjam-cloud/js-server-sdk — please update it.`
    );
    this.status = status;
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

export class RecordingNotFoundException extends FishjamBaseException {}

export class ServiceUnavailableException extends FishjamBaseException {}

export class QuotaExceededException extends FishjamBaseException {}

export class UnknownException extends FishjamBaseException {}
