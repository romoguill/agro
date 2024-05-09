import axios from 'axios';

export const login = async (payload: { email: string; password: string }) => {
  const { data } = await axios.post('api/v1/auth/login', payload);
  return data;
};

export const getUser = async () => {
  const { data } = await axios.get('api/v1/auth/me', {
    withCredentials: true,
  });
  return data;
};
