import { LoginForm } from "@feature/auth";
import { loginFormAction } from "@feature/auth/server";

interface Props {
  params: Promise<{}>;
  searchParams: Promise<{}>;
}

async function LoginPage(props: Props) {
  const params = await props.params;

  return (
    <LoginForm action={loginFormAction} />
  );
}

export default LoginPage;
