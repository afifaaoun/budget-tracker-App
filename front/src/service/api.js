import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:5000/api",
});

// Ajoute automatiquement le token Authorization à chaque requête
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
    console.log("Headers envoyés:", config.headers);

  return config;
});

export default api;
