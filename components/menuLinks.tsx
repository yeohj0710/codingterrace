import Link from "next/link";

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
        href="/notification"
        className="font-bold whitespace-nowrap overflow-hidden text-ellipsis"
      >
        알림 보내기
      </Link>
    </>
  );
}

export function UserLink({ user }: { user: any }) {
  return user ? (
    <Link
      href="/profile"
      className="font-semibold whitespace-nowrap overflow-hidden text-ellipsis"
    >
      내 프로필
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
