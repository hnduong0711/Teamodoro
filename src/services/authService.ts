import { auth, db } from '../config/firebase';
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, createUserWithEmailAndPassword, updateProfile, signOut } from 'firebase/auth';
import { doc, setDoc, Timestamp } from 'firebase/firestore';
import { useAuthStore } from '../store/authStore';
import { type User } from '../types/User';

export const loginWithEmail = async (email: string, password: string) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    useAuthStore.getState().setUser({
      id: user.uid,
      displayName: user.displayName || '',
      email: user.email || '',
      avatarUrl: user.photoURL || '',
      createdAt: Timestamp.now(),
    });
    return true;
  } catch (error) {
    throw new Error('Đăng nhập thất bại');
  }
};

export const loginWithGoogle = async () => {
  try {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    const user = result.user;
    const userData: User = {
      id: user.uid,
      displayName: user.displayName || 'Người dùng',
      email: user.email || '',
      avatarUrl: user.photoURL || '',
      createdAt: Timestamp.now(),
    };
    await setDoc(doc(db, 'users', user.uid), userData, { merge: true });
    useAuthStore.getState().setUser(userData);
    return true;
  } catch (error) {
    throw new Error('Đăng nhập bằng Google thất bại');
  }
};

export const registerWithEmail = async (displayName: string, email: string, password: string) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    await updateProfile(user, { displayName });
    const userData: User = {
      id: user.uid,
      displayName,
      email,
      avatarUrl: user.photoURL || '',
      createdAt: Timestamp.now(),
    };
    await setDoc(doc(db, 'users', user.uid), userData, { merge: true });
    useAuthStore.getState().setUser(userData);
    return true;
  } catch (error) {
    throw new Error('Đăng ký thất bại');
  }
};

export const logout = async () => {
  try {
    await signOut(auth);
    useAuthStore.getState().logout();
    return true;
  } catch (error) {
    throw new Error('Đăng xuất thất bại');
  }
};