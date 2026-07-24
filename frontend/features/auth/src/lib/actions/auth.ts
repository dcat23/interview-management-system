'use server';

import { withApi } from '@next-feature/client/server';
import { z } from 'zod';
import api, { ApiError, type ApiResponse } from '../config/client';
import { signIn, signOut } from '../auth';
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
  await api.post<LogoutResponse>(endpoint, parsed.data, {
    headers: {
      Authorization: `Bearer ${session?.user?.jwtToken}`
    }
  });

  await signOut({ redirectTo: "/login" })
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

// Not wrapped with withForm: its error branch always falls back to
// prevState.data, which would discard the email/password the user just
// typed. This returns the full ApiResponse shape with the correct data
// for every branch instead.
export async function loginFormAction(
  prevState: ApiResponse<LoginRequest>,
  formData: FormData,
): Promise<ApiResponse<LoginRequest>> {
  const options = parseLoginFormActionRequest(formData);
  const parsed = loginSchema.safeParse(options);

  if (!parsed.success) {
    const error = ApiError.of(parsed.error);
    return { success: false, error, message: error.message, data: options };
  }

  try {
    await signIn('credentials', { redirect: false, ...parsed.data });
  } catch (e) {
    const error = ApiError.of(e);
    return { success: false, error, message: error.message, data: parsed.data };
  }

  return { success: true, message: 'Signed in successfully', data: parsed.data };
}
