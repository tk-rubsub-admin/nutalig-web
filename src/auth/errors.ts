export const ERROR_CODES = {
  AUTHENTICATION_FAILED: 'evme:authentication-failed',
  PERMISSION_NOT_ALLOWED: 'evme:permission-not-allow',
  USER_DISABLED: 'evme:user-disabled',
  USER_NOT_FOUND: 'evme:user-not-found',
  USER_ACCESS_DENIED: 'access denied'
};

export class EVmeAuthError extends Error {
  readonly code: string;

  constructor(message: string, code: string = ERROR_CODES.AUTHENTICATION_FAILED) {
    super(message);
    this.code = code;
  }
}
