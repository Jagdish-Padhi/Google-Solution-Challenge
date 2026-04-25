
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import toast from 'react-hot-toast';

import api from '../../services/api.js';
import useAuthStore from '../../store/auth.store.js';
import { auth, db } from './firebase';

function SignInwithGoogle() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);

  async function syncGoogleUserProfile(user) {
    try {
      await setDoc(
        doc(db, 'Users', user.uid),
        {
          email: user.email,
          firstName: user.displayName,
          photo: user.photoURL,
          lastName: '',
        },
        { merge: true },
      );
    } catch (error) {
      console.warn('Google profile sync to Firestore failed:', error);
    }
  }

  async function googleLogin() {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    setIsSubmitting(true);

    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      if (!user) {
        throw new Error('Google sign-in did not return a user.');
      }

      const idToken = await user.getIdToken();
      const response = await api.post('/auth/google', { idToken });

      setAuth({
        user: response.data.organization,
        accessToken: response.data.accessToken,
      });

      void syncGoogleUserProfile(user);

      toast.success('Logged in successfully.', {
        position: 'top-center',
      });
      navigate('/dashboard', { replace: true });
    } catch (error) {
      console.error('Google sign-in failed:', error);

      const firebaseCode = error?.code;
      if (String(firebaseCode).includes('api-key-not-valid')) {
        toast.error('Firebase API key is invalid. Update VITE_FIREBASE_API_KEY and restart dev server.');
        return;
      }
      if (firebaseCode === 'auth/popup-closed-by-user') {
        toast.error('Google sign-in window was closed before completion.');
        return;
      }
      if (firebaseCode === 'auth/popup-blocked') {
        toast.error('Popup was blocked by browser. Allow popups and try again.');
        return;
      }
      if (firebaseCode === 'auth/unauthorized-domain') {
        toast.error('Current domain is not authorized in Firebase Auth.');
        return;
      }

      if (auth.currentUser) {
        await signOut(auth).catch(() => {});
      }

      const message = error.response?.data?.message || 'Google sign-in failed. Check console for details.';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div>
      <button
        type='button'
        onClick={googleLogin}
        disabled={isSubmitting}
        className='flex w-full items-center justify-center gap-3 rounded-xl border border-(--app-color-border) bg-white px-4 py-3 text-sm font-bold text-gray-700 shadow-sm transition-all hover:bg-gray-50 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70'
      >
        <img
          src='https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg'
          alt='Google'
          className='h-5 w-5'
        />
        {isSubmitting ? 'Signing in...' : 'Continue with Google'}
      </button>
    </div>
  );
}
export default SignInwithGoogle;
