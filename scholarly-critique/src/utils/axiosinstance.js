import axios from "axios";
import { API_BASE_URL as BASE_URL  } from "./apiPaths"; // or "./apiPaths"

const axiosInstance = axios.create({
  baseURL: BASE_URL || "http://localhost:8000",
  timeout: 15000,
  // Do NOT set Content-Type globally; let Axios decide based on data
  headers: {
    Accept: "application/json",
  },
});

axiosInstance.interceptors.request.use(
  (config) => {
    const accessToken = localStorage.getItem("token");
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    const { response, code } = error;

    if (response) {
      const { status } = response;

      if (status === 401 || status === 403) {
        // auth expired/invalid → logout + go to login (avoid loop)
        localStorage.removeItem("token");
        if (window.location.pathname !== "/login") {
          window.location.assign("/login");
        }
      } else if (status === 402) {
        // insufficient credits → let caller show a message/CTA
        // (do nothing here; surface to caller)
      } else if (status >= 500) {
        console.error("Server error. Please try again.");
      }
    } else if (code === "ECONNABORTED") {
      console.error("Request timeout. Please try again.");
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;

// Optional helpers so you never forget headers:
export const postJson = (url, data, config = {}) =>
  axiosInstance.post(url, data, {
    headers: { "Content-Type": "application/json" },
    ...config,
  });

export const postForm = (url, formData, config = {}) =>
  axiosInstance.post(url, formData, {
    headers: { "Content-Type": "multipart/form-data" },
    ...config,
  });
