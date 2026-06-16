import { AdminResource } from "@/components/admin-resource";

export default async function AdminSectionPage({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  return <AdminResource resource={section} />;
}
