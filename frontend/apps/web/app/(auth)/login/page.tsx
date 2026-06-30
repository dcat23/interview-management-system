interface Props {
  params: Promise<{}>;
  searchParams: Promise<{}>;
}

async function LoginPage(props: Props) {
  const params = await props.params;

  return <>Login Page</>;
}

export default LoginPage;
