import { LoginForm } from "@feature/auth";

interface Props {
  params: Promise<{}>;
  searchParams: Promise<{}>;
}

async function LoginPage(props: Props) {
  const params = await props.params;

  return (
    <LoginForm />
  );
}

export default LoginPage;
