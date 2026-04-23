import {
  sendPasswordResetEmail,
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword
} from 'firebase/auth';
import { NavigateFunction } from 'react-router-dom';
import { auth } from '../..';
import { RoutesEnum } from '../../../../routes';
import { generateFirebaseAuthErrorMessage } from '../ErrorHandler';
import { FirebaseError } from 'firebase/app';

export const forgotPassword = async (email: string, navigate: NavigateFunction) => {
  try {
    // check email exist or not
    if (email === '') {
      alert('Please enter your email address!');
      return;
    }
    // send password reset email
    await sendPasswordResetEmail(auth, email);
    navigate(RoutesEnum.Login);
  } catch (error) {
    if (error instanceof FirebaseError) {
      generateFirebaseAuthErrorMessage(error);
    }
    console.error(error);
  }
};

export const updateUserPassword = async (
  currentPassword: string,
  newPassword: string,
  navigate: NavigateFunction,
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>
) => {
  try {
    //  check if valid user
    const user = auth.currentUser;
    if (!user) return;
    // check if current password is valid
    if (!currentPassword || currentPassword === '' || currentPassword.length < 6) {
      alert('Please enter your current password');
      return;
    }
    // check if new password is valid
    if (!newPassword || newPassword === '') {
      alert('Please enter your new password');
      return;
    }
    setIsLoading(true);
    // validate old password
    const credential = EmailAuthProvider.credential(user.email as string, currentPassword);
    // reauthenticate user
    await reauthenticateWithCredential(user, credential);
    // update password
    await updatePassword(user, newPassword);
    navigate(RoutesEnum.Login);
    alert('Password updated successfully');
  } catch (error) {
    if (error instanceof FirebaseError) {
      generateFirebaseAuthErrorMessage(error);
    }
    console.error(error);
  }
};
