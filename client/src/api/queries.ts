import axios from 'axios';
import { axiosPrivate } from './axiosPrivate';

export const login = async (payload: { email: string; password: string }) => {
  const { data } = await axios.post('api/v1/auth/login', payload);
  return data;
};

export const refreshAccessToken = async () => {
  const { data } = await axios.post('api/v1/auth/refresh', null, {
    withCredentials: true,
  });
  return data;
};

export const getUser = async () => {
  const { data } = await axiosPrivate.get('api/v1/auth/me', {
    withCredentials: true,
  });
  return data;
};
