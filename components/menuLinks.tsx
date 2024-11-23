import Link from "next/link";
import { useEffect, useState } from "react";

export function MenuLinks() {
  return (
    <>
      <Link
        href="/technote"
        className="font-bold whitespace-nowrap overflow-hidden text-ellipsis"
      >
        기술노트
      </Link>
      <Link
        href="/board"
        className="font-bold whitespace-nowrap overflow-hidden text-ellipsis"
      >
        자유게시판
      </Link>
      <Link
        href="/python"
        className="font-bold whitespace-nowrap overflow-hidden text-ellipsis"
      >
        파이썬 테스트
      </Link>
      <Link
        href="/notification"
        className="font-bold whitespace-nowrap overflow-hidden text-ellipsis"
      >
        알림 보내기
      </Link>
    </>
  );
}

export function UserLink({ user }: { user: any }) {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  useEffect(() => {
    if (user?.avatar) {
      function extractAvatarUrl(url: string): string {
        return url.replace("/public", "/avatar");
      }
      setAvatarUrl(extractAvatarUrl(user.avatar));
    }
  }, [user]);
  return user ? (
    <Link
      href="/profile"
      className="flex items-center font-semibold whitespace-nowrap overflow-hidden text-ellipsis"
    >
      <span className="mr-2">내 프로필</span>
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt="프로필 이미지"
          className="w-8 h-8 rounded-full object-cover"
        />
      ) : (
        <div className="w-8 h-8 rounded-full bg-gray-300"></div> // Placeholder
      )}
    </Link>
  ) : (
    <Link
      href="/login"
      className="font-semibold whitespace-nowrap overflow-hidden text-ellipsis"
    >
      로그인
    </Link>
  );
}
