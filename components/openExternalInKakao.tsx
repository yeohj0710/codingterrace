"use client";

import { useEffect } from "react";
import { openExternalInKakao } from "@/lib/openExternalInKakao";

export default function OpenExternalInKakao({ path }: { path: string }) {
  useEffect(() => {
    openExternalInKakao(path);
  }, [path]);
  return null;
}
