import { redirect } from "next/navigation";

export default async function RootVaultRedirect({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/dashboard/vaults/${id}`);
}
