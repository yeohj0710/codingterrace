import getUser from "@/lib/getUser";
import Image from "next/image";
import Link from "next/link";

export default async function TopBar() {
  const user = await getUser();
  return (
    <header className="flex flex-row items-center justify-between fixed top-0 w-full bg-white z-50 h-14 shadow-md pl-6">
      <div className="flex flex-row items-center justify-start gap-[4%] w-full">
        <Link href="/" className="text-lg font-bold flex flex-row gap-2">
          <span>🍀 코딩테라스</span>
        </Link>
        <Link href="/board" className="font-bold">
          게시판
        </Link>
        <Link href="/notification" className="font-bold">
          알림 보내기
        </Link>
      </div>
      {user ? (
        <Link href="/profile" className="w-24 font-semibold">
          내 프로필
        </Link>
      ) : (
        <Link href="/login" className="w-20 font-semibold">
          로그인
        </Link>
      )}
    </header>
  );
}
