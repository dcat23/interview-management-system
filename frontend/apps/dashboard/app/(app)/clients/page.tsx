interface Props {
  params: Promise<{}>;
  searchParams: Promise<{}>;
}

async function AppClientsPage(props: Props) {
  const params = await props.params;

  return <>AppClients Page</>;
}

export default AppClientsPage;
