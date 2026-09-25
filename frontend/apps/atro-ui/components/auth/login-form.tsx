'use client';

import { useActionState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import type { ApiResponse } from '@next-feature/client';
import { loginFormAction, type LoginRequest } from '@feature/auth/server';
import { cn } from '@app/atro-ui/lib/ui/utils';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@app/atro-ui/components/ui/common/card';
import { Input } from '@app/atro-ui/components/ui/common/input';
import { Label } from '@app/atro-ui/components/ui/common/label';
import { LoginButton } from './login-button';
import { PROJECT_NAME } from '@app/atro-ui/lib/constants/metadata';

interface Props extends React.ComponentProps<'div'> {
  action?: (
    prevState: ApiResponse<LoginRequest>,
    formData: FormData,
  ) => Promise<ApiResponse<LoginRequest>>;
  initialState?: LoginRequest;
}

export function LoginForm({
  action = loginFormAction,
  initialState = { email: '', password: '' },
  className,
  ...props
}: Props) {
  const [formState, formAction, isPending] = useActionState(action, {
    data: initialState,
  });
  const router = useRouter();

  useEffect(() => {
    if (formState.success) {
      router.push('/');
    }
  }, [formState.success, router]);

  useEffect(() => {
    if (!formState.message) return;

    if (formState.success) {
      toast.success(formState.message, { description: 'Redirecting...' });
    } else if (formState.error) {
      toast.error(formState.message);
    }
  }, [formState.message, formState.success, formState.error]);

  const fieldError = (key: string) => formState.error?.body?.errors?.[key];

  return (
    <div className={cn('flex flex-col gap-6', className)} {...props}>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Welcome back</CardTitle>
          <CardDescription>Sign in to your {PROJECT_NAME} account</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                defaultValue={formState.data.email ?? ''}
                aria-invalid={!!fieldError('email')}
                disabled={isPending}
                placeholder="you@company.com"
                required
              />
              {fieldError('email') && (
                <p className="text-sm text-destructive">{fieldError('email')}</p>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex items-center">
                <Label htmlFor="password">Password</Label>
                <a
                  href="#"
                  className="ml-auto text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                >
                  Forgot your password?
                </a>
              </div>
              <Input
                id="password"
                name="password"
                type="password"
                defaultValue={formState.data.password ?? ''}
                aria-invalid={!!fieldError('password')}
                disabled={isPending}
                placeholder="********"
                required
              />
              {fieldError('password') && (
                <p className="text-sm text-destructive">{fieldError('password')}</p>
              )}
            </div>

            <LoginButton success={formState.success} />
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
