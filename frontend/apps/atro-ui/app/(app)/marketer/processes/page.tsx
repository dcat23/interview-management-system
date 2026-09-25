interface Props {
  params: Promise<{}>;
  searchParams: Promise<{}>;
}

async function AppMarketerProcessesPage(props: Props) {
  const params = await props.params;

  return <>AppMarketerProcesses Page</>;
}

export default AppMarketerProcessesPage;
