import Link from "next/link";
import { generatePageMetadata } from "@/lib/metadata";
import LoginForm from "@/components/loginForm";

export async function generateMetadata() {
  return generatePageMetadata("로그인", "/login");
}

export default function Login() {
  return (
    <div className="flex flex-col items-center">
      <div className="flex flex-col w-full sm:w-[512px] gap-6 py-8 px-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl">안녕하세요!</h1>
          <h2 className="text-xl">아이디와 비밀번호로 로그인해 주세요.</h2>
        </div>
        <LoginForm />
        <div className="flex flex-row gap-2">
          <span>계정이 없으신가요?</span>
          <Link href="/join" className="font-bold">
            계정 만들기 &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
}
