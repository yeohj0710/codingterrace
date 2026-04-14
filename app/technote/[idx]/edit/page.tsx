import PostForm from "@/components/postForm";
import { isUserOperator } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function EditPostPage({
  params,
}: {
  params: { idx: string };
}) {
  if (!(await isUserOperator())) {
    redirect(`/technote/${params.idx}`);
  }

  return (
    <PostForm
      mode="edit"
      idx={params.idx}
      category="technote"
      basePath="/technote"
    />
  );
}
