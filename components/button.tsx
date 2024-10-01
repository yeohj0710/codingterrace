"use client";

import { useFormStatus } from "react-dom";

interface ButtonProps {
  text: string;
}

export default function FormButton({ text }: ButtonProps) {
  const { pending } = useFormStatus();
  return (
    <button
      disabled={pending}
      className="button-green h-10 flex items-center justify-center"
    >
      {pending ? (
        <>
          로딩 중...
          <div className="ml-2 w-4 h-4 border-2 border-t-transparent border-white rounded-full animate-spin"></div>
        </>
      ) : (
        text
      )}
    </button>
  );
}
