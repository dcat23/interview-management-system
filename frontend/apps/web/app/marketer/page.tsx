interface Props {
  params: Promise<{}>;
  searchParams: Promise<{}>;
}

async function MarketerPage(props: Props) {
  const params = await props.params;

  return <>Marketer Page</>;
}

export default MarketerPage;
