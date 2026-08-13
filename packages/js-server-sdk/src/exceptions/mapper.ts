import { ResponseError, FetchError } from '@fishjam-cloud/fishjam-openapi';
import {
  BadRequestException,
  FishjamNotFoundException,
  InvalidFishjamCredentialsException,
  PeerNotFoundException,
  QuotaExceededException,
  RecordingNotFoundException,
  RoomNotFoundException,
  ServiceUnavailableException,
  UnauthorizedException,
  UnknownException,
  type FishjamExceptionInfo,
} from '.';

type Entity = 'peer' | 'room' | 'credentials' | 'recording';

const notFoundException = (info: FishjamExceptionInfo, entity?: Entity) => {
  switch (entity) {
    case 'credentials':
      return new InvalidFishjamCredentialsException(info);
    case 'peer':
      return new PeerNotFoundException(info);
    case 'recording':
      return new RecordingNotFoundException(info);
    case 'room':
      return new RoomNotFoundException(info);
    default:
      return new FishjamNotFoundException(info);
  }
};

export const mapException = async (error: unknown, entity?: Entity): Promise<unknown> => {
  if (error instanceof FetchError) {
    return new UnknownException({ message: error.cause.message, statusCode: 500, details: error.cause.message });
  }
  if (!(error instanceof ResponseError)) {
    return error;
  }

  const status = error.response.status;
  const body = (await error.response.json().catch(() => ({}))) as Record<string, string>;
  const info: FishjamExceptionInfo = {
    message: `Request failed with status code ${status}`,
    statusCode: status,
    details: body['detail'] ?? body['errors'] ?? 'Unknown error',
  };

  switch (status) {
    case 400:
      return new BadRequestException(info);
    case 402:
      return new QuotaExceededException(info);
    case 401:
      return new UnauthorizedException(info);
    case 404:
      return notFoundException(info, entity);
    case 503:
      return new ServiceUnavailableException(info);
    default:
      return new UnknownException(info);
  }
};
