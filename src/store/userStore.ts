import {create} from 'zustand';
import { fetchUserByEmail, fetchUserById } from '../services/userService';
import type { User } from '../types/User';

interface UserState {
  users: { [userId: string]: User };
  fetchUser: (userId: string) => Promise<void>;
  setUser: (userId: string, user: User) => void;
  fetchUsersByEmails: (emails: string[]) => Promise<void>;
}

export const useUserStore = create<UserState>((set) => ({
  users: {},
  fetchUser: async (userId) => {
    const user = await fetchUserById(userId);
    if (user) {
      set((state) => ({ users: { ...state.users, [userId]: user } }));
    }
  },
  setUser: (userId, user) => set((state) => ({ users: { ...state.users, [userId]: user } })),
  fetchUsersByEmails: async (emails) => {
    const users = await Promise.all(emails.map(fetchUserByEmail));
    set((state) => ({
      users: { ...state.users, ...users.reduce((acc, user) => user ? { ...acc, [user.id]: user } : acc, {}) }
    }));
  },
}));