import { BadRequestException, ServiceUnavailableException, UnauthorizedException } from '.';

export const mapExceptions = (code: number) => {
  switch (code) {
    case 400:
      return new BadRequestException();
    case 401:
      return new UnauthorizedException();
    case 503:
      return new ServiceUnavailableException();
    default:
      return;
  }
};
