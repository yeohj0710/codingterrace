import Link from "next/link";
import { useEffect, useState } from "react";
import { menuItemClasses } from "./topbar";

export function MenuLinks() {
  return (
    <>
      <Link
        href="/technote"
        className={menuItemClasses(
          "font-bold whitespace-nowrap overflow-hidden text-ellipsis"
        )}
      >
        기술노트
      </Link>
      <Link
        href="/board"
        className={menuItemClasses(
          "font-bold whitespace-nowrap overflow-hidden text-ellipsis"
        )}
      >
        자유게시판
      </Link>
      <Link
        href="/weather"
        className={menuItemClasses(
          "font-bold whitespace-nowrap overflow-hidden text-ellipsis"
        )}
      >
        날씨 알리미
      </Link>
      <Link
        href="/notification"
        className={menuItemClasses(
          "font-bold whitespace-nowrap overflow-hidden text-ellipsis"
        )}
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
      className={menuItemClasses("flex items-center font-semibold")}
    >
      <span className="mr-2">내 프로필</span>
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt="프로필 이미지"
          className="w-8 h-8 rounded-full object-cover"
        />
      ) : (
        <div className="w-8 h-8 rounded-full bg-gray-300"></div>
      )}
    </Link>
  ) : (
    <Link href="/login" className={menuItemClasses("font-semibold")}>
      로그인
    </Link>
  );
}
