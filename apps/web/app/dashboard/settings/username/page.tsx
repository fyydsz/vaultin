import { redirect } from "next/navigation";

export default function UsernameRedirectPage() {
  redirect("/dashboard/settings/account");
}
