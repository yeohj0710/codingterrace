import BoardComponent from "@/components/boardComponent";

export default function TechnotePage() {
  return (
    <div className="flex flex-col items-center sm:my-10">
      <BoardComponent
        category="technote"
        title="기술노트"
        basePath="/technote"
        postsPerPage={10}
      />
    </div>
  );
}
