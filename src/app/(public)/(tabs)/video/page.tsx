import type { Metadata } from "next";
import { VideoGallery } from "@/components/video-gallery";
import { getVideoGroups, getVideos } from "@/lib/data";

export const metadata: Metadata = { title: "Kho video" };
export const revalidate = 60;

export default async function VideoPage() {
  const [groups, videos] = await Promise.all([getVideoGroups(), getVideos()]);
  return <VideoGallery groups={groups} videos={videos} />;
}
