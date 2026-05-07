import { create } from 'zustand';
import { 
  User, 
  onAuthStateChanged,
  onIdTokenChanged
} from 'firebase/auth';
import { auth } from '../lib/firebase';

interface AuthState {
  user: User | null;
  loading: boolean;
  setUser: (user: User | null) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,
  setUser: (user) => set({ user, loading: false }),
}));

export const initializeAuth = () => {
  onAuthStateChanged(auth, (user) => {
    useAuthStore.getState().setUser(user);
  });
};
