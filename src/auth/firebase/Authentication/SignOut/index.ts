import { signOut } from 'firebase/auth';
import { auth } from '../..';
import { RoutesEnum } from '../../../../routes';
import { NavigateFunction } from 'react-router-dom';

export const signOutUser = async (navigate: NavigateFunction) => {
  try {
    await signOut(auth);
    alert('You have been signed out.');
    navigate(RoutesEnum.Home);
  } catch (error) {
    console.error(error);
  }
};
