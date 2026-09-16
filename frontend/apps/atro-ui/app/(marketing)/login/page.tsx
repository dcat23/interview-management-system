import { LoginForm } from '@app/atro-ui/components/auth/login-form';

export default function LoginPage() {
  return (
    <div className="relative flex min-h-[calc(100svh-4rem-1px)] flex-col items-center justify-center overflow-hidden px-4 py-16">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[24rem] bg-gradient-to-b from-primary/10 via-transparent to-transparent"
      />

      <div className="w-full max-w-sm">
        <LoginForm />
      </div>
    </div>
  );
}
