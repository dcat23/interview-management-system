'use client';

import { ReactNode, useActionState } from 'react';
import type { ApiResponse } from '@next-feature/client';
import { type LoginRequest } from "../lib/actions/auth"

interface Props<T> {
  action: (
    prevState: ApiResponse<T>,
    formData: FormData,
  ) => Promise<ApiResponse<T>>;
  initialState?: T;
  children?: ReactNode;
}

export function LoginForm({
  action,
  initialState = {
    email: '',
    password: ''
  },
  children,
}: Props<LoginRequest>) {
  const [formState, formAction, isPending] = useActionState(action, {
    data: initialState,
  });

  const displayError = (key: string) => {
    if (formState?.error?.body.errors && formState.error.body.errors[key]) {
      return (
        <div className="rounded-md px-3 text-sm text-red-700">
          {formState.error.body.errors[key]}
        </div>
      );
    }
    return null;
  };

  const displayMessage = () => {
    if (!formState.message) return null;

    const color = formState.success
      ? 'green'
      : formState.error
        ? 'red'
        : 'primary';

    return (
      <div
        className={`rounded-md bg-${color}-50 p-3 text-sm text-${color}-700`}
      >
        {formState.message}
      </div>
    );
  };

  return (
    <form action={formAction}>
      {/* email field */}
      <label 
        htmlFor='email'
      >
        Email
      </label>
      <input
        name='email'
        type='email'
        placeholder='Enter email'
        defaultValue={formState.data.email}
      />
      {displayError("email")}
      {/* password field */}

      {displayMessage()}
      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isPending ? 'Submitting...' : 'Submit'}
      </button>
    </form>
  );
}

export default LoginForm;
