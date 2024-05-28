import Image from "next/image";
import Link from "next/link";

export default function TopBar() {
  return (
    <header className="flex flex-row items-center justify-between fixed top-0 w-full bg-white z-50 h-14 shadow-md pl-6">
      <div className="flex flex-row items-center justify-start gap-[4%] w-full">
        <Link href="/" className="text-lg font-bold flex flex-row gap-2">
          <span>🍀 코딩테라스</span>
        </Link>
        <Link href="" className="font-bold">
          게시판
        </Link>
        <Link href="" className="font-bold">
          실시간 채팅
        </Link>
      </div>
      <Link href="/login" className="w-20 font-semibold">
        로그인
      </Link>
    </header>
  );
}
