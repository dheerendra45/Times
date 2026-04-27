import { create } from "zustand";
import { persist } from "zustand/middleware";
import axiosClient from "../api/axiosClient";

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      setAccessToken: (token) =>
        set({ accessToken: token, isAuthenticated: !!token }),
      setUser: (user) => set({ user }),

      login: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
          const { data } = await axiosClient.post("/auth/login", {
            email,
            password,
          });
          set({
            accessToken: data.access_token,
            user: data.user,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
          return data;
        } catch (err) {
          const message = err.response?.data?.detail || "Login failed";
          set({ isLoading: false, error: message });
          throw new Error(message);
        }
      },

      register: async (username, email, password, fullName) => {
        set({ isLoading: true, error: null });
        try {
          const { data } = await axiosClient.post("/auth/register", {
            username,
            email,
            password,
            full_name: fullName,
          });
          set({
            accessToken: data.access_token,
            user: data.user,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
          return data;
        } catch (err) {
          const message = err.response?.data?.detail || "Registration failed";
          set({ isLoading: false, error: message });
          throw new Error(message);
        }
      },

      refreshToken: async () => {
        try {
          const { data } = await axiosClient.post("/auth/refresh");
          set({
            accessToken: data.access_token,
            user: data.user,
            isAuthenticated: true,
          });
        } catch {
          set({ accessToken: null, user: null, isAuthenticated: false });
        }
      },

      logout: async () => {
        try {
          await axiosClient.post("/auth/logout");
        } catch {
          // Always logout locally even if API call fails
        }
        set({
          accessToken: null,
          user: null,
          isAuthenticated: false,
          error: null,
        });
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);
