import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

// Handle 401 globally
api.interceptors.response.use(
  (res) => res,
  (err) => {
    // If we want to dispatch a logout action, we could do it here
    return Promise.reject(err);
  },
);

export default api;
