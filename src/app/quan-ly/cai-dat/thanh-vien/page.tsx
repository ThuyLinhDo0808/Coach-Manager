import { MembersView } from "@/components/settings/members-view";
import { requireOwner } from "@/lib/owner";
import { getSettings } from "@/lib/settings";
import { getMemberRows, getPendingInvites } from "@/lib/settings-data";

export const metadata = { title: "Phân quyền" };

export default async function ThanhVienPage({ searchParams }: { searchParams: Promise<{ sua?: string }> }) {
  const { sua } = await searchParams;
  const session = await requireOwner();
  const [members, invites] = await Promise.all([getMemberRows(session.coach.id), getPendingInvites(session.coach.id)]);
  return <MembersView members={members} invites={invites} settings={getSettings(session.coach.settings)} selfId={session.userId} editId={sua} />;
}
