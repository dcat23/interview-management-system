'use server';

import { withApi } from '@next-feature/client/server';
import { z } from 'zod';
import api from '../config/client';
import type { Page, Pageable, User, UserRole } from '@feature/base/server';
import { toRecord } from '@feature/base/server';

const userRoleSchema = z.enum(['CANDIDATE', 'MARKETER', 'SUPPORTER', 'ADMIN']);

/**
 * [get-users]
 *
 * GET /users. Admin only. The backend treats a missing isActive as true, so
 * inactive users only come back when isActive=false is passed explicitly.
 */
export type GetUsersRequest = Pageable & {
  role?: UserRole;
  isActive?: boolean;
};

export type GetUsersResponse = Page<User>;

export const getUsers = withApi(
  async (options?: GetUsersRequest) => {
    const params = new URLSearchParams(toRecord(options));
    const endpoint = '/users?' + params.toString();

    return api.get<GetUsersResponse>(endpoint);
  },
  {
    fallbackData: { data: [], total: 0, page: 0, limit: 0 },
  },
);

/**
 * [create-user]
 *
 * POST /users. Admin only. 409 when the email is already in use.
 */
const createUserSchema = z.object({
  name: z.string().trim().min(1),
  email: z.string().trim().email(),
  password: z.string().min(12),
  role: userRoleSchema,
});
export type CreateUserRequest = z.infer<typeof createUserSchema>;
export type CreateUserResponse = User;

export const createUser = withApi(async (options: CreateUserRequest) => {
  const parsed = createUserSchema.safeParse(options);

  if (!parsed.success) {
    throw parsed.error;
  }

  const endpoint = '/users';
  return api.post<CreateUserResponse>(endpoint, parsed.data);
}, {});

/**
 * [update-user]
 *
 * PATCH /users/:id. Admin only. Partial — omitted fields are left unchanged.
 * 409 when the new email is already in use.
 */
const updateUserSchema = z.object({
  id: z.string().uuid(),
  name: z.string().trim().min(1).optional(),
  email: z.string().trim().email().optional(),
  role: userRoleSchema.optional(),
  active: z.boolean().optional(),
});
export type UpdateUserRequest = z.infer<typeof updateUserSchema>;
export type UpdateUserResponse = User;

export const updateUser = withApi(async (options: UpdateUserRequest) => {
  const parsed = updateUserSchema.safeParse(options);

  if (!parsed.success) {
    throw parsed.error;
  }

  const { id, ...body } = parsed.data;
  const endpoint = `/users/${id}`;
  return api.patch<UpdateUserResponse>(endpoint, body);
}, {});
