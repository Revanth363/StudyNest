import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "https://studynest-h8ks.onrender.com/api",
  withCredentials: true,
});

export default api;