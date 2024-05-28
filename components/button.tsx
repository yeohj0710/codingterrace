"use client";

import { useFormStatus } from "react-dom";

interface ButtonProps {
  text: string;
}

export default function FormButton({ text }: ButtonProps) {
  const { pending } = useFormStatus();
  return (
    <button disabled={pending} className="green-button h-10">
      {pending ? "로딩 중..." : text}
    </button>
  );
}
