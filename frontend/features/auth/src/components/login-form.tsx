'use client';

import { useActionState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { type ApiResponse } from '@next-feature/client';
import { loginFormAction, type LoginRequest } from '../lib/actions/auth';

import './login-form-styles.css';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@feature/ui/components/card';
import { Button } from '@feature/ui/components/button';
import Link from 'next/link';
import { Input } from '@feature/ui/components/input';
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@feature/ui/components/field';

interface Props<T> {
  action?: (
    prevState: ApiResponse<T>,
    formData: FormData,
  ) => Promise<ApiResponse<T>>;
  initialState?: T;
}

export function LoginForm({
  action = loginFormAction,
  initialState = {
    email: '',
    password: '',
  },
}: Props<LoginRequest>) {
  const [formState, formAction, isPending] = useActionState(action, {
    data: initialState,
  });
  const router = useRouter();

  useEffect(() => {
    if (formState.success) {
      router.push('/');
    }
  }, [formState.success, router]);

  const displayError = (key: string) => {
    if (formState?.error?.body?.errors && formState.error.body.errors[key]) {
      return (
        <FieldError errors={[{ message: formState.error.body.errors[key] }]} />
      );
    }
    return null;
  };

  const displayMessage = () => {
    if (!formState.message) return null;

    const colorClasses = formState.success
      ? 'bg-green-50 text-green-700'
      : formState.error
        ? 'bg-red-50 text-red-700'
        : 'bg-primary/10 text-primary';

    return (
      <div className={`rounded-md p-3 text-sm ${colorClasses}`}>
        {formState.message}
      </div>
    );
  };

  return (
    <Card className="w-full max-w-sm mx-auto border-none shadow-none">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl">Welcome back</CardTitle>
        <CardDescription>Sign in to your account</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <Button variant="outline" className="w-full" disabled={true}>
            <svg
              className="mr-2 h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect width="18" height="18" x="3" y="3" rx="2" />
              <path d="M7 7h10" />
              <path d="M7 12h10" />
              <path d="M7 17h10" />
            </svg>
            Continue with SSO
          </Button>
        </div>
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">or</span>
          </div>
        </div>
        {displayMessage()}
        <form action={formAction} className="space-y-4">
          <FieldGroup>
            <Field data-invalid={!!formState.error?.body?.errors?.['email']}>
              <FieldLabel htmlFor={'email'}>Email</FieldLabel>
              <FieldContent>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  defaultValue={formState.data.email ?? ''}
                  aria-invalid={!!formState.error?.body?.errors?.['email']}
                  disabled={isPending}
                  placeholder="you@evaitcs.com"
                />
                {/* <FieldDescription>Use your work email.</FieldDescription> */}
                {displayError('email')}
              </FieldContent>
            </Field>

            <Field data-invalid={!!formState.error?.body?.errors?.['password']}>
              <FieldLabel htmlFor={'password'}>Password</FieldLabel>
              <FieldContent>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  defaultValue={formState.data.password ?? ''}
                  aria-invalid={!!formState.error?.body?.errors?.['password']}
                  disabled={isPending}
                  placeholder="******"
                />
                {/* <FieldDescription>Use your work password.</FieldDescription> */}
                {displayError('password')}
              </FieldContent>
              <div className="flex items-center justify-between">
                <Link
                  href="/forgot-password"
                  className="text-sm text-primary hover:underline"
                >
                  Forgot Password?
                </Link>
              </div>
            </Field>
            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? 'Signing in..' : 'Sign In'}
            </Button>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  );
}

export default LoginForm;
