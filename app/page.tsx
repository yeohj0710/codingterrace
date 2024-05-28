export default function Home() {
  return (
    <div className="flex flex-col h-[150vh] bg-white p-5 gap-2 relative">
      <div className="flex flex-row gap-[2%]">
        <span className="font-bold">게시판</span>
        <button className="bg-green-400 px-2 py-[0.5px] rounded-md">
          <span className="text-sm font-semibold text-white">글쓰기</span>
        </button>
      </div>
      <div className="mt-20 w-full h-[50vh] bg-green-400 rounded-lg p-5">
        <span className="font-bold text-white">실시간 채팅</span>
      </div>
      <div className="text-7xl mt-20">🍀</div>
    </div>
  );
}
