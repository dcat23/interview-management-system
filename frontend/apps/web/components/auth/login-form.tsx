"use client"

import { cn } from "@app/web/lib/ui/utils"
import { Button } from "@feature/ui/components/ui/common/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@feature/ui/components/ui/common/card"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@feature/ui/components/ui/common/field"
import { Input } from "@feature/ui/components/ui/common/input"
import { ApiResponse } from "@next-feature/client"
import { loginFormAction, LoginRequest } from "@feature/auth/server"
import { useRouter } from "next/navigation"
import { useActionState, useEffect } from "react"
import { toast } from "sonner"
import { LoginButton } from "./login-button"

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

  useEffect(() => {
    if (!formState.message) return;

    if (formState.success) {
      toast.success(formState.message, {
        description: "Redirecting..."
      });
    } else if (formState.error) {
      toast.error(formState.message);
    }
  }, [formState.message, formState.success, formState.error]);

  const displayError = (key: string) => {
    if (formState?.error?.body?.errors && formState.error.body.errors[key]) {
      return (
        <FieldError errors={[{ message: formState.error.body.errors[key] }]} />
      );
    }
    return null;
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
              <Field data-invalid={!!formState.error?.body?.errors?.['email']}>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  defaultValue={formState.data.email ?? ''}
                  aria-invalid={!!formState.error?.body?.errors?.['email']}
                  disabled={isPending}
                  placeholder="me@evaitcs.com"
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
                  placeholder="*******"
                  defaultValue={formState.data.password ?? ''}
                  aria-invalid={!!formState.error?.body?.errors?.['password']}
                  disabled={isPending}
                  required
                />
                {displayError('password')}
              </Field>
              <Field>
                <LoginButton success={formState.success} />
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
