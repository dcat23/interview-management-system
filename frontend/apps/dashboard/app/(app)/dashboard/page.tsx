interface Props {
  params: Promise<{}>;
  searchParams: Promise<{}>;
}

async function AppDashboardPage(props: Props) {
  const params = await props.params;

  return <>AppDashboard Page</>;
}

export default AppDashboardPage;
