import BoardComponent from "@/components/boardComponent";
import OpenExternalInKakao from "@/components/openExternalInKakao";
import { generatePageMetadata } from "@/lib/metadata";

export async function generateMetadata() {
  return generatePageMetadata("기술노트", "/technote");
}

export default function TechnotePage() {
  return (
    <div className="flex flex-col items-center sm:my-10">
      <BoardComponent
        category="technote"
        title="기술노트"
        basePath="/technote"
        postsPerPage={8}
      />
      <OpenExternalInKakao path="/technote" />
    </div>
  );
}
