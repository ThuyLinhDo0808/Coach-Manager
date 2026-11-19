import { TeamView } from "@/components/team-view";
import { requirePerm } from "@/lib/auth";

export const metadata = { title: "Coach" };

export default async function Page() {
  const session = await requirePerm("doi-ngu");
  return <TeamView session={session} role="coach" />;
}
