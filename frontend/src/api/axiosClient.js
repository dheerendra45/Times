import axios from "axios";
import { useAuthStore } from "../stores/authStore";

const rawBaseURL = (
  import.meta.env.VITE_API_BASE_URL || "https://times-1vx0.onrender.com"
).trim();
const sanitizedBaseURL = rawBaseURL?.replace(/\/+$/, "");
const baseURL = sanitizedBaseURL
  ? sanitizedBaseURL.endsWith("/api")
    ? sanitizedBaseURL
    : `${sanitizedBaseURL}/api`
  : "https://times-1vx0.onrender.com/api";

const axiosClient = axios.create({
  baseURL,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

// Request interceptor to add auth token
axiosClient.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().accessToken;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Response interceptor to handle token refresh
axiosClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If 401 and not already retried, try to refresh token
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Try to refresh the token
        const { data } = await axios.post(
          `${baseURL}/auth/refresh`,
          {},
          { withCredentials: true },
        );

        // Update the token in store
        useAuthStore.getState().setAccessToken(data.access_token);
        useAuthStore.getState().setUser(data.user);

        // Retry the original request with new token
        originalRequest.headers.Authorization = `Bearer ${data.access_token}`;
        return axiosClient(originalRequest);
      } catch (refreshError) {
        // Refresh failed - logout user
        useAuthStore.getState().logout();
        window.location.href = "/login";
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);

export default axiosClient;
