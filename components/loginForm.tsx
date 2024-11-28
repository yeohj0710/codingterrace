"use client";

import { useFormState } from "react-dom";
import FormInput from "@/components/input";
import FormButton from "@/components/button";
import { login } from "@/app/login/actions";

export default function LoginForm() {
  const [state, action] = useFormState(login, null);
  return (
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
  );
}
