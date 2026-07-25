interface Props {
  params: Promise<{}>;
  searchParams: Promise<{}>;
}

async function AdminPage(props: Props) {
  const params = await props.params;

  return <>Admin Page</>;
}

export default AdminPage;
