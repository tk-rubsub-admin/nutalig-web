import { useTranslation } from 'react-i18next';
import { ERROR_CODES } from './errors';

interface ErrorMessage {
  (code: string): string;
}

function useErrorMessage(): ErrorMessage {
  const { t } = useTranslation();

  const errorMessage = (code: string): string => {
    switch (code) {
      case 'auth/invalid-email':
        return t('authentication.error.invalidEmail');

      case 'auth/wrong-password':
        return t('authentication.error.invalidPassword');

      case 'auth/invalid-user-token':
        return t('authentication.error.invalidUserToken');

      case 'auth/user-not-found':
      case ERROR_CODES.USER_NOT_FOUND:
        return t('authentication.error.userNotFound');

      case 'auth/user-disabled':
      case ERROR_CODES.USER_DISABLED:
        return t('authentication.error.userDisabled');

      case 'auth/user-token-expired':
        return t('authentication.error.userTokenExpired');

      case 'auth/user-mismatch':
        return t('authentication.error.userMismatch');

      case 'auth/invalid-credential':
        return t('authentication.error.invalidCredential');

      case 'auth/weak-password':
        return t('authentication.error.weakPassword');

      case 'auth/requires-recent-login':
        return t('authentication.error.requiresRecentLogin');

      case ERROR_CODES.AUTHENTICATION_FAILED:
        return t('authentication.error.authenticationFailed');

      case ERROR_CODES.PERMISSION_NOT_ALLOWED:
        return t('authentication.error.permissionNotAllowed');

      case ERROR_CODES.USER_ACCESS_DENIED:
        return t('authentication.error.accessDenied');

      default:
        return t('authentication.error.unknownError');
    }
  };

  return errorMessage;
}

export default useErrorMessage;
