import PostForm from "@/components/postForm";
import { isUserOperator } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function AddPostPage() {
  if (!(await isUserOperator())) {
    redirect("/technote");
  }

  return <PostForm mode="add" category="technote" basePath="/technote" />;
}
