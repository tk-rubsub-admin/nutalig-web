import { useEffect } from 'react';
import { useLocation, useHistory } from 'react-router-dom';
import { useAuth } from 'auth/AuthContext';

export default function MagicLinkHandler() {
  const { logInWithOneTimeToken, authReady, getToken } = useAuth();
  const location = useLocation();
  const history = useHistory();

  useEffect(() => {
    if (!authReady) return; // รอ Firebase restore session

    const params = new URLSearchParams(location.search);
    const magicToken = params.get('oneTimeToken');
    const redirect = params.get('redirect') || '/';

    if (!magicToken) return;

    (async () => {
      try {
        await logInWithOneTimeToken(magicToken);

        params.delete('oneTimeToken');
        history.replace({
          pathname: redirect,
          search: params.toString(),
        });
      } catch (err) {
        console.error('magic login failed', err);
        history.replace('/login');
      }
    })();
  }, [location.search, authReady, logInWithOneTimeToken, getToken, history]);

  return null;
}
