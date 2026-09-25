interface Props {
  params: Promise<{}>;
  searchParams: Promise<{}>;
}

async function AppMarketerClientsPage(props: Props) {
  const params = await props.params;

  return <>AppMarketerClients Page</>;
}

export default AppMarketerClientsPage;
