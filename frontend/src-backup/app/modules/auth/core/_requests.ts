import axios from "axios";
import { AuthModel, UserModel } from "./_models";

const API_URL = import.meta.env.VITE_APP_API_URL;

export const GET_USER_BY_ACCESSTOKEN_URL = `${API_URL}/verify_token`;
export const LOGIN_URL = `${API_URL}/login`;
export const REGISTER_URL = `${API_URL}/register`;
export const REQUEST_PASSWORD_URL = `${API_URL}/forgot_password`;

// Usuário fake para teste
const fakeUser = {
  email: 'admin@iuppy.com',
  password: 'admin123',
  api_token: 'fake_token_123',
  id: 1,
  username: 'Admin',
  firstname: 'Admin',
  lastname: 'Iuppy',
};

export function login(email: string, password: string) {
  // Autenticação temporária
  return new Promise<{data: AuthModel}>((resolve, reject) => {
    if (email === fakeUser.email && password === fakeUser.password) {
      resolve({data: {api_token: fakeUser.api_token}})
    } else {
      reject({message: 'Credenciais inválidas'})
    }
  });
}

export function register(
  email: string,
  firstname: string,
  lastname: string,
  password: string,
  password_confirmation: string
) {
  return axios.post(REGISTER_URL, {
    email,
    first_name: firstname,
    last_name: lastname,
    password,
    password_confirmation,
  });
}

export function requestPassword(email: string) {
  return axios.post<{ result: boolean }>(REQUEST_PASSWORD_URL, {
    email,
  });
}

export function getUserByToken(token: string) {
  // Retorna o usuário fake
  return new Promise<{data: UserModel}>((resolve) => {
    resolve({
      data: {
        password: fakeUser.password,
        id: fakeUser.id,
        username: fakeUser.username,
        email: fakeUser.email,
        first_name: fakeUser.firstname,
        last_name: fakeUser.lastname,
      },
    });
  });
}