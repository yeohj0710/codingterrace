import BoardComponent from "@/components/boardComponent";

export default function BoardPage() {
  return (
    <div className="flex flex-col items-center sm:my-10">
      <BoardComponent
        category="board"
        title="자유게시판"
        basePath="/board"
        postsPerPage={10}
      />
    </div>
  );
}
