interface Props {
  params: Promise<{}>;
  searchParams: Promise<{}>;
}

async function AppMarketerProcessesIdPage(props: Props) {
  const params = await props.params;

  return <>AppMarketerProcessesId Page</>;
}

export default AppMarketerProcessesIdPage;
