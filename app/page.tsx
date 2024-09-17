import NotificationPanel from "@/components/notificationPanel";
import { getPosts } from "./board/actions";
import HomeClient from "./client";

export default async function Home() {
  const posts = await getPosts();
  return (
    <div className="flex flex-col items-center mb-10">
      <NotificationPanel />
      <HomeClient posts={posts} />
      <div className="text-7xl mt-10 mb-5">🍀</div>
    </div>
  );
}
