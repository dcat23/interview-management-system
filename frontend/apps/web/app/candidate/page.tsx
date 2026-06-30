interface Props {
  params: Promise<{}>;
  searchParams: Promise<{}>;
}

async function CandidatePage(props: Props) {
  const params = await props.params;

  return <>Candidate Page</>;
}

export default CandidatePage;
