import EditorClient from "/EditorClient";

type EditorPageProps = {
  searchParams: Promise<{
    id?: string;
  }>;
};

export default async function EditorPage({
  searchParams,
}: EditorPageProps) {
  const params = await searchParams;

  const projectId = params.id ?? null;

  return <EditorClient projectId={projectId} />;
}