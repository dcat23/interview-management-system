'use server';

import { withApi, withForm } from '@next-feature/client/server';
import { z } from 'zod';
import api from '../config/client';
import { signIn } from '../auth';
import { Role } from '../types';

/**
 * [login]
 * next-feature@0.1.4-3
 * July 4th 2026, 12:56:28 am
 */
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});
export type LoginRequest = z.infer<typeof loginSchema>;
export type LoginResponse = {
  accessToken: string;
  refreshToken: string;
  role: Role;
  expiration: number;
};

export const login = withApi(async (options: LoginRequest) => {
  const parsed = loginSchema.safeParse(options);

  if (!parsed.success) {
    throw parsed.error;
  }

  const endpoint = '/auth/login';
  const response = await api.post<LoginResponse>(endpoint, parsed.data);
  return response;
}, {});

/**
 * [refresh]
 * next-feature@0.1.4-3
 * July 4th 2026, 12:59:59 am
 */
const refreshSchema = z.object({
  refreshToken: z.string(),
});
export type RefreshRequest = z.infer<typeof refreshSchema>;
export type RefreshResponse = {
  accessToken: string;
  refreshToken: string;
  expiration: number;
};

export const refresh = withApi(async (options: RefreshRequest) => {
  const parsed = refreshSchema.safeParse(options);

  if (!parsed.success) {
    throw parsed.error;
  }

  const endpoint = '/auth/refresh';
  const response = await api.post<RefreshResponse>(endpoint, parsed.data);
  return response;
}, {});

/**
 * [logout]
 * next-feature@0.1.4-3
 * July 4th 2026, 1:01:10 am
 */
const logoutSchema = z.object({});
export type LogoutRequest = z.infer<typeof logoutSchema>;
export type LogoutResponse = {};

export const logout = withApi(async (options?: LogoutRequest) => {
  const parsed = logoutSchema.safeParse(options);

  if (!parsed.success) {
    throw parsed.error;
  }
  const { auth } = await import("../auth");
  const session = await auth();

  const endpoint = '/auth/logout';
  const response = await api.post<LogoutResponse>(endpoint, parsed.data, {
    headers: {
      Authorization: `Bearer ${session?.user?.jwtToken}`
    }
  });
  return response;
}, {});

/**
 * [login-form-action]
 * next-feature@0.1.4-3
 * July 4th 2026, 1:14:26 am
 */
function parseLoginFormActionRequest(
  formData: FormData,
): LoginRequest {
  return {
    email: formData.get("email") as string,
    password: formData.get("password") as string
  };
}

export const loginFormData = withApi(async (formData: FormData) => {
  const options = parseLoginFormActionRequest(formData);
  const parsed = loginSchema.safeParse(options);

  if (!parsed.success) {
    throw parsed.error;
  }

  await signIn("credentials", formData);

  return parsed.data as LoginRequest;
}, {});

export const loginFormAction = withForm(loginFormData);
