import { ContentView, type ContentParams } from "@/components/content/content-view";
import { requireOwner } from "@/lib/owner";
import { getAdminPosts, getAdminReviews, getAdminVideoGroups, getAdminVideos, getCourseOptions } from "@/lib/settings-data";

export const metadata = { title: "Nội dung" };

// Quản lý nội dung công khai: video, bài viết, đánh giá. Chỉ coach (owner) vào được.
export default async function NoiDungPage({ searchParams }: { searchParams: Promise<ContentParams> }) {
  const params = await searchParams;
  const session = await requireOwner();
  const coachId = session.coach.id;
  const [groups, videos, posts, reviews, courses] = await Promise.all([
    getAdminVideoGroups(coachId),
    getAdminVideos(coachId),
    getAdminPosts(coachId),
    getAdminReviews(coachId),
    getCourseOptions(coachId),
  ]);
  return <ContentView data={{ groups, videos, posts, reviews, courses }} params={params} />;
}
