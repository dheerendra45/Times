import axios from "axios";

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

export default axiosClient;
