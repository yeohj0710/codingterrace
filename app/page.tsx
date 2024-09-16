import { getPosts } from "./board/actions";
import HomeClient from "./client";

export default async function Home() {
  const posts = await getPosts();
  return <HomeClient posts={posts} />;
}
