interface Props {
  params: Promise<{}>;
  searchParams: Promise<{}>;
}

async function MarketerProcessesPage(props: Props) {
  const params = await props.params;

  return <>MarketerProcesses Page</>;
}

export default MarketerProcessesPage;
