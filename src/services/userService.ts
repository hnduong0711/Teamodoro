import { db } from '../config/firebase';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import type { User } from '../types/User';

export const fetchUserByEmail = async (email: string): Promise<User | null> => {
  const usersCollection = collection(db, "users");
  const q = query(usersCollection, where("email", "==", email));
  const snapshot = await getDocs(q);
  if (!snapshot.empty) {
    const userData = snapshot.docs[0].data() as Omit<User, 'id'>;
    return { id: snapshot.docs[0].id, ...userData };
  }
  return null;
};

export const fetchUserById = async (userId: string): Promise<User | null> => {
  const userRef = doc(db, "users", userId);
  const docSnap = await getDoc(userRef);
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() } as User;
  }
  return null;
};

export const fetchUsersByIds = async (userIds: string[]): Promise<User[]> => {
  const users = await Promise.all(userIds.map(fetchUserById));
  return users.filter((user): user is User => user !== null);
};