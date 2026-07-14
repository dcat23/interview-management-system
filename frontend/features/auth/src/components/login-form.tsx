'use client';

import { ReactNode, useActionState } from 'react';
import type { ApiResponse } from '@next-feature/client';
import { type LoginRequest } from '../lib/actions/auth';

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
    password: '',
  },
  children,
}: Props<LoginRequest>) {
  const [formState, formAction, isPending] = useActionState(action, {
    data: initialState,
  });

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
    <Card className="w-full max-w-sm mx-auto border-none shadow-none">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl">Welcome back</CardTitle>
        <CardDescription>Sign in to your account</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          {/*<Button variant="outline" className="w-full" disabled={true}>*/}
          {/*  <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">*/}
          {/*    <path*/}
          {/*      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"*/}
          {/*      fill="#4285F4"*/}
          {/*    />*/}
          {/*    <path*/}
          {/*      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"*/}
          {/*      fill="#34A853"*/}
          {/*    />*/}
          {/*    <path*/}
          {/*      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"*/}
          {/*      fill="#FBBC05"*/}
          {/*    />*/}
          {/*    <path*/}
          {/*      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"*/}
          {/*      fill="#EA4335"*/}
          {/*    />*/}
          {/*  </svg>*/}
          {/*  Continue with Google*/}
          {/*</Button>*/}
          {/*<Button variant="outline" className="w-full" disabled={true}>*/}
          {/*  <Github className="mr-2 h-4 w-4" />*/}
          {/*  Continue with GitHub*/}
          {/*</Button>*/}
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
            <Field data-invalid={!!formState.error?.body?.errors['email']}>
              <FieldLabel htmlFor={'email'}>Email</FieldLabel>
              <FieldContent>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  defaultValue={formState.data.email ?? ''}
                  aria-invalid={!!formState.error?.body?.errors['email']}
                  disabled={isPending}
                  placeholder="you@evaitcs.com"
                />
                <FieldDescription>Use your work email.</FieldDescription>
                {displayError('email')}
              </FieldContent>
            </Field>

            <Field data-invalid={!!formState.error?.body?.errors['password']}>
              <FieldLabel htmlFor={'password'}>Password</FieldLabel>
              <div className="flex items-center justify-between">
                <Link
                  href="/forgot-password"
                  className="text-sm text-primary hover:underline"
                >
                  Forgot Password?
                </Link>
              </div>
              <FieldContent>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  defaultValue={formState.data.password ?? ''}
                  aria-invalid={!!formState.error?.body?.errors['password']}
                  disabled={isPending}
                  placeholder="******"
                />
                <FieldDescription>Use your work password.</FieldDescription>
                {displayError('password')}
              </FieldContent>
            </Field>
            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? 'Signing in..' : 'Sign In'}
            </Button>
          </FieldGroup>
        </form>
        <div className="text-center text-sm">
          {"Don't have an account? "}
          <Link
            href="/sign-up"
            className="text-primary font-bold underline hover:text-primary/80 transition-colors"
          >
            Sign Up Now
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

export default LoginForm;
