"use client"

import { cn } from "@app/web/lib/ui/utils"
import { Button } from "@app/web/components/ui/common/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@app/web/components/ui/common/card"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@app/web/components/ui/common/field"
import { Input } from "@app/web/components/ui/common/input"
import { ApiResponse } from "@next-feature/client"
import { loginFormAction, LoginRequest } from "@feature/auth/server"
import { useRouter } from "next/navigation"
import { useActionState, useEffect } from "react"

interface Props<T> extends React.ComponentProps<"div"> {
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
  className,
  ...props
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
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Welcome back</CardTitle>
          <CardDescription>
            Sign in to your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={formAction}>
            <FieldGroup>
              <Field>
                <Button variant="outline" type="button" disabled>
                  <svg
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
              </Field>
              <FieldSeparator className="*:data-[slot=field-separator-content]:bg-card">
                Or continue with
              </FieldSeparator>
              {displayMessage()}
              <Field data-invalid={!!formState.error?.body?.errors?.['email']}>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  defaultValue={formState.data.email ?? ''}
                  aria-invalid={!!formState.error?.body?.errors?.['email']}
                  disabled={isPending}
                  placeholder="m@example.com"
                  required
                />
                {displayError('email')}
              </Field>
              <Field data-invalid={!!formState.error?.body?.errors?.['password']}>
                <div className="flex items-center">
                  <FieldLabel htmlFor="password">Password</FieldLabel>
                  <a
                    href="#"
                    className="ml-auto text-sm underline-offset-4 hover:underline"
                  >
                    Forgot your password?
                  </a>
                </div>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  defaultValue={formState.data.password ?? ''}
                  aria-invalid={!!formState.error?.body?.errors?.['password']}
                  disabled={isPending}
                  required
                />
                {displayError('password')}
              </Field>
              <Field>
                <Button type="submit" disabled={isPending}>
                  {isPending ? 'Signing in..' : 'Login'}
                </Button>
                <FieldDescription className="text-center">
                  Don&apos;t have an account? <a href="#">Sign up</a>
                </FieldDescription>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
      <FieldDescription className="px-6 text-center">
        By clicking continue, you agree to our <a href="#">Terms of Service</a>{" "}
        and <a href="#">Privacy Policy</a>.
      </FieldDescription>
    </div>
  )
}
