import Board from "@/components/board";

export default async function BoardOnly() {
  return (
    <div className="flex flex-col items-center my-5 sm:my-10">
      <Board />
    </div>
  );
}
