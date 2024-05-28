"use client";

import FormInput from "@/components/input";
import FormButton from "@/components/button";
import { useFormState } from "react-dom";
import { login } from "./actions";

export default function Login() {
  const [state, dispatch] = useFormState(login, null);
  return (
    <div className="flex flex-col gap-10 py-8 px-6">
      <div className="flex flex-col gap-2 *:font-medium">
        <h1 className="text-2xl">안녕하세요!</h1>
        <h2 className="text-xl">이메일과 비밀번호로 로그인 해 주세요.</h2>
      </div>
      <form action={dispatch} className="flex flex-col gap-3">
        <FormInput name="email" type="email" placeholder="이메일" required />
        <FormInput
          name="password"
          type="password"
          placeholder="비밀번호"
          required
        />
        <FormButton text="로그인" />
      </form>
    </div>
  );
}
