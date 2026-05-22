import { ProjectDetailPage } from '@/components/Projects';

interface ProjectPageProps {
  params: Promise<{
    projectId: string;
  }>;
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { projectId } = await params;

  return <ProjectDetailPage projectId={projectId} />;
}
