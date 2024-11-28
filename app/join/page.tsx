import Link from "next/link";
import { generatePageMetadata } from "@/lib/metadata";
import JoinForm from "@/components/joinForm";

export async function generateMetadata() {
  return generatePageMetadata("회원가입", "/join");
}

export default function Join() {
  return (
    <div className="flex flex-col items-center">
      <div className="flex flex-col w-full sm:w-[512px] gap-6 py-8 px-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl">안녕하세요!</h1>
          <h2 className="text-xl">
            회원가입을 위해 아래의 양식을 작성해 주세요.
          </h2>
        </div>
        <JoinForm />
        <div className="flex flex-row gap-2">
          <span>이미 계정이 있으신가요?</span>
          <Link href="/login" className="font-bold">
            로그인하기 &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
}
