interface Props {
  params: Promise<{}>;
  searchParams: Promise<{}>;
}

async function SessionPage(props: Props) {
  const params = await props.params;

  return <>Session Page</>;
}

export default SessionPage;
