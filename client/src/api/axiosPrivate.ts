import axios from 'axios';
import { refreshAccessToken } from './queries';

const axiosPrivate = axios.create();

axiosPrivate.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      try {
        await refreshAccessToken();

        const originalRequest = error.config;

        return axios(originalRequest);
      } catch (error) {
        return Promise.reject(error);
      }
    }
    return Promise.reject(error);
  }
);

export { axiosPrivate };
