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
  username: 'SeededUser',
  firstname: 'Teste',
  lastname: 'Iuppy',
  email: 'test@iuppy.com',        // não importa muito, pois é fake
  companyId: '5f09494b-34dc-4c21-a869-6fb4df117abb',
  spaceIds: [
    // pegue dois IDs de espaço (spaces) que você gerou, por ex:
    '9c99ed8e-3b1b-4fef-91f1-4a65ef965930',
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
  password: '$2b$10$NcupNw8HVffhD.XAcpNPHOdRMAp5ji6M5ymXxDWlRzFgho7L4HtIy',
};

// Server should return AuthModel
export function login(email: string, password: string) {
  return new Promise<{ data: AuthModel }>((resolve, reject) => {
    if (email === fakeUser.email && password === fakeUser.password) {
      resolve({ data: { api_token: fakeUser.auth.api_token } });
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