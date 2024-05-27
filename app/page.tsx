import Image from "next/image";

export default function Home() {
  return (
    <div className="flex flex-col h-[150vh] bg-white p-5 gap-2 relative">
      <div className="flex flex-row gap-[2%]">
        <span className="font-bold">게시판</span>
        <button className="bg-gray-200 px-2 py-[0.5px] rounded-md">
          <span className="text-sm font-semibold">글쓰기</span>
        </button>
      </div>
      <div className="mt-20 w-full h-[50vh] bg-gray-300 rounded-lg p-5">
        <span className="font-bold">실시간 채팅</span>
      </div>
    </div>
  );
}
