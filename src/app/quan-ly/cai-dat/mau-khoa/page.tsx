import { CoursesView } from "@/components/settings/courses-view";
import { requireOwner } from "@/lib/owner";
import { getAdminVenues, getClassCounts, getCourseTemplates } from "@/lib/settings-data";

export const metadata = { title: "Gói buổi" };

export default async function MauKhoaPage({ searchParams }: { searchParams: Promise<{ id?: string; moi?: string }> }) {
  const { id, moi } = await searchParams;
  const session = await requireOwner();
  const [courses, classCounts, venues] = await Promise.all([
    getCourseTemplates(session.coach.id),
    getClassCounts(session.coach.id),
    getAdminVenues(session.coach.id),
  ]);
  return <CoursesView courses={courses} classCounts={classCounts} venues={venues} selectedId={id} isNew={Boolean(moi)} />;
}
