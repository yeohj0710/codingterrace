export default function Chat() {
  return (
    <div className="flex flex-col h-[150vh] bg-white p-5 gap-5 relative">
      <span className="font-bold">실시간 채팅</span>
      <input className="w-full h-12 border-green-400 border-2 transition-colors focus:outline-none focus:border-green-500 px-2.5" />
    </div>
  );
}
