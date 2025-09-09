import axios from "axios";

const baseURL = import.meta.env.VITE_API_V2_BASE_URL;

const apiClient = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

export default apiClient;
