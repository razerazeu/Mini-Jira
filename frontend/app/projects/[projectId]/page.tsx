'use client';

import { ProjectDetailPage } from '@/components/Projects';

interface ProjectPageProps {
  params: {
    projectId: string;
  };
}

export default function ProjectPage({ params }: ProjectPageProps) {
  return <ProjectDetailPage projectId={params.projectId} />;
}
