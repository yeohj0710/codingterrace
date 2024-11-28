import BoardComponent from "@/components/boardComponent";
import OpenExternalInKakao from "@/components/openExternalInKakao";
import { generatePageMetadata } from "@/lib/metadata";

export async function generateMetadata() {
  return generatePageMetadata("자유게시판", "/board");
}

export default function BoardPage() {
  return (
    <div className="flex flex-col items-center sm:my-10">
      <BoardComponent
        category="board"
        title="자유게시판"
        basePath="/board"
        postsPerPage={10}
      />
      <OpenExternalInKakao path="/board" />
    </div>
  );
}
