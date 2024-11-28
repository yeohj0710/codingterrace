"use client";

import { useFormState } from "react-dom";
import FormInput from "@/components/input";
import FormButton from "@/components/button";
import { join } from "@/app/join/actions";

export default function JoinForm() {
  const [state, action] = useFormState(join, null);
  return (
    <form action={action} className="flex flex-col gap-3">
      <FormInput
        name="id"
        type="text"
        placeholder="아이디"
        errors={state?.fieldErrors.id}
      />
      <FormInput
        name="password"
        type="password"
        placeholder="비밀번호"
        errors={state?.fieldErrors.password}
      />
      <FormInput
        name="confirm_password"
        type="password"
        placeholder="비밀번호 확인"
        errors={state?.fieldErrors.confirm_password}
      />
      <FormInput
        name="nickname"
        type="text"
        placeholder="닉네임"
        errors={state?.fieldErrors.nickname}
      />
      <FormButton text="회원가입" />
    </form>
  );
}
