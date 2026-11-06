import { create } from "zustand";
import { AuthAPI, type User } from "../services/endpoints";
import { tokenStore } from "../services/api";

interface AuthState {
  user: User | null;
  ready: boolean;
  setUser: (user: User | null) => void;
  setTokens: (access?: string, refresh?: string) => void;
  fetchMe: () => Promise<void>;
  login: (creds: {
    email?: string;
    username?: string;
    password: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  ready: false,
  setUser: (user) => set({ user }),
  setTokens: (access, refresh) => tokenStore.set(access, refresh),
  fetchMe: async () => {
    if (!tokenStore.getAccess() && !tokenStore.getRefresh()) {
      set({ user: null, ready: true });
      return;
    }
    try {
      const user = await AuthAPI.me();
      set({ user, ready: true });
    } catch {
      tokenStore.clear();
      set({ user: null, ready: true });
    }
  },
  login: async (creds) => {
    const data = await AuthAPI.login(creds);
    tokenStore.set(data.accessToken, data.refreshToken);
    if (data.user) set({ user: data.user, ready: true });
    else await get().fetchMe();
  },
  logout: async () => {
    try {
      await AuthAPI.logout();
    } catch {
      /* ignore – we clear locally anyway */
    }
    tokenStore.clear();
    set({ user: null });
  },
}));
