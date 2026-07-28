import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
} from 'firebase/auth';
import { fetchClientPlans, fetchClientProfile, saveClientProfile } from '../services/accountApi';
import {
  firebaseClientConfigured,
  getFirebaseAuth,
  getGoogleProvider,
} from '../services/firebaseClient';

function profileFromUser(user) {
  return {
    uid: user.uid,
    fullName: user.displayName || '',
    phone: '',
    email: user.email || '',
    authProvider: user.providerData?.[0]?.providerId || 'firebase',
    photoURL: user.photoURL || '',
  };
}

function getFriendlyAuthMessage(error) {
  const code = error?.code || '';

  if (code.includes('auth/invalid-credential') || code.includes('auth/wrong-password')) {
    return 'E-mail ou senha inválidos.';
  }

  if (code.includes('auth/email-already-in-use')) {
    return 'Este e-mail já está cadastrado. Entre com sua senha.';
  }

  if (code.includes('auth/weak-password')) {
    return 'Use uma senha com pelo menos 6 caracteres.';
  }

  if (code.includes('auth/popup-closed-by-user')) {
    return 'Login com Google cancelado.';
  }

  return error?.message || 'Não foi possível acessar sua conta.';
}

export function useClientAccount() {
  const auth = getFirebaseAuth();
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(firebaseClientConfigured);
  const [error, setError] = useState('');

  const isAuthenticated = Boolean(firebaseUser);

  const getIdToken = useCallback(async () => {
    if (!auth?.currentUser) {
      return '';
    }

    return auth.currentUser.getIdToken();
  }, [auth]);

  const refreshProfile = useCallback(async () => {
    if (!auth?.currentUser) {
      setProfile(null);
      setPlans([]);
      return null;
    }

    const idToken = await auth.currentUser.getIdToken();
    const [profileData, plansData] = await Promise.all([
      fetchClientProfile(idToken).catch(() => ({ profile: null })),
      fetchClientPlans(idToken).catch(() => ({ plans: [] })),
    ]);
    const nextProfile = profileData.profile || profileFromUser(auth.currentUser);

    setProfile(nextProfile);
    setPlans(plansData.plans || []);
    return nextProfile;
  }, [auth]);

  useEffect(() => {
    if (!auth) {
      return undefined;
    }

    return onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      setError('');

      if (!user) {
        setProfile(null);
        setPlans([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        await refreshProfile();
      } catch (profileError) {
        setProfile(profileFromUser(user));
        setError(profileError.message || '');
      } finally {
        setLoading(false);
      }
    });
  }, [auth, refreshProfile]);

  const saveProfile = useCallback(async (payload) => {
    const idToken = await getIdToken();

    if (!idToken) {
      throw new Error('Entre na sua conta para continuar.');
    }

    const data = await saveClientProfile(payload, idToken);
    setProfile(data.profile);
    return data.profile;
  }, [getIdToken]);

  const registerWithEmail = useCallback(async ({ fullName, phone, email, password }) => {
    if (!auth) {
      throw new Error('Firebase Auth não está configurado.');
    }

    try {
      const credential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(credential.user, { displayName: fullName });
      const idToken = await credential.user.getIdToken();
      const data = await saveClientProfile({
        fullName,
        phone,
        email,
        authProvider: 'password',
      }, idToken);

      setProfile(data.profile);
      return data.profile;
    } catch (authError) {
      throw new Error(getFriendlyAuthMessage(authError));
    }
  }, [auth]);

  const loginWithEmail = useCallback(async ({ email, password }) => {
    if (!auth) {
      throw new Error('Firebase Auth não está configurado.');
    }

    try {
      const credential = await signInWithEmailAndPassword(auth, email, password);
      const idToken = await credential.user.getIdToken();
      const data = await fetchClientProfile(idToken).catch(() => ({ profile: null }));
      const nextProfile = data.profile || profileFromUser(credential.user);

      setProfile(nextProfile);
      return nextProfile;
    } catch (authError) {
      throw new Error(getFriendlyAuthMessage(authError));
    }
  }, [auth]);

  const loginWithGoogle = useCallback(async () => {
    if (!auth) {
      throw new Error('Firebase Auth não está configurado.');
    }

    try {
      const credential = await signInWithPopup(auth, getGoogleProvider());
      const idToken = await credential.user.getIdToken();
      const data = await saveClientProfile({
        fullName: credential.user.displayName || '',
        email: credential.user.email || '',
        photoURL: credential.user.photoURL || '',
        authProvider: 'google',
      }, idToken);

      setProfile(data.profile);
      return data.profile;
    } catch (authError) {
      throw new Error(getFriendlyAuthMessage(authError));
    }
  }, [auth]);

  const logout = useCallback(async () => {
    if (!auth) {
      return;
    }

    await signOut(auth);
    setProfile(null);
    setPlans([]);
  }, [auth]);

  return useMemo(() => ({
    configured: firebaseClientConfigured,
    firebaseUser,
    profile,
    plans,
    loading,
    error,
    isAuthenticated,
    getIdToken,
    refreshProfile,
    saveProfile,
    registerWithEmail,
    loginWithEmail,
    loginWithGoogle,
    logout,
  }), [
    firebaseUser,
    profile,
    plans,
    loading,
    error,
    isAuthenticated,
    getIdToken,
    refreshProfile,
    saveProfile,
    registerWithEmail,
    loginWithEmail,
    loginWithGoogle,
    logout,
  ]);
}
