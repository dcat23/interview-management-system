interface Props {
  params: Promise<{}>;
  searchParams: Promise<{}>;
}

async function AppSessionsIdPage(props: Props) {
  const params = await props.params;

  return <>AppSessionsId Page</>;
}

export default AppSessionsIdPage;
