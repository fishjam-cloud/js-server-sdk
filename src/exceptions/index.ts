class BaseException extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class BadRequestException extends BaseException {
  constructor() {
    super('Invalid request body structure');
  }
}

export class UnauthorizedException extends BaseException {
  constructor() {
    super('Unauthorized');
  }
}

export class RoomNotFoundException extends BaseException {
  constructor() {
    super('Room not found');
  }
}

export class PeerNotFoundException extends BaseException {
  constructor() {
    super('Peer not found');
  }
}

export class ServiceUnavailableException extends BaseException {
  constructor() {
    super('Service unavailable');
  }
}
