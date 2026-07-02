import axios from "axios";

const api = axios.create({
  baseURL: "/api",
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Simulate network latency (e.g. 600ms) for loading state visualizations
export const simulateLatency = (ms = 600) =>
  new Promise((resolve) => setTimeout(resolve, ms));

export default api;
