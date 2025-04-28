import axios from "axios";
import { AuthModel, UserModel } from "./_models";
import { Role } from "@shared/types";

const API_URL = import.meta.env.VITE_APP_API_URL;

export const GET_USER_BY_ACCESSTOKEN_URL = `${API_URL}/verify_token`;
export const LOGIN_URL = `${API_URL}/login`;
export const REGISTER_URL = `${API_URL}/register`;
export const REQUEST_PASSWORD_URL = `${API_URL}/forgot_password`;

// Usuário fake para teste
const fakeUser: UserModel = {
  id: '43c3b012-2634-41c6-bcc7-eb895bbf60f1',
  username: 'chrispalmezan',
  firstname: 'Christiano',
  lastname: 'Palmezan',
  email: 'christiano@iuppy.com.br',        // não importa muito, pois é fake
  companyId: '7f64e31e-88cb-4edc-b661-10ebca66880f',
  spaceIds: [
    // pegue dois IDs de espaço (spaces) que você gerou, por ex:
    '17a22029-e28c-4cdb-8f75-399b54a5e248',
    '41ee84ef-3fad-4cdf-b373-2f5247f68889',
  ],
  groupIds: [
    // se você tiver gerado grupos, coloque aqui os IDs; senão deixe vazio
  ],
  title: 'Teste Admin',
  hireDate: new Date(),
  active: true,
  engagementMetrics: {
    views: 0,
    interactions: 0,
  },
  role: Role.ADMIN,
  auth: {
    api_token: 'fake_token_123',
  },
  password: '@@Cano086969',
};

// Server should return AuthModel
export function login(email: string, password: string) {
  return new Promise<{ data: AuthModel }>((resolve, reject) => {
    if (email === fakeUser.email && password === fakeUser.password) {
      resolve({ data: { api_token: fakeUser.auth.api_token } });
      console.log(fakeUser.companyId)
    } else {
      reject({ message: 'Credenciais inválidas' });
    }
  });
}

// Server should return AuthModel
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

// Server should return object => { result: boolean } (Is Email in DB)
export function requestPassword(email: string) {
  return axios.post<{ result: boolean }>(REQUEST_PASSWORD_URL, {
    email,
  });
}

export function getUserByToken(token: string) {
  return new Promise<{ data: UserModel }>((resolve) => {
    resolve({ data: fakeUser });
  });
}