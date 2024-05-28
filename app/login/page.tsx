"use client";

import FormInput from "@/components/input";
import FormButton from "@/components/button";
import { useFormState } from "react-dom";
import { login } from "./actions";
import Link from "next/link";

export default function () {
  const [state, action] = useFormState(login, null);
  return (
    <div className="flex flex-col gap-6 py-8 px-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl">안녕하세요!</h1>
        <h2 className="text-xl">아이디와 비밀번호로 로그인해 주세요.</h2>
      </div>
      <form action={action} className="flex flex-col gap-3">
        <FormInput
          name="id"
          type="text"
          placeholder="아이디"
          required
          errors={state?.fieldErrors.id}
        />
        <FormInput
          name="password"
          type="password"
          placeholder="비밀번호"
          required
          errors={state?.fieldErrors.password}
        />
        <FormButton text="로그인" />
      </form>
      <div className="flex flex-row gap-2">
        <span>계정이 없으신가요?</span>
        <Link href="/join" className="font-bold">
          계정 만들기 &rarr;
        </Link>
      </div>
    </div>
  );
}
