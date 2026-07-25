interface Props {
  params: Promise<{}>;
  searchParams: Promise<{}>;
}

async function SupporterPage(props: Props) {
  const params = await props.params;

  return <>Supporter Page</>;
}

export default SupporterPage;
