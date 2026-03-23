import type { ApiSuccessEnvelope } from "./common";

export interface AuthUser {
  id: string;
  fullName: string;
  email: string;
  role: string;
}

export interface AuthRegisterRequest {
  fullName: string;
  email: string;
  password: string;
}

export interface AuthLoginRequest {
  email: string;
  password: string;
}

export interface AuthRegisterResponseData {
  user: AuthUser;
  accessToken: string;
}

export interface AuthLoginResponseData {
  user: AuthUser;
  accessToken: string;
}

export interface AuthMeResponseData {
  user: AuthUser;
}

export type AuthRegisterSuccessEnvelope = ApiSuccessEnvelope<AuthRegisterResponseData>;
export type AuthLoginSuccessEnvelope = ApiSuccessEnvelope<AuthLoginResponseData>;
export type AuthMeSuccessEnvelope = ApiSuccessEnvelope<AuthMeResponseData>;
