interface Props {
  params: Promise<{}>;
  searchParams: Promise<{}>;
}

async function AppMarketerClientsIdPage(props: Props) {
  const params = await props.params;

  return <>AppMarketerClientsId Page</>;
}

export default AppMarketerClientsIdPage;
