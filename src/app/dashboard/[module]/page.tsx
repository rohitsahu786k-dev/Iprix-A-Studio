import { WorkspaceModule } from "@/components/workspace-module";

export default async function DashboardModulePage({ params }: { params: Promise<{ module: string }> }) {
  const { module } = await params;
  return <WorkspaceModule module={module} />;
}
